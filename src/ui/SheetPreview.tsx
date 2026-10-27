import { memo, useEffect, useRef } from 'react'
import type { RenderSpec } from '../render/spec'
import { drawArtwork, drawGuides } from '../render/canvas'
export const SheetPreview=memo(function SheetPreview({spec,page,images}:{spec:RenderSpec;page:number;images:Record<string,HTMLImageElement>}) {
  const canvas=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const node=canvas.current!;const {project,plan}=spec
    node.width=Math.round(plan.width/Math.max(plan.width,plan.height)*900);node.height=Math.round(plan.height/Math.max(plan.width,plan.height)*900)
    const ctx=node.getContext('2d')!;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,node.width,node.height);ctx.scale(node.width/plan.width,node.height/plan.height)
    const sheet=plan.sheets[Math.min(page,plan.sheets.length-1)]
    if(!sheet)return
    const designs=new Map(project.designs.map(d=>[d.id,d]));const assets=new Map(project.assets.map(a=>[a.id,a]))
    for(const slot of sheet.slots){const design=designs.get(slot.designId)!;const asset=assets.get(design.assetId)!;ctx.save();ctx.translate(slot.x,slot.y)
      const image=images[asset.id]
      if(image)drawArtwork(ctx,image,design,project.settings.circles,asset.width,asset.height)
      else{ctx.fillStyle='#e8e3da';ctx.beginPath();ctx.arc(0,0,project.settings.circles.outer/2,0,Math.PI*2);ctx.fill()}
      drawGuides(ctx,project.settings.circles,project.settings.output.guides);ctx.restore()
    }
  },[spec,page,images])
  return <canvas ref={canvas} className="sheet-canvas" role="img" aria-label={`Sheet ${page+1} preview with actual export guide settings`}/>
})
