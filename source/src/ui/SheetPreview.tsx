import { memo, useEffect, useRef } from 'react'
import type { RenderSpec } from '../render/spec'
import { drawArtwork, drawGuides, drawSheetLabel } from '../render/canvas'

export const SheetPreview = memo(function SheetPreview({
  spec,
  page,
  images,
  onSelectDesign,
}: {
  spec: RenderSpec
  page: number
  images: Record<string, HTMLImageElement>
  onSelectDesign?: (id: string) => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const { project, plan } = spec
  const sheetIndex = Math.min(page, Math.max(0, plan.sheets.length - 1))
  const sheet = plan.sheets[sheetIndex]

  useEffect(() => {
    const node = canvas.current!
    node.width = Math.round(plan.width / Math.max(plan.width, plan.height) * 900)
    node.height = Math.round(plan.height / Math.max(plan.width, plan.height) * 900)
    const ctx = node.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, node.width, node.height)
    ctx.scale(node.width / plan.width, node.height / plan.height)
    if (!sheet) return
    const designs = new Map(project.designs.map(d => [d.id, d]))
    const assets = new Map(project.assets.map(a => [a.id, a]))
    for (const slot of sheet.slots) {
      const design = designs.get(slot.designId)
      if (!design) continue
      const asset = assets.get(design.assetId)
      if (!asset) continue
      ctx.save()
      ctx.translate(slot.x, slot.y)
      const image = images[asset.id]
      if (image) drawArtwork(ctx, image, design, project.settings.circles, asset.width, asset.height)
      else {
        ctx.fillStyle = '#e8e3da'
        ctx.beginPath()
        ctx.arc(0, 0, project.settings.circles.outer / 2, 0, Math.PI * 2)
        ctx.fill()
      }
      drawGuides(ctx, project.settings.circles, project.settings.output.guides)
      ctx.restore()
    }
    if (project.settings.output.sheetLabel && project.settings.output.format !== 'pins') {
      const { circles } = project.settings
      const label = `${project.name || 'dfCuts'} · Sheet ${sheetIndex + 1}/${plan.sheets.length} · ${circles.inner}/${circles.outer} mm · 100%`
      drawSheetLabel(ctx, plan.width, plan.height, label)
    }
  }, [spec, page, images, sheet, sheetIndex, project, plan])

  function handleClick(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!onSelectDesign || !sheet || !canvas.current) return
    const rect = canvas.current.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const mmX = (event.clientX - rect.left) * plan.width / rect.width
    const mmY = (event.clientY - rect.top) * plan.height / rect.height
    const radius = project.settings.circles.outer / 2
    const hit = sheet.slots.find(slot => Math.hypot(mmX - slot.x, mmY - slot.y) <= radius)
    if (hit) onSelectDesign(hit.designId)
  }

  return (
    <canvas
      ref={canvas}
      className="sheet-canvas"
      data-interactive={Boolean(onSelectDesign && sheet?.slots.length)}
      title={onSelectDesign && sheet?.slots.length ? 'Click a pin on the sheet to edit it' : undefined}
      onClick={handleClick}
      role="img"
      aria-label={`Sheet ${page + 1} preview with actual export guide settings`}
    />
  )
})
