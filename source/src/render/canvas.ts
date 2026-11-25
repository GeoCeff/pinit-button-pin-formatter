import { centerGuide, centerGuideCssColor, type CircleSettings, type Design, type ExportGuides } from '../core/model'

type Context = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export function drawArtwork(ctx: Context, source: CanvasImageSource, design: Design, circles: CircleSettings, width: number, height: number): void {
  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, circles.outer / 2, 0, Math.PI * 2)
  ctx.clip()
  ctx.fillStyle = design.fill
  ctx.fillRect(-circles.outer / 2, -circles.outer / 2, circles.outer, circles.outer)
  const t = design.transform
  ctx.translate(t.x, t.y)
  ctx.rotate(t.rotation * Math.PI / 180)
  ctx.scale(t.flipX ? -t.mmPerPixel : t.mmPerPixel, t.flipY ? -t.mmPerPixel : t.mmPerPixel)
  ctx.drawImage(source, -width / 2, -height / 2, width, height)
  ctx.restore()
}

export function drawGuides(ctx: Context, circles: CircleSettings, guides: ExportGuides): void {
  ctx.save()
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 0.12
  for (const [visible, radius, dashed] of [
    [guides.outer, circles.outer / 2, false],
    [guides.inner, circles.inner / 2, true],
    [guides.safe, circles.inner / 2 - circles.safeInset, true],
  ] as const) {
    if (!visible) continue
    ctx.setLineDash(dashed ? [0.8, 0.6] : [])
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()
  }
  if (guides.center) {
    const { top, bottom } = centerGuide(circles)
    ctx.strokeStyle = centerGuideCssColor(guides.centerColor)
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(0, top)
    ctx.lineTo(0, bottom)
    ctx.stroke()
  }
  if (guides.crosshairs) {
    ctx.strokeStyle = '#333333'
    const r = circles.outer / 2
    const start = r + 0.25
    const end = r + 1.5
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(start, 0); ctx.lineTo(end, 0)
    ctx.moveTo(-start, 0); ctx.lineTo(-end, 0)
    ctx.moveTo(0, start); ctx.lineTo(0, end)
    ctx.moveTo(0, -start); ctx.lineTo(0, -end)
    ctx.stroke()
  }
  ctx.restore()
}

export function drawSheetLabel(ctx: Context, widthMm: number, heightMm: number, text: string): void {
  ctx.save()
  ctx.fillStyle = '#55554e'
  ctx.font = '2.4px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(text, widthMm / 2, heightMm - 2.0, Math.max(20, widthMm - 16))
  ctx.restore()
}
