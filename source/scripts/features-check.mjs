import { _electron as electron, expect } from '@playwright/test'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'

const root = path.resolve('local-data', `features-${Date.now()}`)
const captures = path.resolve('local-data/review')
const dropDir = path.join(root, 'dropped-batch')
const exportParent = path.join(root, 'exports')
await mkdir(dropDir, { recursive: true })
await mkdir(exportParent, { recursive: true })
await mkdir(captures, { recursive: true })

// Create a WebP fixture with distinct left/right halves so Flip H changes sampled pixels cleanly.
const halfW = 100
const halfH = 100
const raw = Buffer.alloc(halfW * halfH * 4)
for (let y = 0; y < halfH; y++) {
  for (let x = 0; x < halfW; x++) {
    const i = (y * halfW + x) * 4
    if (x < 50) {
      raw[i] = 20; raw[i + 1] = 80; raw[i + 2] = 160; raw[i + 3] = 255
    } else {
      raw[i] = 220; raw[i + 1] = 120; raw[i + 2] = 30; raw[i + 3] = 255
    }
  }
}
const webpFixture = path.join(dropDir, 'Split badge.webp')
await sharp(raw, { raw: { width: halfW, height: halfH, channels: 4 } }).webp({ lossless: true }).toFile(webpFixture)

const pngFixture = path.join(dropDir, 'Second badge.png')
await sharp({ create: { width: 800, height: 800, channels: 3, background: '#315e4c' } }).png().toFile(pngFixture)
await writeFile(path.join(dropDir, 'readme.txt'), 'ignored non-image file')

const app = await electron.launch({
  executablePath: process.env.PINIT_EXECUTABLE,
  args: process.env.PINIT_EXECUTABLE ? [] : ['.'],
  env: { ...process.env, PINIT_TEST_DATA: path.join(root, 'app-data') },
  timeout: 60000,
})

const errors = []
let page
try {
  page = await app.firstWindow()
  page.setDefaultTimeout(15000)
  page.on('pageerror', e => errors.push(e.message))

  const tour = page.getByRole('dialog', { name: 'A quick tour of dfCuts', exact: true })
  if (!(await tour.isVisible())) {
    await page.getByRole('button', { name: 'Help', exact: true }).click()
  }
  await tour.getByRole('tab', { name: 'Shortcuts & About', exact: true }).click()
  await expect(tour.getByText('Keyboard & canvas shortcuts')).toBeVisible()
  await tour.getByRole('tab', { name: 'Quick tour', exact: true }).click()
  await tour.getByRole('button', { name: 'Skip tour', exact: true }).click()
  console.log('step 0: tour tabs ok')

  // 1. Folder/path import with WebP + unsupported file skipping.
  const result = await page.evaluate(async paths => window.desktop.importPaths(paths), [dropDir, path.join(dropDir, 'readme.txt')])
  assert.equal(result.imported.length, 2)
  assert.equal(result.skipped, 1)

  // Import via file dialog for UI state using the WebP + PNG files.
  await app.evaluate(({ dialog }, paths) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: paths })
  }, [webpFixture, pngFixture])
  await page.getByRole('button', { name: 'Import artwork', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Imported 2 designs.' }).waitFor()
  console.log('step 1: webp + folder import ok')

  // 2. Bleed fit + Flip H + accurate eyedropper sampling on flipped artwork.
  await page.getByRole('button', { name: 'Fill cut circle (full bleed)', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Fill cut circle (full bleed)', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Adjust artwork', exact: true }).click()
  const widthVal = Number(await page.getByLabel('Artwork width', { exact: true }).inputValue())
  assert.ok(Math.abs(widthVal - 53) < 0.01, `Bleed width should match 53 mm cut, got ${widthVal}`)

  await page.getByRole('button', { name: 'Flip horizontally', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Flip horizontally', exact: true })).toHaveAttribute('aria-pressed', 'true')

  // Sample right side of the canvas — after Flip H, the left blue pixels (#1450a0) are on the right!
  await page.getByRole('button', { name: 'Eyedropper', exact: true }).click()
  const box = await page.locator('.editor-canvas .konvajs-content').boundingBox()
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.5)
  await expect(page.locator('.eyedropper-hex')).toHaveText('#1450A0')
  await page.keyboard.press('Escape')
  console.log('step 2: bleed + flip H + eyedropper ok')

  // 3. Undo & Redo via keyboard shortcuts.
  await page.locator('.editor-canvas').focus()
  await page.keyboard.press('Control+z')
  await expect(page.getByRole('button', { name: 'Flip horizontally', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await page.keyboard.press('Control+y')
  await expect(page.getByRole('button', { name: 'Flip horizontally', exact: true })).toHaveAttribute('aria-pressed', 'true')
  console.log('step 3: undo/redo ok')

  // 4. Library batch tools, duplicate, and Fill remaining slots.
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.getByRole('button', { name: 'Duplicate Second badge', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Second badge \(copy\)/ })).toBeVisible()

  await page.getByRole('group', { name: 'Fit all designs', exact: true }).getByRole('button', { name: 'Bleed', exact: true }).click()
  await page.getByLabel('Set copies for all designs', { exact: true }).fill('3')
  await page.getByRole('button', { name: 'Apply', exact: true }).click()
  await expect(page.locator('.layout-summary strong').first()).toHaveText('9')

  // Fill remaining 9 empty slots to reach full A4 sheet (18).
  await page.getByRole('button', { name: /Fill 9 empty slots/ }).first().click()
  await expect(page.locator('.layout-summary strong').first()).toHaveText('18')
  console.log('step 4: batch tools & fill sheet ok')

  // 5. Click-to-select on SheetPreview switches back to Artwork view.
  const hit = await page.locator('.sheet-canvas').evaluate(canvas => {
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const isInk = (px, py) => {
      const i = (py * canvas.width + px) * 4
      return data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240
    }
    for (let y = 20; y < canvas.height - 20; y += 6) {
      for (let x = 20; x < canvas.width - 20; x += 6) {
        if (isInk(x, y) && isInk(x + 12, y + 12) && isInk(x - 12, y - 12)) {
          return { x: rect.left + x * rect.width / canvas.width, y: rect.top + y * rect.height / canvas.height }
        }
      }
    }
    return null
  })
  assert.ok(hit, 'sheet preview renders pin artwork')
  await page.mouse.click(hit.x, hit.y)
  await expect(page.getByLabel('Artwork editor', { exact: true })).toBeVisible()
  console.log('step 5: sheet preview click-to-select ok')

  // 6. Export individual pin PNGs ('pins' format).
  await page.getByRole('button', { name: 'Export sheets', exact: true }).click()
  await page.getByLabel('File format', { exact: true }).selectOption('pins')
  await page.getByLabel('Raster resolution', { exact: true }).fill('150')
  await app.evaluate(({ dialog }, dir) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
  }, exportParent)
  await page.getByRole('button', { name: 'Choose folder & export' }).click()
  await page.getByRole('status').filter({ hasText: 'Export saved:' }).waitFor({ timeout: 60000 })

  const pinExportDir = (await readdir(exportParent)).find(n => n.startsWith('dfCuts-export-'))
  assert.ok(pinExportDir)
  const pinFiles = (await readdir(path.join(exportParent, pinExportDir))).sort()
  assert.equal(pinFiles.length, 3)
  assert.ok(pinFiles[0].startsWith('pin-0001-'))
  const pinMeta = await sharp(path.join(exportParent, pinExportDir, pinFiles[0])).metadata()
  assert.equal(pinMeta.format, 'png')
  assert.equal(pinMeta.width, Math.round(53 * 150 / 25.4))
  assert.equal(pinMeta.height, Math.round(53 * 150 / 25.4))
  assert.equal(pinMeta.density, 150)
  console.log('step 6: individual pin PNG export ok')

  // 7. Export Calibration Sheet PDF from Sheet Setup.
  await page.getByRole('button', { name: 'Sheet', exact: true }).click()
  await app.evaluate(({ dialog }, dir) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
  }, exportParent)
  await page.getByRole('button', { name: 'Export calibration sheet (PDF)', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Calibration sheet saved:' }).waitFor({ timeout: 30000 })
  const calFile = (await readdir(exportParent)).find(n => n.startsWith('dfCuts-calibration-'))
  assert.ok(calFile)
  const calPdf = await PDFDocument.load(await readFile(path.join(exportParent, calFile)))
  assert.equal(calPdf.getPageCount(), 1)
  assert.ok(Math.abs(calPdf.getPage(0).getWidth() * 25.4 / 72 - 210) < 0.02)
  console.log('step 7: calibration sheet PDF ok')

  // 8. Save project & confirm Recent projects lists it on New project.
  await app.evaluate(({ dialog }, dir) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
  }, root)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Project saved' }).waitFor()

  await page.getByRole('button', { name: 'New', exact: true }).click()
  await expect(page.locator('.recent-projects')).toBeVisible()
  await page.locator('.recent-projects button').first().click()
  await expect(page.locator('.layout-summary strong').first()).toHaveText('18')
  console.log('step 8: recent projects ok')

  assert.deepEqual(errors, [])
  await page.evaluate(() => window.desktop.setDirty(false))
  console.log(JSON.stringify({ passed: true, checks: ['help about & shortcuts tab', 'folder & webp import', 'bleed fit', 'flip H + eyedropper on flipped artwork', 'undo/redo shortcuts', 'duplicate & batch fit/copies/fill-sheet', 'sheet preview click-to-select', 'individual pin PNG export', 'calibration sheet PDF', 'recent projects'] }, null, 2))
} catch (error) {
  if (page) await page.screenshot({ animations: 'disabled', path: path.join(captures, 'features-failure.png') }).catch(() => {})
  throw error
} finally {
  await app.evaluate(({ BrowserWindow }) => { for (const w of BrowserWindow.getAllWindows()) w.destroy() }).catch(() => {})
  await app.close().catch(() => {})
}
