import { memo, useEffect, useRef, useState } from 'react'
import { Stage, Layer, Group, Circle, Line, Image as KonvaImage, Transformer } from 'react-konva'
import type Konva from 'konva'
import type { Asset, CircleSettings, Design } from '../core/model'
import { centerAlignment, snapToCenter } from '../core/alignment'

export function useImages(sources:Record<string,string>) {
  const [images,setImages]=useState<Record<string,HTMLImageElement>>({})
  useEffect(()=>{let current=true;Promise.all(Object.entries(sources).map(([id,source])=>new Promise<[string,HTMLImageElement]>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve([id,img]);img.onerror=reject;img.src=source}))).then(entries=>{if(current)setImages(Object.fromEntries(entries))}).catch(()=>{if(current)setImages({})});return()=>{current=false}},[sources])
  return images
}
const alignmentColor = '#0d6f91'
export const Editor=memo(function Editor({design,asset,image,circles,onChange,guideVisibility,picking,onPick}:{design:Design;asset:Asset;image?:HTMLImageElement;circles:CircleSettings;onChange:(patch:Partial<Design>)=>void;guideVisibility:{inner:boolean;outer:boolean;safe:boolean};picking:boolean;onPick:(color:string)=>void}) {
  const container=useRef<HTMLDivElement>(null)
  const artwork=useRef<Konva.Image>(null)
  const transformer=useRef<Konva.Transformer>(null)
  const [size,setSize]=useState(440)
  const [interacting,setInteracting]=useState(false)
  useEffect(()=>{const observer=new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;setSize(Math.max(120,Math.min(560,width-8,height-8)))});observer.observe(container.current!);return()=>observer.disconnect()},[])
  useEffect(()=>{transformer.current?.nodes(image&&!picking&&artwork.current?[artwork.current]:[])},[image,picking])
  const scale=size/(circles.outer*1.34)
  const t=design.transform
  const aligned=centerAlignment(t)
  const status=aligned.horizontal&&aligned.vertical?'Centered':aligned.horizontal?'Centered horizontally':aligned.vertical?'Centered vertically':'Off center'
  const guideExtent=circles.outer/2+8/scale
  function drag(event:Konva.KonvaEventObject<DragEvent>) {
    const node=event.target
    onChange({fit:'manual',transform:{...t,x:node.x(),y:node.y()}})
  }
  function resize() {
    const node=artwork.current!
    onChange({fit:'manual',transform:{...t,x:node.x(),y:node.y(),mmPerPixel:node.scaleX()}})
  }
  function pick(event:Konva.KonvaEventObject<MouseEvent>) {
    if(!picking||!image)return
    const stage=event.target.getStage()!;const pos=stage.getPointerPosition()!
    const x=(pos.x-size/2)/scale-t.x;const y=(pos.y-size/2)/scale-t.y;const angle=-t.rotation*Math.PI/180
    const px=(x*Math.cos(angle)-y*Math.sin(angle))/t.mmPerPixel+asset.width/2
    const py=(x*Math.sin(angle)+y*Math.cos(angle))/t.mmPerPixel+asset.height/2
    if(px<0||py<0||px>=asset.width||py>=asset.height)return
    const sample=document.createElement('canvas');sample.width=sample.height=1;const ctx=sample.getContext('2d')!
    ctx.drawImage(image,Math.floor(px),Math.floor(py),1,1,0,0,1,1);const data=ctx.getImageData(0,0,1,1).data
    if(data[3]===0)return
    onPick('#'+[data[0],data[1],data[2]].map(n=>n.toString(16).padStart(2,'0')).join(''))
  }
  return <div className="artwork-editor">
    <div className="alignment-toolbar">
      <span className={`alignment-status ${status==='Centered'?'is-centered':''}`} role="status" aria-live="polite">{status}</span>
      <button className="text-button" disabled={!image||picking||(aligned.horizontal&&aligned.vertical)} onClick={()=>onChange({fit:'manual',transform:{...t,x:0,y:0}})}>Center artwork</button>
    </div>
    <div ref={container} className={`editor-canvas ${picking?'picking':''}`}>
    <Stage width={size} height={size} scaleX={scale} scaleY={scale} x={size/2} y={size/2} onClick={pick}>
      <Layer>
        <Circle radius={circles.outer/2} fill="#ffffff"/>
        <Group clipFunc={ctx=>{ctx.arc(0,0,circles.outer/2,0,Math.PI*2)}}>
          <Circle radius={circles.outer/2} fill={design.fill}/>
          {image?<KonvaImage ref={artwork} image={image} width={asset.width} height={asset.height} offsetX={asset.width/2} offsetY={asset.height/2} x={t.x} y={t.y} scaleX={t.mmPerPixel} scaleY={t.mmPerPixel} rotation={t.rotation} draggable={!picking}
            dragBoundFunc={(position,event)=>{
              const parent=artwork.current!.getParent()!.getAbsoluteTransform()
              const local=parent.copy().invert().point(position)
              // Snap before Konva moves the image and handles, within six screen pixels.
              return parent.point(event.altKey?local:snapToCenter({...t,...local},6/scale))
            }}
            onDragStart={()=>setInteracting(true)} onDragMove={drag} onDragEnd={event=>{drag(event);setInteracting(false)}}
            onTransformStart={()=>setInteracting(true)} onTransform={resize} onTransformEnd={()=>{resize();setInteracting(false)}}/>:null}
        </Group>
        {guideVisibility.outer?<Circle radius={circles.outer/2} stroke="#28566d" strokeWidth={0.25} listening={false}/>:null}
        {guideVisibility.inner?<Circle radius={circles.inner/2} stroke="#966117" strokeWidth={0.18} dash={[1,0.7]} listening={false}/>:null}
        {guideVisibility.safe?<Circle radius={circles.inner/2-circles.safeInset} stroke="#28566d" strokeWidth={0.15} dash={[0.4,0.6]} listening={false}/>:null}
        <Transformer ref={transformer} visible={!!image&&!picking} rotateEnabled={false} keepRatio centeredScaling flipEnabled={false} shiftBehavior="none" enabledAnchors={['top-left','top-right','bottom-left','bottom-right']}
          borderStroke={alignmentColor} borderStrokeWidth={1} anchorStroke={alignmentColor} anchorFill="#ffffff" anchorStrokeWidth={1.5} anchorSize={10} anchorCornerRadius={2}
          boundBoxFunc={(previous,next)=>{const proposedScale=(artwork.current?.scaleX()??t.mmPerPixel)*next.width/previous.width;return next.width<=0||next.height<=0||Math.max(next.width,next.height)<12||!Number.isFinite(proposedScale)||proposedScale<0.000001||proposedScale>2000?previous:next}}/>
        {interacting&&!picking?([aligned.horizontal?[0,-guideExtent,0,guideExtent]:null,aligned.vertical?[-guideExtent,0,guideExtent,0]:null]).map((points,index)=>points?<Group key={index} listening={false}>
          <Line points={points} stroke="#ffffff" strokeWidth={3/scale} opacity={0.85}/><Line points={points} stroke={alignmentColor} strokeWidth={1/scale}/>
        </Group>:null):null}
        {interacting&&!picking&&aligned.horizontal&&aligned.vertical?<Circle radius={3/scale} fill={alignmentColor} stroke="#ffffff" strokeWidth={1/scale} listening={false}/>:null}
      </Layer>
    </Stage>
    </div>
  </div>
})
