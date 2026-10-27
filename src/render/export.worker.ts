import { PDFDocument, rgb } from 'pdf-lib'
import { mmToPixels, mmToPt } from '../core/model'
import { checkExportSize, type RenderSpec } from './spec'
import { drawArtwork, drawGuides } from './canvas'
import { setJpgDensity, setPngDensity } from './density'

interface Start { spec: RenderSpec; sources: Record<string, string> }
const scope = self as unknown as DedicatedWorkerGlobalScope
let acknowledge: (() => void) | undefined
scope.onmessage = event => {
  if (event.data.ack) { acknowledge?.(); return }
  run(event.data).catch(error => scope.postMessage({ error: (error as Error).message }))
}
async function publish(name: string, bytes: Uint8Array): Promise<void> {
  await new Promise<void>(resolve => { acknowledge = resolve; scope.postMessage({ file: { name, bytes } }, [bytes.buffer]) })
}
async function run({ spec, sources }: Start): Promise<void> {
  checkExportSize(spec)
  const { project, plan } = spec
  const { circles, output } = project.settings
  const tiles = new Map<string, ImageBitmap>()
  const pdf = output.format === 'pdf' ? await PDFDocument.create() : undefined
  pdf?.setTitle(project.name); pdf?.setCreator('PinIt')
  const embedded = new Map<string, Awaited<ReturnType<PDFDocument['embedPng']>>>()
  const designs = project.designs.filter(d => d.quantity > 0)
  const tileSize = Math.max(1, mmToPixels(circles.outer, output.dpi))
  for (let i = 0; i < designs.length; i++) {
    const design = designs[i]; const asset = project.assets.find(a => a.id === design.assetId)!
    if (!sources[asset.id]) throw new Error(`Missing artwork for ${design.name}. Relink it before export.`)
    const source = await createImageBitmap(await (await fetch(sources[asset.id])).blob())
    const tile = new OffscreenCanvas(tileSize, tileSize); const ctx = tile.getContext('2d')!
    ctx.scale(tileSize / circles.outer, tileSize / circles.outer); ctx.translate(circles.outer / 2, circles.outer / 2)
    drawArtwork(ctx, source, design, circles, asset.width, asset.height); source.close()
    if (pdf) embedded.set(design.id, await pdf.embedPng(await (await tile.convertToBlob({ type: 'image/png' })).arrayBuffer()))
    else tiles.set(design.id, tile.transferToImageBitmap())
    tile.width = 1; tile.height = 1
    scope.postMessage({ progress: `Preparing artwork ${i + 1} of ${designs.length}` })
  }
  for (let i = 0; i < plan.sheets.length; i++) {
    if (pdf) {
      const page = pdf.addPage([mmToPt(plan.width), mmToPt(plan.height)])
      for (const slot of plan.sheets[i].slots) {
        page.drawImage(embedded.get(slot.designId)!, { x: mmToPt(slot.x - circles.outer / 2), y: mmToPt(plan.height - slot.y - circles.outer / 2), width: mmToPt(circles.outer), height: mmToPt(circles.outer) })
        for (const [show, radius, dashed] of [[output.guides.outer, circles.outer / 2, false], [output.guides.inner, circles.inner / 2, true], [output.guides.safe, circles.inner / 2 - circles.safeInset, true]] as const) if (show) page.drawCircle({ x: mmToPt(slot.x), y: mmToPt(plan.height - slot.y), size: mmToPt(radius), borderWidth: mmToPt(0.12), borderColor: rgb(0.2,0.2,0.2), borderDashArray: dashed ? [mmToPt(0.8),mmToPt(0.6)] : undefined })
      }
    } else {
      const canvas = new OffscreenCanvas(Math.max(1, mmToPixels(plan.width, output.dpi)), Math.max(1, mmToPixels(plan.height, output.dpi)))
      const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(canvas.width / plan.width, canvas.height / plan.height)
      for (const slot of plan.sheets[i].slots) {
        ctx.drawImage(tiles.get(slot.designId)!, slot.x - circles.outer / 2, slot.y - circles.outer / 2, circles.outer, circles.outer)
        ctx.save(); ctx.translate(slot.x,slot.y); drawGuides(ctx,circles,output.guides); ctx.restore()
      }
      const blob = await canvas.convertToBlob({ type: output.format === 'png' ? 'image/png' : 'image/jpeg', quality: output.quality / 100 })
      const bytes = new Uint8Array(await blob.arrayBuffer())
      await publish(`sheet-${String(i + 1).padStart(4,'0')}.${output.format}`, output.format === 'png' ? setPngDensity(bytes,output.dpi) : setJpgDensity(bytes,output.dpi))
      canvas.width = 1; canvas.height = 1
    }
    scope.postMessage({ progress: `Rendering sheet ${i + 1} of ${plan.sheets.length}` })
  }
  if (pdf) await publish('sheets.pdf', await pdf.save())
  for (const tile of tiles.values()) tile.close()
  scope.postMessage({ done: true })
}
