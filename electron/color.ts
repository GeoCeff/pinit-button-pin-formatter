import path from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { PDFArray, PDFDocument, PDFName, PDFNumber, PDFRawStream } from 'pdf-lib'
import { mmToPt } from '../src/core/model'

export async function verifyPdf(bytes: Uint8Array, width: number, height: number, pages: number, cmyk: boolean): Promise<void> {
  const pdf = await PDFDocument.load(bytes)
  if (pdf.getPageCount() !== pages || pdf.getPages().some(p => Math.abs(p.getWidth() - mmToPt(width)) > mmToPt(0.01) || Math.abs(p.getHeight() - mmToPt(height)) > mmToPt(0.01) || p.getRotation().angle !== 0)) throw new Error('Export verification failed: PDF page geometry changed.')
  if (!cmyk) return
  let artwork = 0
  for (const [,object] of pdf.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFRawStream) || object.dict.get(PDFName.of('Subtype'))?.toString() !== '/Image') continue
    const cs = object.dict.lookup(PDFName.of('ColorSpace'))
    if (cs?.toString() === '/DeviceGray') continue
    let valid = cs?.toString() === '/DeviceCMYK'
    if (cs instanceof PDFArray && cs.get(0)?.toString() === '/ICCBased') {
      const profile = pdf.context.lookup(cs.get(1))
      valid = profile instanceof PDFRawStream && profile.dict.lookup(PDFName.of('N'),PDFNumber)?.asNumber() === 4
    }
    if (!valid) throw new Error('CMYK verification failed: artwork still uses another color space. No files were published.')
    artwork++
  }
  if (!artwork) throw new Error('CMYK verification failed: no converted artwork was found.')
}

export async function convertCmyk(runtime: string, input: string, output: string, profile: string, intent: number, setChild: (child: ChildProcess) => void): Promise<void> {
  await fs.access(path.join(runtime,'bin','gswin64c.exe'))
  await new Promise<void>((resolve,reject) => {
    const child = spawn(path.join(runtime,'bin','gswin64c.exe'),[
      '-q','-dSAFER','-dBATCH','-dNOPAUSE','-sDEVICE=pdfwrite','-dCompatibilityLevel=1.7',
      '-dAutoRotatePages=/None','-sColorConversionStrategy=CMYK','-dProcessColorModel=/DeviceCMYK',
      '-dOverrideICC=false',`-dRenderIntent=${intent}`,`--permit-file-read=${profile}`,`-sOutputICCProfile=${profile}`,
      '-dConvertImagesToIndexed=false',
      '-dDownsampleColorImages=false','-dDownsampleGrayImages=false','-dPassThroughJPEGImages=false',
      `-sOutputFile=${output}`,input
    ],{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']})
    setChild(child)
    // Keep process output bounded and out of logs: it may include local filenames.
    let failed = false
    child.stdout?.on('data',()=>{ failed = true })
    child.stderr?.on('data',()=>{ failed = true })
    const timeout = setTimeout(()=>{ child.kill(); reject(new Error('CMYK conversion timed out. Try a smaller job.')) },120_000)
    child.once('error',()=>{clearTimeout(timeout);reject(new Error('The bundled CMYK engine could not start. Reinstall the app.'))})
    child.once('exit',code=>{clearTimeout(timeout);code === 0 && !failed ? resolve() : reject(new Error(failed ? 'CMYK conversion reported a problem. Check the selected ICC profile. No files were published.' : 'CMYK conversion stopped. No files were published.'))})
  })
}
