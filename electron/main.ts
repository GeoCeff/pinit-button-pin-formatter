import { app, BrowserWindow, dialog, ipcMain, session } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { ChildProcess } from 'node:child_process'
import sharp from 'sharp'
import { LIMITS, mmToPixels, newProject, type Preset, type Project } from '../src/core/model'
import { parseProject } from '../src/core/validation'
import { buildSheetPlan } from '../src/core/layout'
import type { SheetPlan } from '../src/core/layout'
import { checkExportSize } from '../src/render/spec'
import { atomicWrite, boundedRead, checkProfile, containedFile, decodeImage, images, profiles, isInside } from './files'
import { convertCmyk, verifyPdf } from './color'

let window: BrowserWindow
let dirty = false
let fileBusy = false
const locations = new Map<string,string>()
const runtime = () => app.isPackaged ? path.join(process.resourcesPath,'ghostscript') : path.join(app.getAppPath(),'resources','ghostscript')
interface Job { id: string; stage: string; destination: string; project: Project; plan: SheetPlan; files: Set<string>; child?: ChildProcess; canceled: boolean; finishing: boolean; writing: boolean; bytes: number }
// One process owns the session. No shared database or background sync is needed.
let job: Job | undefined
function sender(event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent): void {
  if (event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) throw new Error('Unauthorized desktop message.')
}
function handle(name: string, fn: (...args: any[]) => any, exclusive = false): void {
  ipcMain.handle(`pinit:${name}`, async (event,...args) => {
    sender(event)
    if (exclusive && fileBusy) throw new Error('Another file operation is active. Try again when it finishes.')
    if (exclusive) fileBusy = true
    try { return await fn(...args) } catch (error) { throw new Error((error as Error).message) }
    finally { if (exclusive) fileBusy = false }
  })
}
async function importFiles(multiple: boolean) {
  const result = await dialog.showOpenDialog(window,{title: multiple ? 'Import artwork' : 'Relink artwork',properties:multiple ? ['openFile','multiSelections'] : ['openFile'],filters:[{name:'Artwork',extensions:['png','jpg','jpeg']}]})
  if (result.canceled) return []
  if (result.filePaths.length + images.size > LIMITS.assets) throw new Error('A session supports at most 500 images.')
  const added: string[] = []
  try {
    const imported = []
    for (const file of result.filePaths) { const image = await decodeImage(await boundedRead(file,LIMITS.fileBytes),file); added.push(image.asset.id); imported.push(image) }
    return imported
  } catch (error) { for (const id of added) images.delete(id); throw error }
}
async function cleanup(active: typeof job): Promise<void> {
  if (!active) return
  active.canceled = true
  if (active.child && active.child.exitCode === null && active.child.signalCode === null) await new Promise<void>(resolve=>{active.child!.once('exit',()=>resolve());active.child!.kill()})
  // stage is created by mkdtemp below, never supplied by the renderer.
  if(!isInside(path.dirname(active.destination),path.resolve(active.stage))||!path.basename(active.stage).startsWith('.pinit-'))throw new Error('Invalid temporary export directory.')
  await fs.rm(active.stage,{recursive:true,force:true})
}
async function loadPresets(): Promise<Preset[]> {
  try {
    const raw = JSON.parse((await boundedRead(path.join(app.getPath('userData'),'presets.json'),LIMITS.projectBytes)).toString())
    if (!Array.isArray(raw) || raw.length > 100) throw new Error('Invalid presets file.')
    return raw.map(p => { const example = newProject(); example.settings=p.settings; parseProject(example); if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 100) throw new Error('Invalid preset name.'); return p })
  } catch(error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error }
}
function register(): void {
  handle('reset',()=>{if(job)throw new Error('Cancel the current export first.');images.clear();profiles.clear();locations.clear()},true)
  handle('import',()=>importFiles(true),true)
  handle('relink',async()=>(await importFiles(false))[0] ?? null,true)
  handle('runtime',async()=>({cmyk:await fs.access(path.join(runtime(),'bin','gswin64c.exe')).then(()=>true,()=>false)}))
  handle('profile',async()=>{
    const result=await dialog.showOpenDialog(window,{properties:['openFile'],filters:[{name:'CMYK profile',extensions:['icc','icm']}]})
    if(result.canceled)return null
    const bytes=await boundedRead(result.filePaths[0],16*1024*1024);checkProfile(bytes)
    if(profiles.size>=16||[...profiles.values()].reduce((n,b)=>n+b.length,bytes.length)>64*1024*1024)throw new Error('This session has reached its ICC profile budget (16 profiles / 64 MB). Save and reopen the project before importing another.')
    const id=randomUUID();profiles.set(id,bytes);return id
  },true)
  handle('open',async()=>{
    const result=await dialog.showOpenDialog(window,{title:'Open project.json',properties:['openFile'],filters:[{name:'PinIt project',extensions:['json']}]})
    if(result.canceled)return null
    const file=result.filePaths[0];const root=path.dirname(file)
    const project=parseProject(JSON.parse((await boundedRead(file,LIMITS.projectBytes)).toString()))
    const oldImages=new Map(images);const oldProfiles=new Map(profiles);images.clear();profiles.clear()
    try {
      const imported=[];const missing=[]
      for(const asset of project.assets) {
        try { imported.push(await decodeImage(await boundedRead(await containedFile(root,asset.path),LIMITS.fileBytes),asset.path,asset)) }
        catch { missing.push(asset.id) }
      }
      let profileMissing=false
      if(project.settings.output.profile) {
        const id=project.settings.output.profile
        try {const bytes=await boundedRead(await containedFile(root,`assets/${id}.icc`),16*1024*1024);checkProfile(bytes);profiles.set(id,bytes)}
        catch { profileMissing=true }
      }
      locations.set(project.id,root);return {project,images:imported,missing,profileMissing,location:root}
    } catch(error) {images.clear();profiles.clear();for(const [id,data] of oldImages)images.set(id,data);for(const [id,data] of oldProfiles)profiles.set(id,data);throw error}
  },true)
  handle('save',async(raw:unknown,saveAs:unknown)=>{
    const project=parseProject(raw)
    if(typeof saveAs!=='boolean')throw new Error('Invalid save request.')
    let root=saveAs ? undefined : locations.get(project.id)
    const creating=!root
    if(!root) {
      const result=await dialog.showOpenDialog(window,{title:'Choose a parent folder for the new PinIt project',properties:['openDirectory','createDirectory']})
      if(result.canceled)return null
      root=path.join(result.filePaths[0],`PinIt-${project.id}-${randomUUID().slice(0,8)}`);await fs.mkdir(root)
    }
    const realRoot=await fs.realpath(root)
    await fs.mkdir(path.join(realRoot,'assets'),{recursive:true})
    if(await fs.realpath(path.join(realRoot,'assets'))!==path.join(realRoot,'assets'))throw new Error('The assets directory must not be a symbolic link.')
    for(const asset of project.assets) {
      const data=images.get(asset.id)
      if(data)await atomicWrite(path.join(realRoot,asset.path),data.original)
      else if(creating)throw new Error('Relink missing artwork before saving a copy.')
      // Missing sources in an opened project retain their manifest and edits.
    }
    const profile=project.settings.output.profile
    if(profile){const bytes=profiles.get(profile);if(!bytes)throw new Error('Reimport the missing ICC profile.');await atomicWrite(path.join(realRoot,'assets',`${profile}.icc`),bytes)}
    await atomicWrite(path.join(realRoot,'project.json'),JSON.stringify(project,null,2));locations.set(project.id,realRoot);return realRoot
  },true)
  handle('presets',loadPresets)
  handle('preset-save',async(preset:Preset)=>{
    const example=newProject();example.settings=preset?.settings;parseProject(example)
    if(typeof preset.name!=='string'||!preset.name.trim()||preset.name.length>100||preset.settings.output.profile!==null)throw new Error('Preset names need 1–100 characters. Use the bundled profile in reusable presets.')
    const saved=await loadPresets();const next=saved.filter(p=>p.name!==preset.name);if(next.length>=100)throw new Error('At most 100 named presets are supported.')
    next.push(preset);await atomicWrite(path.join(app.getPath('userData'),'presets.json'),JSON.stringify(next))
  },true)
  handle('export-begin',async(raw:unknown)=>{
    if(job)throw new Error('An export is already active.')
    const project=parseProject(raw);const result=buildSheetPlan(project);if(!result.ok)throw new Error(result.error)
    checkExportSize({project,plan:result.plan})
    for(const design of project.designs)if(design.quantity&&!images.has(design.assetId))throw new Error('Relink missing artwork before exporting.')
    if(project.settings.output.format==='pdf'&&project.settings.output.color==='cmyk'&&project.settings.output.profile&&!profiles.has(project.settings.output.profile))throw new Error('The custom ICC profile is missing. Import it again or select the bundled generic profile.')
    if(project.settings.output.format==='pdf'&&project.settings.output.color==='cmyk')await fs.access(path.join(runtime(),'bin','gswin64c.exe')).catch(()=>{throw new Error('The CMYK runtime is missing. Prepare resources or reinstall the complete app. RGB export is available explicitly.')})
    const resultDir=await dialog.showOpenDialog(window,{title:'Choose export folder',properties:['openDirectory','createDirectory']})
    if(resultDir.canceled)return null
    const parent=await fs.realpath(resultDir.filePaths[0]);const stage=await fs.mkdtemp(path.join(parent,'.pinit-'))
    const id=randomUUID();job={id,stage,destination:path.join(parent,`PinIt-export-${new Date().toISOString().replace(/[:.]/g,'-')}-${id.slice(0,6)}`),project,plan:result.plan,files:new Set(),canceled:false,finishing:false,writing:false,bytes:0};return id
  },true)
  handle('export-write',async(id:unknown,name:unknown,bytes:unknown)=>{
    const active=job
    if(!active||id!==active.id||active.canceled||active.finishing||active.writing)throw new Error('Export is not accepting files.')
    const format=active.project.settings.output.format
    const expected=format==='pdf'?'sheets.pdf':`sheet-${String(active.files.size+1).padStart(4,'0')}.${format}`
    if(name!==expected||active.files.has(expected)||!(bytes instanceof Uint8Array)||bytes.byteLength>LIMITS.rasterBytes||active.bytes+bytes.byteLength>1024**3)throw new Error('Invalid export file or job exceeds the 1 GB output budget.')
    if(format!=='pdf'&&active.files.size>=active.plan.sheets.length)throw new Error('Too many sheets.')
    active.writing=true
    try {
      const buffer=Buffer.from(bytes)
      if(format==='pdf')await verifyPdf(buffer,active.plan.width,active.plan.height,active.plan.sheets.length,false)
      else {
        const info=await sharp(buffer,{limitInputPixels:LIMITS.rasterBytes/4}).metadata();const dpi=active.project.settings.output.dpi
        if(info.format!==(format==='jpg'?'jpeg':'png')||info.width!==mmToPixels(active.plan.width,dpi)||info.height!==mmToPixels(active.plan.height,dpi)||!info.density||Math.abs(info.density-dpi)>1)throw new Error('Raster verification failed: size or resolution metadata changed.')
      }
      if(active.canceled)throw new Error('Export canceled.')
      await fs.writeFile(path.join(active.stage,expected),buffer,{flag:'wx'});active.files.add(expected);active.bytes+=buffer.length
    } finally {active.writing=false}
  })
  handle('export-finish',async(id:unknown)=>{
    const active=job
    if(!active||active.id!==id||active.finishing||active.writing||active.canceled)throw new Error('Export is not ready.')
    active.finishing=true
    try {
      const {output}=active.project.settings
      if(active.files.size!==(output.format==='pdf'?1:active.plan.sheets.length))throw new Error('The export is incomplete.')
      if(output.format==='pdf'&&output.color==='cmyk') {
        window.webContents.send('pinit:progress','Converting and checking CMYK artwork…')
        const profile=output.profile?path.join(active.stage,'profile.icc'):path.join(runtime(),'iccprofiles','default_cmyk.icc')
        if(output.profile){const bytes=profiles.get(output.profile);if(!bytes)throw new Error('CMYK profile is unavailable.');await fs.writeFile(profile,bytes)}
        await convertCmyk(runtime(),path.join(active.stage,'sheets.pdf'),path.join(active.stage,'converted.pdf'),profile,output.intent,child=>{active.child=child;if(active.canceled)child.kill()})
        if(active.canceled)throw new Error('Export canceled.')
        await verifyPdf(await boundedRead(path.join(active.stage,'converted.pdf'),LIMITS.rasterBytes),active.plan.width,active.plan.height,active.plan.sheets.length,true)
        await fs.rename(path.join(active.stage,'converted.pdf'),path.join(active.stage,'sheets.pdf'))
        if(output.profile)await fs.rm(profile)
      }
      if(active.canceled)throw new Error('Export canceled.')
      // Commit is a single directory rename. Existing exports are never replaced.
      await fs.rename(active.stage,active.destination);job=undefined;return active.destination
    } catch(error) {await cleanup(active);if(job===active)job=undefined;throw error}
  })
  handle('export-cancel',async(id:unknown)=>{
    const active=job;if(!active||id!==active.id)return
    active.canceled=true
    if(active.finishing){active.child?.kill();return}
    while(active.writing)await new Promise(resolve=>setTimeout(resolve,20))
    await cleanup(active);if(job===active)job=undefined
  })
  ipcMain.on('pinit:dirty',(event,value)=>{sender(event);if(typeof value==='boolean')dirty=value})
}

if(!app.isPackaged&&process.env.PINIT_TEST_DATA)app.setPath('userData',path.resolve(process.env.PINIT_TEST_DATA))
if(!app.requestSingleInstanceLock())app.quit()
else {
app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus()}})
app.whenReady().then(()=>{
  app.setAppUserModelId('app.pinit.desktop')
  window=new BrowserWindow({width:1500,height:960,minWidth:1080,minHeight:720,title:'PinIt',icon:app.isPackaged?path.join(process.resourcesPath,'icon.png'):path.join(app.getAppPath(),'resources','icon.png'),backgroundColor:'#f1f7f9',webPreferences:{preload:path.join(__dirname,'../preload/index.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}})
  window.setMenuBarVisibility(false)
  session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false))
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}))
  window.webContents.on('will-navigate',event=>event.preventDefault())
  let closing=false
  window.on('close',event=>{
    if(closing)return
    if(job||dirty){const response=dialog.showMessageBoxSync(window,{type:'question',buttons:['Keep editing','Discard changes and close'],defaultId:0,cancelId:0,message:job?'An export is running. Close and cancel it?':'There are unsaved changes. Close without saving?'});if(response===0){event.preventDefault();return}}
    if(job){
      event.preventDefault();closing=true
      const active=job;active.canceled=true;active.child?.kill()
      void(async()=>{
        while(job===active&&(active.writing||active.finishing))await new Promise(resolve=>setTimeout(resolve,20))
        if(job===active){await cleanup(active);job=undefined}
        window.destroy()
      })().catch(()=>{closing=false;dialog.showErrorBox('Export cleanup failed','Wait for the export to stop, then try closing again.')})
    }
  })
  register()
  if(process.env.ELECTRON_RENDERER_URL)void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  else void window.loadFile(path.join(__dirname,'../renderer/index.html'))
})
app.on('window-all-closed',()=>app.quit())
}
