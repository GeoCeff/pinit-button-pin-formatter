import { _electron as electron, expect } from '@playwright/test'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import sharp from 'sharp'

const root=path.resolve('local-data',`close-${Date.now()}`)
const captures=path.resolve('.impeccable/review')
await mkdir(root,{recursive:true});await mkdir(captures,{recursive:true})
const fixture=path.join(root,'Garden club.png')
await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="#e9d8b4"/><circle cx="400" cy="400" r="290" fill="#315e4c"/><text x="400" y="425" text-anchor="middle" font-family="Arial" font-size="72" fill="#fff4db">GARDEN CLUB</text></svg>')).png().toFile(fixture)
let sequence=0
async function run(name,test,{nativeCalls=0}={}) {
  const app=await electron.launch({executablePath:process.env.PINIT_EXECUTABLE,args:process.env.PINIT_EXECUTABLE?[]:['.'],env:{...process.env,PINIT_TEST_DATA:path.join(root,`app-${++sequence}`)},timeout:60000})
  const electronProcess=app.process()
  const errors=[]
  try {
    const page=await app.firstWindow();page.on('pageerror',error=>errors.push(error.message))
    await page.getByRole('button',{name:'Skip tour',exact:true}).click()
    await app.evaluate(({dialog})=>{globalThis.__nativeCloseCalls=0;dialog.showMessageBoxSync=()=>{globalThis.__nativeCloseCalls++;return 0}})
    const choose=paths=>app.evaluate(({dialog},paths)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:paths})},paths)
    const request=()=>app.evaluate(({BrowserWindow})=>{BrowserWindow.getAllWindows()[0].close()})
    const closeDialog=page.locator('.close-dialog')
    await test({app,page,choose,request,closeDialog})
    if(electronProcess.exitCode===null)assert.equal(await app.evaluate(()=>globalThis.__nativeCloseCalls),nativeCalls,'normal close uses the in-app dialog')
    assert.deepEqual(errors,[],'renderer has no errors')
    console.log(`PASS ${name}`)
  } finally {
    if(electronProcess.exitCode===null){await app.evaluate(({BrowserWindow})=>{for(const window of BrowserWindow.getAllWindows())window.destroy()}).catch(()=>{});await app.close().catch(()=>{})}
  }
}
const finish=async(app,action)=>{const closed=app.waitForEvent('close');await action();await closed}
let savedProject
await run('clean project closes directly',async({app,request})=>{await finish(app,request)})
await run('safe default, keyboard, nested dialogs, save cancellation, retry and original artwork',async({app,page,choose,request,closeDialog})=>{
  await choose([fixture]);await page.getByRole('button',{name:'Import artwork',exact:true}).click()
  await expect(page.locator('.project-save-state')).toHaveText('Unsaved changes')
  const projectName=page.getByLabel('Project name',{exact:true})
  await projectName.fill('Garden club · weekend print run')
  await request();await expect(closeDialog).toBeVisible()
  await expect(closeDialog.getByRole('button',{name:'Keep editing',exact:true})).toBeFocused()
  await expect(closeDialog).toHaveAttribute('role','alertdialog')
  assert.ok(await closeDialog.evaluate(node=>node.matches(':modal')))
  assert.ok(await page.evaluate(()=>{document.querySelector('[aria-label="Project name"]').focus();return document.querySelector('.close-dialog').contains(document.activeElement)}),'background is inert')
  await request();await expect(closeDialog).toHaveCount(1)
  await page.screenshot({animations:'disabled',path:path.join(captures,'close-confirmation.png')})
  await closeDialog.screenshot({animations:'disabled',path:path.join(captures,'close-confirmation-dialog.png')})
  await page.keyboard.press('Escape');await expect(closeDialog).toHaveCount(0);await expect(projectName).toBeFocused()
  await expect(projectName).toHaveValue('Garden club · weekend print run')
  await projectName.fill('Unbroken'+ 'projectname'.repeat(18))
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1080,720))
  await request();await page.screenshot({animations:'disabled',path:path.join(captures,'close-confirmation-long-name.png')})
  assert.ok(await closeDialog.evaluate(node=>node.scrollWidth<=node.clientWidth),'long name does not overflow')
  for(const button of await closeDialog.getByRole('button').all()){
    const box=await button.boundingBox();const dialogBox=await closeDialog.boundingBox()
    assert.ok(box.x>=dialogBox.x&&box.x+box.width<=dialogBox.x+dialogBox.width,'buttons fit inside dialog')
  }
  await closeDialog.getByRole('button',{name:'Keep editing',exact:true}).click()
  await projectName.fill('Garden club · weekend print run')
  await page.getByRole('button',{name:'Library',exact:true}).click()
  await page.getByRole('button',{name:'Remove Garden club',exact:true}).click()
  await request();await expect(page.getByRole('alertdialog')).toHaveCount(2)
  await page.keyboard.press('Escape');await expect(closeDialog).toHaveCount(0)
  await expect(page.getByRole('alertdialog',{name:'Remove artwork?',exact:true})).toBeVisible()
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Remove Garden club',exact:true})).toBeFocused()
  await request()
  await app.evaluate(({dialog})=>{dialog.showOpenDialog=async()=>({canceled:true,filePaths:[]})})
  await closeDialog.getByRole('button',{name:'Save and close',exact:true}).click()
  await expect(closeDialog.getByRole('button',{name:'Save and close',exact:true})).toBeEnabled()
  await expect(closeDialog).toBeVisible();await expect(page.locator('.project-save-state')).toHaveText('Unsaved changes')
  await choose([path.join(root,'missing-parent')])
  await closeDialog.getByRole('button',{name:'Save and close',exact:true}).click()
  await expect(closeDialog.getByRole('alert')).toBeVisible()
  await expect(closeDialog.getByRole('button',{name:'Save and close',exact:true})).toBeEnabled()
  await page.screenshot({animations:'disabled',path:path.join(captures,'close-confirmation-save-error.png')})
  await choose([root])
  await finish(app,()=>closeDialog.getByRole('button',{name:'Save and close',exact:true}).click())
  savedProject=path.join(root,(await readdir(root)).find(name=>name.startsWith('dfCuts-')))
  const project=JSON.parse(await readFile(path.join(savedProject,'project.json'),'utf8'))
  assert.equal(project.name,'Garden club · weekend print run');assert.equal(project.designs.length,1)
  assert.deepEqual(await readFile(path.join(savedProject,project.assets[0].path)),await readFile(fixture),'save preserves original bytes')
})
await run('invalid settings prevent save but allow explicit discard',async({app,page,request,closeDialog})=>{
  await page.getByRole('button',{name:'Sheet',exact:true}).click()
  await page.getByLabel('Cut diameter',{exact:true}).fill('20')
  await expect(page.locator('.project-save-state')).toHaveText('Unsaved changes')
  await request();await expect(closeDialog.getByRole('button',{name:'Save and close',exact:true})).toBeDisabled()
  await expect(closeDialog).toContainText('Keep editing to fix the project settings')
  await finish(app,()=>closeDialog.getByRole('button',{name:'Discard and close',exact:true}).click())
})
await run('pending file operation cannot be interrupted by closing',async({app,page,request,closeDialog})=>{
  await page.getByLabel('Project name',{exact:true}).fill('Still saving')
  await expect(page.locator('.project-save-state')).toHaveText('Unsaved changes')
  await app.evaluate(({dialog})=>{dialog.showOpenDialog=()=>new Promise(resolve=>{globalThis.__releaseFileDialog=()=>resolve({canceled:true,filePaths:[]})})})
  await page.getByRole('button',{name:'Save',exact:true}).click()
  await expect(page.locator('.project-save-state')).toHaveText('Working…')
  await request();await expect(closeDialog.getByRole('button',{name:'Discard and close',exact:true})).toBeDisabled()
  await expect(closeDialog.getByRole('button',{name:'Save and close',exact:true})).toBeDisabled()
  assert.match(await page.evaluate(()=>window.desktop.respondToClose('discard').then(()=>'',error=>error.message)),/file operation/,'main process independently guards pending IO')
  await closeDialog.getByRole('button',{name:'Keep editing',exact:true}).click()
  await app.evaluate(()=>globalThis.__releaseFileDialog());await expect(page.locator('.project-save-state')).toHaveText('Unsaved changes')
  assert.match(await page.evaluate(()=>window.desktop.respondToClose('discard').then(()=>'',error=>error.message)),/No close request/,'no approval is accepted without a close request')
})
await run('active export is retained on cancel and cleaned before closing',async({app,page,choose,request,closeDialog})=>{
  await choose([path.join(savedProject,'project.json')]);await page.getByRole('button',{name:'Open',exact:true}).click()
  await expect(page.locator('.project-save-state')).toHaveText('Saved locally')
  const project=JSON.parse(await readFile(path.join(savedProject,'project.json'),'utf8'))
  project.settings.output.format='png';project.settings.output.dpi=150
  const output=path.join(root,'export');await mkdir(output);await writeFile(path.join(output,'existing.txt'),'keep this')
  await choose([output]);const id=await page.evaluate(project=>window.desktop.beginExport(project),project)
  const png=await sharp({create:{width:1240,height:1754,channels:3,background:'#fff'}}).png().withMetadata({density:150}).toBuffer()
  await page.evaluate(({id,bytes})=>window.desktop.writeExport(id,'sheet-0001.png',new Uint8Array(bytes)),{id,bytes:[...png]})
  const stage=(await readdir(output)).find(name=>name.startsWith('.pinit-'));assert.ok(stage)
  await request();await expect(closeDialog).toContainText('An export is still running.')
  await expect(closeDialog.getByRole('button',{name:'Save and close',exact:true})).toHaveCount(0)
  await page.screenshot({animations:'disabled',path:path.join(captures,'close-confirmation-export.png')})
  await closeDialog.getByRole('button',{name:'Keep editing',exact:true}).click()
  assert.ok((await readdir(path.join(output,stage))).includes('sheet-0001.png'),'canceling close retains the active export')
  await request();await finish(app,()=>closeDialog.getByRole('button',{name:'Cancel export and close',exact:true}).click())
  assert.deepEqual(await readdir(output),['existing.txt'],'closing removes only its temporary export')
  assert.equal(await readFile(path.join(output,'existing.txt'),'utf8'),'keep this')
})
await run('unresponsive renderer retains a native recovery prompt',async({app,page,request})=>{
  await page.getByLabel('Project name',{exact:true}).fill('Renderer recovery')
  await expect(page.locator('.project-save-state')).toHaveText('Unsaved changes')
  await app.evaluate(({BrowserWindow})=>{BrowserWindow.getAllWindows()[0].emit('unresponsive')})
  await request();assert.equal(await app.evaluate(()=>globalThis.__nativeCloseCalls),1)
  await app.evaluate(({dialog})=>{dialog.showMessageBoxSync=()=>1})
  await finish(app,request)
})
await run('repeated close cannot bypass an export write or failed cleanup',async({app,page,choose,request,closeDialog})=>{
  await choose([path.join(savedProject,'project.json')]);await page.getByRole('button',{name:'Open',exact:true}).click()
  await expect(page.locator('.project-save-state')).toHaveText('Saved locally')
  const project=JSON.parse(await readFile(path.join(savedProject,'project.json'),'utf8'))
  project.settings.output.format='png';project.settings.output.dpi=150
  const output=path.join(root,'slow-export');await mkdir(output)
  await choose([output]);const id=await page.evaluate(project=>window.desktop.beginExport(project),project)
  await app.evaluate(()=>{
    const files=process.getBuiltinModule('node:fs').promises
    const write=files.writeFile;const remove=files.rm
    files.writeFile=async(file,...args)=>{if(String(file).endsWith('sheet-0001.png'))await new Promise(resolve=>{globalThis.__releaseExportWrite=resolve});return write(file,...args)}
    let fail=true
    files.rm=async(file,...args)=>{if(fail&&String(file).includes('.pinit-')){fail=false;throw new Error('Test cleanup is temporarily blocked. Try closing again.')}return remove(file,...args)}
  })
  const png=await sharp({create:{width:1240,height:1754,channels:3,background:'#fff'}}).png().withMetadata({density:150}).toBuffer()
  const writing=page.evaluate(({id,bytes})=>window.desktop.writeExport(id,'sheet-0001.png',new Uint8Array(bytes)),{id,bytes:[...png]})
  await expect.poll(()=>app.evaluate(()=>typeof globalThis.__releaseExportWrite)).toBe('function')
  await request();await closeDialog.getByRole('button',{name:'Cancel export and close',exact:true}).click()
  await expect(closeDialog.getByRole('button',{name:'Keep editing',exact:true})).toBeDisabled()
  await request();assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),1,'a second close waits for the active write')
  await app.evaluate(()=>globalThis.__releaseExportWrite());await writing
  await expect(closeDialog.getByRole('alert')).toContainText('temporarily blocked')
  await expect(closeDialog.getByRole('button',{name:'Cancel export and close',exact:true})).toBeEnabled()
  assert.ok((await readdir(output)).some(name=>name.startsWith('.pinit-')),'failed cleanup keeps the app open for retry')
  await finish(app,()=>closeDialog.getByRole('button',{name:'Cancel export and close',exact:true}).click())
  assert.deepEqual(await readdir(output),[],'retry removes staging before closing')
})
console.log(`Close checks passed. Screenshots: ${captures}`)
