import path from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { PDFArray, PDFDocument, PDFName, PDFNumber, PDFRawStream, StandardFonts, rgb } from 'pdf-lib'
import { mmToPt, type Settings } from '../src/core/model'

export async function verifyPdf(bytes: Uint8Array, width: number, height: number, pages: number, cmyk: boolean): Promise<void> {
  const pdf = await PDFDocument.load(bytes)
  if (pdf.getPageCount() !== pages || pdf.getPages().some(p => Math.abs(p.getWidth() - mmToPt(width)) > mmToPt(0.01) || Math.abs(p.getHeight() - mmToPt(height)) > mmToPt(0.01) || p.getRotation().angle !== 0)) {
    throw new Error('Export verification failed: PDF page geometry changed.')
  }
  if (!cmyk) return
  let artwork = 0
  for (const [, object] of pdf.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFRawStream) || object.dict.get(PDFName.of('Subtype'))?.toString() !== '/Image') continue
    const cs = object.dict.lookup(PDFName.of('ColorSpace'))
    if (cs?.toString() === '/DeviceGray') continue
    let valid = cs?.toString() === '/DeviceCMYK'
    if (cs instanceof PDFArray && cs.get(0)?.toString() === '/ICCBased') {
      const profile = pdf.context.lookup(cs.get(1))
      valid = profile instanceof PDFRawStream && profile.dict.lookup(PDFName.of('N'), PDFNumber)?.asNumber() === 4
    }
    if (!valid) throw new Error('CMYK verification failed: artwork still uses another color space. No files were published.')
    artwork++
  }
  if (!artwork) throw new Error('CMYK verification failed: no converted artwork was found.')
}

export async function convertCmyk(runtime: string, input: string, output: string, profile: string, intent: number, setChild: (child: ChildProcess) => void): Promise<void> {
  await fs.access(path.join(runtime, 'bin', 'gswin64c.exe'))
  await new Promise<void>((resolve, reject) => {
    const child = spawn(path.join(runtime, 'bin', 'gswin64c.exe'), [
      '-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.7',
      '-dAutoRotatePages=/None', '-sColorConversionStrategy=CMYK', '-dProcessColorModel=/DeviceCMYK',
      '-dOverrideICC=false', `-dRenderIntent=${intent}`, `--permit-file-read=${profile}`, `-sOutputICCProfile=${profile}`,
      '-dConvertImagesToIndexed=false',
      '-dDownsampleColorImages=false', '-dDownsampleGrayImages=false', '-dPassThroughJPEGImages=false',
      `-sOutputFile=${output}`, input
    ], { shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    setChild(child)
    // Keep process output bounded and out of logs: it may include local filenames.
    let failed = false
    child.stdout?.on('data', () => { failed = true })
    child.stderr?.on('data', () => { failed = true })
    const timeout = setTimeout(() => { child.kill(); reject(new Error('CMYK conversion timed out. Try a smaller job.')) }, 120_000)
    child.once('error', () => { clearTimeout(timeout); reject(new Error('The bundled CMYK engine could not start. Reinstall the app.')) })
    child.once('exit', code => {
      clearTimeout(timeout)
      code === 0 && !failed
        ? resolve()
        : reject(new Error(failed ? 'CMYK conversion reported a problem. Check the selected ICC profile. No files were published.' : 'CMYK conversion stopped. No files were published.'))
    })
  })
}

export async function buildCalibrationPdf(settings: Settings): Promise<Uint8Array> {
  const { circles, paper } = settings
  const portrait = [Math.min(paper.width, paper.height), Math.max(paper.width, paper.height)]
  const [pageWidth, pageHeight] = paper.orientation === 'landscape' ? [portrait[1], portrait[0]] : portrait

  const pdf = await PDFDocument.create()
  pdf.setTitle('dfCuts 100% Scale Calibration Sheet')
  pdf.setCreator('dfCuts')
  const page = pdf.addPage([mmToPt(pageWidth), mmToPt(pageHeight)])
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const ink = rgb(0.15, 0.15, 0.13)
  const muted = rgb(0.4, 0.4, 0.36)

  const margin = Math.min(14, pageWidth * 0.08)
  const headerTop = pageHeight - margin
  page.drawText('dfCuts 100% Scale Calibration Sheet', {
    x: mmToPt(margin),
    y: mmToPt(headerTop - 4),
    size: 13,
    font: bold,
    color: ink,
  })
  const wrapMm = ((circles.outer - circles.inner) / 2).toFixed(2)
  page.drawText(`Face: ${circles.inner} mm  |  Cut: ${circles.outer} mm  |  Safe inset: ${circles.safeInset} mm  |  Wrap: ${wrapMm} mm/side  |  Paper: ${pageWidth} x ${pageHeight} mm`, {
    x: mmToPt(margin),
    y: mmToPt(headerTop - 10),
    size: 8.5,
    font: regular,
    color: ink,
  })
  page.drawText('Print at Actual Size / 100% (disable Fit to Page). Measure both rulers and test your cutter die on the outer circle.', {
    x: mmToPt(margin),
    y: mmToPt(headerTop - 15),
    size: 8,
    font: regular,
    color: muted,
  })

  // Horizontal ruler (up to 100 mm)
  const hLen = Math.min(100, Math.max(10, Math.floor((pageWidth - margin * 2) / 10) * 10))
  const hY = headerTop - 25
  page.drawLine({
    start: { x: mmToPt(margin), y: mmToPt(hY) },
    end: { x: mmToPt(margin + hLen), y: mmToPt(hY) },
    thickness: mmToPt(0.22),
    color: ink,
  })
  for (let mm = 0; mm <= hLen; mm++) {
    const tick = mm % 10 === 0 ? 5 : mm % 5 === 0 ? 3.4 : 2
    page.drawLine({
      start: { x: mmToPt(margin + mm), y: mmToPt(hY) },
      end: { x: mmToPt(margin + mm), y: mmToPt(hY - tick) },
      thickness: mmToPt(mm % 10 === 0 ? 0.22 : 0.12),
      color: ink,
    })
    if (mm % 10 === 0) {
      page.drawText(mm === hLen ? `${mm} mm` : `${mm}`, {
        x: mmToPt(margin + mm - (mm >= 100 ? 2 : 0.8)),
        y: mmToPt(hY - 8.5),
        size: 7,
        font: regular,
        color: ink,
      })
    }
  }

  // Vertical ruler (up to 100 mm)
  const vTop = hY - 14
  const vLen = Math.min(100, Math.max(10, Math.floor((vTop - margin - 10) / 10) * 10))
  page.drawLine({
    start: { x: mmToPt(margin), y: mmToPt(vTop) },
    end: { x: mmToPt(margin), y: mmToPt(vTop - vLen) },
    thickness: mmToPt(0.22),
    color: ink,
  })
  for (let mm = 0; mm <= vLen; mm++) {
    const tick = mm % 10 === 0 ? 5 : mm % 5 === 0 ? 3.4 : 2
    page.drawLine({
      start: { x: mmToPt(margin), y: mmToPt(vTop - mm) },
      end: { x: mmToPt(margin + tick), y: mmToPt(vTop - mm) },
      thickness: mmToPt(mm % 10 === 0 ? 0.22 : 0.12),
      color: ink,
    })
    if (mm % 10 === 0) {
      page.drawText(mm === vLen ? `${mm} mm` : `${mm}`, {
        x: mmToPt(margin + 6.5),
        y: mmToPt(vTop - mm - 0.8),
        size: 7,
        font: regular,
        color: ink,
      })
    }
  }

  // Concentric full-scale pin test target
  const targetCx = Math.max(pageWidth / 2, margin + 20 + circles.outer / 2)
  const cx = targetCx + circles.outer / 2 <= pageWidth - margin ? targetCx : pageWidth / 2
  const cy = Math.max(margin + circles.outer / 2 + 12, Math.min(pageHeight * 0.44, vTop - circles.outer / 2 - 4))
  page.drawCircle({
    x: mmToPt(cx),
    y: mmToPt(cy),
    size: mmToPt(circles.outer / 2),
    borderWidth: mmToPt(0.18),
    borderColor: ink,
  })
  page.drawCircle({
    x: mmToPt(cx),
    y: mmToPt(cy),
    size: mmToPt(circles.inner / 2),
    borderWidth: mmToPt(0.15),
    borderColor: muted,
    borderDashArray: [mmToPt(1.2), mmToPt(0.8)],
  })
  if (circles.safeInset > 0) {
    page.drawCircle({
      x: mmToPt(cx),
      y: mmToPt(cy),
      size: mmToPt(circles.inner / 2 - circles.safeInset),
      borderWidth: mmToPt(0.12),
      borderColor: muted,
      borderDashArray: [mmToPt(0.4), mmToPt(0.7)],
    })
  }
  // Center crosshairs & outer registration ticks
  page.drawLine({ start: { x: mmToPt(cx - 4), y: mmToPt(cy) }, end: { x: mmToPt(cx + 4), y: mmToPt(cy) }, thickness: mmToPt(0.12), color: muted })
  page.drawLine({ start: { x: mmToPt(cx), y: mmToPt(cy - 4) }, end: { x: mmToPt(cx), y: mmToPt(cy + 4) }, thickness: mmToPt(0.12), color: muted })
  const r = circles.outer / 2
  for (const [dx1, dy1, dx2, dy2] of [
    [r + 0.5, 0, r + 3.5, 0],
    [-r - 0.5, 0, -r - 3.5, 0],
    [0, r + 0.5, 0, r + 3.5],
    [0, -r - 0.5, 0, -r - 3.5],
  ]) {
    page.drawLine({
      start: { x: mmToPt(cx + dx1), y: mmToPt(cy + dy1) },
      end: { x: mmToPt(cx + dx2), y: mmToPt(cy + dy2) },
      thickness: mmToPt(0.15),
      color: ink,
    })
  }
  const safeDiameter = Math.max(0, circles.inner - 2 * circles.safeInset).toFixed(1)
  page.drawText(`Test target: Cut ${circles.outer} mm (solid)  |  Face ${circles.inner} mm (dashed)  |  Safe ${safeDiameter} mm`, {
    x: mmToPt(Math.max(margin, cx - 44)),
    y: mmToPt(Math.max(margin - 4, cy - r - 9)),
    size: 8,
    font: regular,
    color: ink,
  })

  const bytes = await pdf.save()
  await verifyPdf(bytes, pageWidth, pageHeight, 1, false)
  return bytes
}
