import { app, BrowserWindow, clipboard, dialog, ipcMain, session, shell } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { ChildProcess } from 'node:child_process'
import sharp from 'sharp'
import { LIMITS, mmToPixels, newProject, pinExportFilename, type Preset, type Project } from '../src/core/model'
import { parseProject } from '../src/core/validation'
import { buildSheetPlan, type SheetPlan } from '../src/core/layout'
import { checkExportSize } from '../src/render/spec'
import type { Imported, RecentProject } from '../src/bridge'
import { atomicWrite, boundedRead, checkProfile, containedFile, decodeImage, images, profiles, isInside } from './files'
import { buildCalibrationPdf, convertCmyk, verifyPdf } from './color'

let window: BrowserWindow
let dirty = false
let fileBusy = false
let closing = false
let closeRequested = false
let lastOutput: { folder: string; file?: string } | null = null
const locations = new Map<string, string>()
const runtime = () => app.isPackaged ? path.join(process.resourcesPath, 'ghostscript') : path.join(app.getAppPath(), 'resources', 'ghostscript')

interface Job {
  id: string
  stage: string
  destination: string
  project: Project
  plan: SheetPlan
  files: Set<string>
  child?: ChildProcess
  canceled: boolean
  finishing: boolean
  writing: boolean
  bytes: number
}

// One process owns the session. No shared database or background sync is needed.
let job: Job | undefined

interface Prefs { lastImportDir?: string; lastExportDir?: string }

function sender(event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent): void {
  if (event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) {
    throw new Error('Unauthorized desktop message.')
  }
}

function handle(name: string, fn: (...args: any[]) => any, exclusive = false): void {
  ipcMain.handle(`pinit:${name}`, async (event, ...args) => {
    sender(event)
    if (exclusive && fileBusy) throw new Error('Another file operation is active. Try again when it finishes.')
    if (exclusive) fileBusy = true
    try { return await fn(...args) } catch (error) { throw new Error((error as Error).message) }
    finally { if (exclusive) fileBusy = false }
  })
}

async function readPrefs(): Promise<Prefs> {
  try {
    const raw = JSON.parse((await boundedRead(path.join(app.getPath('userData'), 'prefs.json'), 64 * 1024)).toString())
    return raw && typeof raw === 'object' ? raw as Prefs : {}
  } catch {
    return {}
  }
}

async function savePref(patch: Partial<Prefs>): Promise<void> {
  try {
    const current = await readPrefs()
    await atomicWrite(path.join(app.getPath('userData'), 'prefs.json'), JSON.stringify({ ...current, ...patch }))
  } catch {
    // Non-critical UI convenience preference.
  }
}

async function validDir(dir?: string): Promise<string | undefined> {
  if (!dir || typeof dir !== 'string') return undefined
  return await fs.stat(dir).then(s => (s.isDirectory() ? dir : undefined), () => undefined)
}

async function loadRecent(): Promise<RecentProject[]> {
  try {
    const raw = JSON.parse((await boundedRead(path.join(app.getPath('userData'), 'recent.json'), 256 * 1024)).toString())
    if (!Array.isArray(raw)) return []
    const valid: RecentProject[] = []
    for (const item of raw) {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof item.name !== 'string' ||
        typeof item.path !== 'string' ||
        typeof item.updatedAt !== 'string' ||
        typeof item.designCount !== 'number'
      ) continue
      const exists = await fs.access(item.path).then(() => true, () => false)
      if (exists) valid.push(item as RecentProject)
      if (valid.length >= 8) break
    }
    return valid
  } catch {
    return []
  }
}

async function recordRecent(entry: RecentProject): Promise<void> {
  try {
    const resolved = path.resolve(entry.path)
    const current = await loadRecent()
    const next = [{ ...entry, path: resolved }, ...current.filter(item => path.resolve(item.path) !== resolved)].slice(0, 8)
    await atomicWrite(path.join(app.getPath('userData'), 'recent.json'), JSON.stringify(next))
  } catch {
    // Non-critical recent list update.
  }
}

async function removeRecent(projectPath: string): Promise<void> {
  try {
    const resolved = path.resolve(projectPath)
    const current = await loadRecent()
    const next = current.filter(item => path.resolve(item.path) !== resolved)
    await atomicWrite(path.join(app.getPath('userData'), 'recent.json'), JSON.stringify(next))
  } catch {
    // Ignore cleanup errors.
  }
}

async function importFiles(multiple: boolean) {
  const prefs = await readPrefs()
  const defaultPath = await validDir(prefs.lastImportDir)
  const result = await dialog.showOpenDialog(window, {
    title: multiple ? 'Import artwork' : 'Relink artwork',
    defaultPath,
    properties: multiple ? ['openFile', 'multiSelections'] : ['openFile'],
    filters: [{ name: 'Artwork', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
  })
  if (result.canceled) return []
  if (result.filePaths.length + images.size > LIMITS.assets) throw new Error('A session supports at most 500 images.')
  const added: string[] = []
  try {
    const imported: Imported[] = []
    for (const file of result.filePaths) {
      const image = await decodeImage(await boundedRead(file, LIMITS.fileBytes), file)
      added.push(image.asset.id)
      imported.push(image)
    }
    if (result.filePaths.length) await savePref({ lastImportDir: path.dirname(result.filePaths[0]) })
    return imported
  } catch (error) {
    for (const id of added) images.delete(id)
    throw error
  }
}

async function importDroppedPaths(rawPaths: unknown): Promise<{ imported: Imported[]; skipped: number }> {
  if (!Array.isArray(rawPaths) || rawPaths.length > LIMITS.assets) {
    throw new Error('Drop at most 500 artwork files at once.')
  }
  const files: string[] = []
  for (const item of rawPaths) {
    if (typeof item !== 'string' || !item.trim()) continue
    const resolved = path.resolve(item)
    const stat = await fs.stat(resolved).catch(() => null)
    if (!stat) continue
    if (stat.isDirectory()) {
      const entries = await fs.readdir(resolved, { withFileTypes: true }).catch(() => [])
      const children = entries
        .filter(entry => entry.isFile() && /\.(png|jpe?g|webp)$/i.test(entry.name))
        .map(entry => path.join(resolved, entry.name))
        .sort((a, b) => a.localeCompare(b))
      files.push(...children)
    } else if (stat.isFile()) {
      files.push(resolved)
    }
    if (files.length + images.size > LIMITS.assets) {
      throw new Error('A session supports at most 500 images.')
    }
  }
  const imported: Imported[] = []
  const added: string[] = []
  let skipped = 0
  try {
    for (const file of files) {
      try {
        const image = await decodeImage(await boundedRead(file, LIMITS.fileBytes), file)
        added.push(image.asset.id)
        imported.push(image)
      } catch (error) {
        const message = (error as Error).message
        if (message.includes('session budget') || message.includes('500 images')) throw error
        skipped++
      }
    }
    if (files.length && imported.length) await savePref({ lastImportDir: path.dirname(files[0]) })
    return { imported, skipped }
  } catch (error) {
    for (const id of added) images.delete(id)
    throw error
  }
}

async function openProjectFile(file: string) {
  const realFile = await fs.realpath(file)
  const root = path.dirname(realFile)
  const project = parseProject(JSON.parse((await boundedRead(realFile, LIMITS.projectBytes)).toString()))
  const oldImages = new Map(images)
  const oldProfiles = new Map(profiles)
  images.clear()
  profiles.clear()
  try {
    const imported: Imported[] = []
    const missing: string[] = []
    for (const asset of project.assets) {
      try {
        imported.push(await decodeImage(await boundedRead(await containedFile(root, asset.path), LIMITS.fileBytes), asset.path, asset))
      } catch {
        missing.push(asset.id)
      }
    }
    let profileMissing = false
    if (project.settings.output.profile) {
      const id = project.settings.output.profile
      try {
        const bytes = await boundedRead(await containedFile(root, `assets/${id}.icc`), 16 * 1024 * 1024)
        checkProfile(bytes)
        profiles.set(id, bytes)
      } catch {
        profileMissing = true
      }
    }
    locations.set(project.id, root)
    await recordRecent({
      name: project.name,
      path: realFile,
      updatedAt: new Date().toISOString(),
      designCount: project.designs.length,
    })
    return { project, images: imported, missing, profileMissing, location: root }
  } catch (error) {
    images.clear()
    profiles.clear()
    for (const [id, data] of oldImages) images.set(id, data)
    for (const [id, data] of oldProfiles) profiles.set(id, data)
    throw error
  }
}

async function cleanup(active: typeof job): Promise<void> {
  if (!active) return
  active.canceled = true
  if (active.child && active.child.exitCode === null && active.child.signalCode === null) {
    await new Promise<void>(resolve => { active.child!.once('exit', () => resolve()); active.child!.kill() })
  }
  // stage is created by mkdtemp below, never supplied by the renderer.
  if (!isInside(path.dirname(active.destination), path.resolve(active.stage)) || !path.basename(active.stage).startsWith('.pinit-')) {
    throw new Error('Invalid temporary export directory.')
  }
  await fs.rm(active.stage, { recursive: true, force: true })
}

async function completeClose(): Promise<void> {
  if (closing) return
  if (fileBusy) throw new Error('Wait for the current file operation to finish before closing.')
  closing = true
  try {
    const active = job
    if (active) {
      active.canceled = true
      active.child?.kill()
      while (job === active && (active.writing || active.finishing)) await new Promise(resolve => setTimeout(resolve, 20))
      if (job === active) { await cleanup(active); job = undefined }
    }
    window.destroy()
  } catch (error) {
    closing = false
    throw error
  }
}

async function loadPresets(): Promise<Preset[]> {
  try {
    const raw = JSON.parse((await boundedRead(path.join(app.getPath('userData'), 'presets.json'), LIMITS.projectBytes)).toString())
    if (!Array.isArray(raw) || raw.length > 100) throw new Error('Invalid presets file.')
    return raw.map(p => {
      const example = newProject()
      example.settings = p.settings
      parseProject(example)
      if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 100) throw new Error('Invalid preset name.')
      return p
    })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

const hasCmykRuntime = () => fs.access(path.join(runtime(), 'bin', 'gswin64c.exe')).then(() => true, () => false)

function register(): void {
  handle('close-response', async (action: unknown) => {
    if (action !== 'cancel' && action !== 'discard') throw new Error('Invalid close response.')
    if (!closeRequested) throw new Error('No close request is pending.')
    if (action === 'cancel') { if (!closing) closeRequested = false; return }
    await completeClose()
  })
  handle('reset', () => {
    if (job) throw new Error('Cancel the current export first.')
    images.clear()
    profiles.clear()
    locations.clear()
  }, true)
  handle('import', () => importFiles(true), true)
  handle('import-paths', (paths: unknown) => importDroppedPaths(paths), true)
  handle('import-clipboard', async () => {
    if (images.size >= LIMITS.assets) throw new Error('A session supports at most 500 images.')
    const items = await clipboard.read()
    for (const item of items) {
      const mime = item.types.find(type => type === 'image/png' || type === 'image/jpeg' || type === 'image/webp')
        ?? item.types.find(type => type.startsWith('image/'))
      if (!mime) continue
      const payload = await item.getType(mime)
      if (!(payload instanceof Blob)) continue
      const buf = Buffer.from(await payload.arrayBuffer())
      if (!buf.length) continue
      if (buf.length > LIMITS.fileBytes) throw new Error('Clipboard image exceeds the 50 MB size limit.')
      const isSupported = mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/webp'
      const bytes = isSupported
        ? buf
        : await sharp(buf, { limitInputPixels: LIMITS.pixels, animated: false }).png().toBuffer()
      const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png'
      return decodeImage(bytes, `Clipboard artwork.${ext}`)
    }
    return null
  }, true)
  handle('relink', async () => (await importFiles(false))[0] ?? null, true)
  handle('runtime', async () => ({ cmyk: await hasCmykRuntime() }))
  handle('app-info', async () => ({
    version: app.getVersion(),
    name: app.getName(),
    cmyk: await hasCmykRuntime(),
    portable: Boolean(process.env.PORTABLE_EXECUTABLE_DIR),
  }))
  handle('profile', async () => {
    const result = await dialog.showOpenDialog(window, { properties: ['openFile'], filters: [{ name: 'CMYK profile', extensions: ['icc', 'icm'] }] })
    if (result.canceled) return null
    const bytes = await boundedRead(result.filePaths[0], 16 * 1024 * 1024)
    checkProfile(bytes)
    if (profiles.size >= 16 || [...profiles.values()].reduce((n, b) => n + b.length, bytes.length) > 64 * 1024 * 1024) {
      throw new Error('This session has reached its ICC profile budget (16 profiles / 64 MB). Save and reopen the project before importing another.')
    }
    const id = randomUUID()
    profiles.set(id, bytes)
    return id
  }, true)
  handle('open', async () => {
    const result = await dialog.showOpenDialog(window, { title: 'Open project.json', properties: ['openFile'], filters: [{ name: 'dfCuts project', extensions: ['json'] }] })
    if (result.canceled) return null
    return openProjectFile(result.filePaths[0])
  }, true)
  handle('recent', loadRecent)
  handle('open-recent', async (projectPath: unknown) => {
    if (typeof projectPath !== 'string' || !projectPath.trim()) throw new Error('Invalid recent project path.')
    const target = path.resolve(projectPath)
    const recent = await loadRecent()
    if (!recent.some(item => path.resolve(item.path) === target)) {
      throw new Error('This recent project is no longer available.')
    }
    const exists = await fs.access(target).then(() => true, () => false)
    if (!exists) {
      await removeRecent(target)
      throw new Error('This recent project could not be found on disk.')
    }
    return openProjectFile(target)
  }, true)
  handle('save', async (raw: unknown, saveAs: unknown) => {
    const project = parseProject(raw)
    if (typeof saveAs !== 'boolean') throw new Error('Invalid save request.')
    let root = saveAs ? undefined : locations.get(project.id)
    const creating = !root
    if (!root) {
      const result = await dialog.showOpenDialog(window, { title: 'Choose a parent folder for the new dfCuts project', properties: ['openDirectory', 'createDirectory'] })
      if (result.canceled) return null
      root = path.join(result.filePaths[0], `dfCuts-${project.id}-${randomUUID().slice(0, 8)}`)
      await fs.mkdir(root)
    }
    const realRoot = await fs.realpath(root)
    await fs.mkdir(path.join(realRoot, 'assets'), { recursive: true })
    if (await fs.realpath(path.join(realRoot, 'assets')) !== path.join(realRoot, 'assets')) {
      throw new Error('The assets directory must not be a symbolic link.')
    }
    for (const asset of project.assets) {
      const data = images.get(asset.id)
      if (data) await atomicWrite(path.join(realRoot, asset.path), data.original)
      else if (creating) throw new Error('Relink missing artwork before saving a copy.')
      // Missing sources in an opened project retain their manifest and edits.
    }
    const profile = project.settings.output.profile
    if (profile) {
      const bytes = profiles.get(profile)
      if (!bytes) throw new Error('Reimport the missing ICC profile.')
      await atomicWrite(path.join(realRoot, 'assets', `${profile}.icc`), bytes)
    }
    const projectFile = path.join(realRoot, 'project.json')
    await atomicWrite(projectFile, JSON.stringify(project, null, 2))
    locations.set(project.id, realRoot)
    await recordRecent({
      name: project.name,
      path: projectFile,
      updatedAt: new Date().toISOString(),
      designCount: project.designs.length,
    })
    return realRoot
  }, true)
  handle('presets', loadPresets)
  handle('preset-save', async (preset: Preset) => {
    const example = newProject()
    example.settings = preset?.settings
    parseProject(example)
    if (typeof preset.name !== 'string' || !preset.name.trim() || preset.name.length > 100 || preset.settings.output.profile !== null) {
      throw new Error('Preset names need 1–100 characters. Use the bundled profile in reusable presets.')
    }
    const saved = await loadPresets()
    const next = saved.filter(p => p.name !== preset.name)
    if (next.length >= 100) throw new Error('At most 100 named presets are supported.')
    next.push(preset)
    await atomicWrite(path.join(app.getPath('userData'), 'presets.json'), JSON.stringify(next))
  }, true)
  handle('preset-delete', async (name: unknown) => {
    if (typeof name !== 'string' || !name.trim() || name.length > 100) throw new Error('Invalid preset name.')
    const saved = await loadPresets()
    const next = saved.filter(p => p.name !== name)
    await atomicWrite(path.join(app.getPath('userData'), 'presets.json'), JSON.stringify(next))
  }, true)
  handle('export-calibration', async (rawSettings: unknown) => {
    const example = newProject()
    example.settings = rawSettings as Project['settings']
    const parsed = parseProject(example)
    const prefs = await readPrefs()
    const defaultPath = await validDir(prefs.lastExportDir)
    const resultDir = await dialog.showOpenDialog(window, {
      title: 'Choose folder for calibration sheet',
      defaultPath,
      properties: ['openDirectory', 'createDirectory'],
    })
    if (resultDir.canceled) return null
    const parent = await fs.realpath(resultDir.filePaths[0])
    const bytes = await buildCalibrationPdf(parsed.settings)
    const { circles } = parsed.settings
    const filePath = path.join(parent, `dfCuts-calibration-${circles.inner}x${circles.outer}mm-${randomUUID().slice(0, 6)}.pdf`)
    await atomicWrite(filePath, Buffer.from(bytes))
    await savePref({ lastExportDir: parent })
    lastOutput = { folder: parent, file: filePath }
    return filePath
  }, true)
  handle('export-begin', async (raw: unknown) => {
    if (job) throw new Error('An export is already active.')
    const project = parseProject(raw)
    const result = buildSheetPlan(project)
    if (!result.ok) throw new Error(result.error)
    checkExportSize({ project, plan: result.plan })
    for (const design of project.designs) {
      if (design.quantity && !images.has(design.assetId)) throw new Error('Relink missing artwork before exporting.')
    }
    if (project.settings.output.format === 'pdf' && project.settings.output.color === 'cmyk' && project.settings.output.profile && !profiles.has(project.settings.output.profile)) {
      throw new Error('The custom ICC profile is missing. Import it again or select the bundled generic profile.')
    }
    if (project.settings.output.format === 'pdf' && project.settings.output.color === 'cmyk') {
      await fs.access(path.join(runtime(), 'bin', 'gswin64c.exe')).catch(() => {
        throw new Error('The CMYK runtime is missing. Prepare resources or reinstall the complete app. RGB export is available explicitly.')
      })
    }
    const prefs = await readPrefs()
    const defaultPath = await validDir(prefs.lastExportDir)
    const resultDir = await dialog.showOpenDialog(window, {
      title: 'Choose export folder',
      defaultPath,
      properties: ['openDirectory', 'createDirectory'],
    })
    if (resultDir.canceled) return null
    const parent = await fs.realpath(resultDir.filePaths[0])
    await savePref({ lastExportDir: parent })
    const stage = await fs.mkdtemp(path.join(parent, '.pinit-'))
    const id = randomUUID()
    job = {
      id,
      stage,
      destination: path.join(parent, `dfCuts-export-${new Date().toISOString().replace(/[:.]/g, '-')}-${id.slice(0, 6)}`),
      project,
      plan: result.plan,
      files: new Set(),
      canceled: false,
      finishing: false,
      writing: false,
      bytes: 0,
    }
    return id
  }, true)
  handle('export-write', async (id: unknown, name: unknown, bytes: unknown) => {
    const active = job
    if (!active || id !== active.id || active.canceled || active.finishing || active.writing) {
      throw new Error('Export is not accepting files.')
    }
    const format = active.project.settings.output.format
    const activeDesigns = active.project.designs.filter(d => d.quantity > 0)
    let expected: string
    if (format === 'pdf') {
      expected = 'sheets.pdf'
    } else if (format === 'pins') {
      if (active.files.size >= activeDesigns.length) throw new Error('Too many pin files.')
      expected = pinExportFilename(active.files.size, activeDesigns[active.files.size].name)
    } else {
      if (active.files.size >= active.plan.sheets.length) throw new Error('Too many sheets.')
      expected = `sheet-${String(active.files.size + 1).padStart(4, '0')}.${format}`
    }

    if (name !== expected || active.files.has(expected) || !(bytes instanceof Uint8Array) || bytes.byteLength > LIMITS.rasterBytes || active.bytes + bytes.byteLength > 1024 ** 3) {
      throw new Error('Invalid export file or job exceeds the 1 GB output budget.')
    }
    active.writing = true
    try {
      const buffer = Buffer.from(bytes)
      if (format === 'pdf') {
        await verifyPdf(buffer, active.plan.width, active.plan.height, active.plan.sheets.length, false)
      } else if (format === 'pins') {
        const info = await sharp(buffer, { limitInputPixels: LIMITS.rasterBytes / 4 }).metadata()
        const dpi = active.project.settings.output.dpi
        const expectedPx = Math.max(1, mmToPixels(active.project.settings.circles.outer, dpi))
        if (info.format !== 'png' || info.width !== expectedPx || info.height !== expectedPx || !info.density || Math.abs(info.density - dpi) > 1) {
          throw new Error('Raster verification failed: pin size or resolution metadata changed.')
        }
      } else {
        const info = await sharp(buffer, { limitInputPixels: LIMITS.rasterBytes / 4 }).metadata()
        const dpi = active.project.settings.output.dpi
        if (info.format !== (format === 'jpg' ? 'jpeg' : 'png') || info.width !== mmToPixels(active.plan.width, dpi) || info.height !== mmToPixels(active.plan.height, dpi) || !info.density || Math.abs(info.density - dpi) > 1) {
          throw new Error('Raster verification failed: size or resolution metadata changed.')
        }
      }
      if (active.canceled) throw new Error('Export canceled.')
      await fs.writeFile(path.join(active.stage, expected), buffer, { flag: 'wx' })
      active.files.add(expected)
      active.bytes += buffer.length
    } finally {
      active.writing = false
    }
  })
  handle('export-finish', async (id: unknown) => {
    const active = job
    if (!active || active.id !== id || active.finishing || active.writing || active.canceled) {
      throw new Error('Export is not ready.')
    }
    active.finishing = true
    try {
      const { output } = active.project.settings
      const activeDesigns = active.project.designs.filter(d => d.quantity > 0)
      const expectedCount = output.format === 'pdf' ? 1 : output.format === 'pins' ? activeDesigns.length : active.plan.sheets.length
      if (active.files.size !== expectedCount) throw new Error('The export is incomplete.')
      if (output.format === 'pdf' && output.color === 'cmyk') {
        window.webContents.send('pinit:progress', 'Converting and checking CMYK artwork…')
        const profile = output.profile ? path.join(active.stage, 'profile.icc') : path.join(runtime(), 'iccprofiles', 'default_cmyk.icc')
        if (output.profile) {
          const bytes = profiles.get(output.profile)
          if (!bytes) throw new Error('CMYK profile is unavailable.')
          await fs.writeFile(profile, bytes)
        }
        await convertCmyk(runtime(), path.join(active.stage, 'sheets.pdf'), path.join(active.stage, 'converted.pdf'), profile, output.intent, child => {
          active.child = child
          if (active.canceled) child.kill()
        })
        if (active.canceled) throw new Error('Export canceled.')
        await verifyPdf(await boundedRead(path.join(active.stage, 'converted.pdf'), LIMITS.rasterBytes), active.plan.width, active.plan.height, active.plan.sheets.length, true)
        await fs.rename(path.join(active.stage, 'converted.pdf'), path.join(active.stage, 'sheets.pdf'))
        if (output.profile) await fs.rm(profile)
      }
      if (active.canceled) throw new Error('Export canceled.')
      // Commit is a single directory rename. Existing exports are never replaced.
      await fs.rename(active.stage, active.destination)
      const primaryFile = output.format === 'pdf'
        ? 'sheets.pdf'
        : output.format === 'pins'
          ? pinExportFilename(0, activeDesigns[0].name)
          : `sheet-0001.${output.format}`
      lastOutput = { folder: active.destination, file: path.join(active.destination, primaryFile) }
      job = undefined
      return active.destination
    } catch (error) {
      await cleanup(active)
      if (job === active) job = undefined
      throw error
    } finally {
      active.finishing = false
    }
  })
  handle('export-cancel', async (id: unknown) => {
    const active = job
    if (!active || id !== active.id) return
    active.canceled = true
    if (active.finishing) { active.child?.kill(); return }
    while (active.writing) await new Promise(resolve => setTimeout(resolve, 20))
    await cleanup(active)
    if (job === active) job = undefined
  })
  handle('open-output', async (target: unknown) => {
    if (target !== 'folder' && target !== 'file') throw new Error('Invalid output target.')
    if (!lastOutput) throw new Error('No export output is available yet.')
    const chosen = target === 'folder' ? lastOutput.folder : (lastOutput.file ?? lastOutput.folder)
    const err = await shell.openPath(chosen)
    if (err) throw new Error(err)
  })
  ipcMain.on('pinit:dirty', (event, value) => {
    sender(event)
    if (typeof value === 'boolean') dirty = value
  })
}

app.setName('dfCuts')
// Keep the original settings and Chromium storage when upgrading to dfCuts.
app.setPath('userData', path.join(app.getPath('appData'), 'PinIt'))
if (!app.isPackaged && process.env.PINIT_TEST_DATA) app.setPath('userData', path.resolve(process.env.PINIT_TEST_DATA))
if (!app.requestSingleInstanceLock()) app.quit()
else {
  app.on('second-instance', () => {
    if (window) {
      if (window.isMinimized()) window.restore()
      window.focus()
    }
  })
  app.whenReady().then(() => {
    app.setAppUserModelId('app.pinit.desktop')
    window = new BrowserWindow({
      width: 1500,
      height: 960,
      minWidth: 1080,
      minHeight: 720,
      title: 'dfCuts',
      icon: app.isPackaged ? path.join(process.resourcesPath, 'icon.png') : path.join(app.getAppPath(), 'resources', 'icon.png'),
      backgroundColor: '#f7f6f2',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
      },
    })
    window.setMenuBarVisibility(false)
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    window.webContents.on('will-navigate', event => event.preventDefault())
    let rendererResponsive = true
    window.on('unresponsive', () => { rendererResponsive = false })
    window.on('responsive', () => { rendererResponsive = true })
    window.webContents.on('render-process-gone', () => { rendererResponsive = false })
    window.webContents.on('did-finish-load', () => { rendererResponsive = true; closeRequested = false })
    window.on('close', event => {
      if (!job && !dirty && !fileBusy && !closeRequested && !closing) return
      event.preventDefault()
      if (closing) return
      if (!rendererResponsive) {
        const response = dialog.showMessageBoxSync(window, {
          type: 'warning',
          buttons: ['Keep editing', 'Discard changes and close'],
          defaultId: 0,
          cancelId: 0,
          message: 'The workspace is not responding. Close without saving?',
          detail: fileBusy ? 'A file operation is still running. Wait for it to finish before closing.' : 'Any export still running will be canceled. Completed files are kept.',
        })
        if (response === 1) void completeClose().catch(error => dialog.showErrorBox('Could not close dfCuts', (error as Error).message))
        return
      }
      if (!closeRequested) {
        closeRequested = true
        window.webContents.send('pinit:close-request', { exporting: !!job })
      }
    })
    register()
    if (process.env.ELECTRON_RENDERER_URL) void window.loadURL(process.env.ELECTRON_RENDERER_URL)
    else void window.loadFile(path.join(__dirname, '../renderer/index.html'))
  })
  app.on('window-all-closed', () => app.quit())
}
