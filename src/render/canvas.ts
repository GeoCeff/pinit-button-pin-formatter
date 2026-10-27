import type { CircleSettings, Design, ExportSettings } from '../core/model'

type Context = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
export function drawArtwork(ctx: Context, source: CanvasImageSource, design: Design, circles: CircleSettings, width: number, height: number): void {
  ctx.save()
  ctx.beginPath(); ctx.arc(0, 0, circles.outer / 2, 0, Math.PI * 2); ctx.clip()
  ctx.fillStyle = design.fill; ctx.fillRect(-circles.outer / 2, -circles.outer / 2, circles.outer, circles.outer)
  const t = design.transform
  ctx.translate(t.x, t.y); ctx.rotate(t.rotation * Math.PI / 180); ctx.scale(t.mmPerPixel, t.mmPerPixel)
  ctx.drawImage(source, -width / 2, -height / 2, width, height)
  ctx.restore()
}
export function drawGuides(ctx: Context, circles: CircleSettings, guides: ExportSettings['guides']): void {
  ctx.save(); ctx.strokeStyle = '#333333'; ctx.lineWidth = 0.12
  for (const [visible, radius, dashed] of [[guides.outer, circles.outer / 2, false], [guides.inner, circles.inner / 2, true], [guides.safe, circles.inner / 2 - circles.safeInset, true]] as const) {
    if (!visible) continue
    ctx.setLineDash(dashed ? [0.8, 0.6] : []); ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke()
  }
  ctx.restore()
}
