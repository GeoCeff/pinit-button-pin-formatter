import { memo, useEffect, useId, useRef, useState } from 'react'
import { Stage, Layer, Group, Circle, Line, Image as KonvaImage, Transformer } from 'react-konva'
import type Konva from 'konva'
import type { Asset, CircleSettings, Design } from '../core/model'
import { centerAlignment, snapToCenter } from '../core/alignment'
import { Icon } from './Icon'

export function useImages(sources:Record<string,string>) {
  const [images,setImages]=useState<Record<string,HTMLImageElement>>({})
  useEffect(()=>{let current=true;Promise.all(Object.entries(sources).map(([id,source])=>new Promise<[string,HTMLImageElement]>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve([id,img]);img.onerror=reject;img.src=source}))).then(entries=>{if(current)setImages(Object.fromEntries(entries))}).catch(()=>{if(current)setImages({})});return()=>{current=false}},[sources])
  return images
}
const alignmentColor = '#49624f'
export const Editor=memo(function Editor({design,asset,image,circles,onChange,guideVisibility,picking,onPick,onCancelPick}:{design:Design;asset:Asset;image?:HTMLImageElement;circles:CircleSettings;onChange:(patch:Partial<Design>)=>void;guideVisibility:{inner:boolean;outer:boolean;safe:boolean};picking:boolean;onPick:(color:string)=>void;onCancelPick:()=>void}) {
  const container=useRef<HTMLDivElement>(null)
  const stage=useRef<Konva.Stage>(null)
  const artwork=useRef<Konva.Image>(null)
  const transformer=useRef<Konva.Transformer>(null)
  const magnified=useRef<HTMLCanvasElement>(null)
  const loupe=useRef<HTMLDivElement>(null)
  const [size,setSize]=useState(440)
  const [interacting,setInteracting]=useState(false)
  const [selected,setSelected]=useState(false)
  const [sample,setSample]=useState<{x:number;y:number;color:string|null;left:number;top:number;keyboard:boolean}|null>(null)
  const instructionsId=useId()
  useEffect(()=>{const observer=new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;setSize(Math.max(120,Math.min(760,width-8,height-8)))});observer.observe(container.current!);return()=>observer.disconnect()},[])
  useEffect(()=>{transformer.current?.nodes(selected&&image&&!picking&&artwork.current?[artwork.current]:[])},[selected,image,picking])
  useEffect(()=>{if(picking||!image)setSelected(false)},[picking,image])
  useEffect(()=>{
    const outside=(event:PointerEvent)=>{if(!stage.current?.getContent().contains(event.target as Node))setSelected(false)}
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setSelected(false);if(picking)onCancelPick()}}
    document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',escape)
    return()=>{document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',escape)}
  },[picking,onCancelPick])
  useEffect(()=>{setSample(null);if(picking&&image){container.current?.focus({preventScroll:true});sampleAt({x:size/2,y:size/2})}},[picking,image])
  const scale=size/(circles.outer*1.14)
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
  function sampleAt(pos:{x:number;y:number},keyboard=false):string|null {
    if(!picking||!image||!magnified.current||!stage.current||!container.current)return null
    const local={x:(pos.x-size/2)/scale,y:(pos.y-size/2)/scale}
    if(Math.hypot(local.x,local.y)>circles.outer/2){setSample(null);return null}
    const x=local.x-t.x;const y=local.y-t.y;const angle=-t.rotation*Math.PI/180
    const px=(x*Math.cos(angle)-y*Math.sin(angle))/t.mmPerPixel+asset.width/2
    const py=(x*Math.sin(angle)+y*Math.cos(angle))/t.mmPerPixel+asset.height/2
    if(px<0||py<0||px>=asset.width||py>=asset.height){setSample(null);return null}
    const pixel={x:Math.floor(px),y:Math.floor(py)}
    const ctx=magnified.current.getContext('2d',{willReadFrequently:true})!
    ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,11,11)
    ctx.drawImage(image,pixel.x-5,pixel.y-5,11,11,0,0,11,11)
    const data=ctx.getImageData(5,5,1,1).data
    const color=data[3]?'#'+[data[0],data[1],data[2]].map(n=>n.toString(16).padStart(2,'0')).join(''):null
    const bounds=container.current.getBoundingClientRect(),content=stage.current.getContent().getBoundingClientRect()
    const pointer={x:content.left-bounds.left+pos.x*content.width/size,y:content.top-bounds.top+pos.y*content.height/size}
    const width=loupe.current?.offsetWidth||114,height=loupe.current?.offsetHeight||172
    const left=pointer.x+24+width>bounds.width-8?pointer.x-width-24:pointer.x+24
    const top=pointer.y-height-20<8?pointer.y+20:pointer.y-height-20
    setSample({...pixel,color,keyboard,left:Math.max(8,Math.min(left,bounds.width-width-8)),top:Math.max(8,Math.min(top,bounds.height-height-8))})
    return color
  }
  function pointerSample(commit=false){const pos=stage.current?.getPointerPosition();if(!pos)return;const color=sampleAt(pos);if(commit&&color)onPick(color)}
  function keyboardSample(key:string){
    if(key==='Enter'||key===' '){if(sample?.color)onPick(sample.color);return}
    const dx=key==='ArrowRight'?1:key==='ArrowLeft'?-1:0,dy=key==='ArrowDown'?1:key==='ArrowUp'?-1:0
    const px=Math.max(0,Math.min(asset.width-1,(sample?.x??Math.floor(asset.width/2))+dx))
    const py=Math.max(0,Math.min(asset.height-1,(sample?.y??Math.floor(asset.height/2))+dy))
    const x=(px+.5-asset.width/2)*t.mmPerPixel,y=(py+.5-asset.height/2)*t.mmPerPixel,angle=t.rotation*Math.PI/180
    sampleAt({x:size/2+(t.x+x*Math.cos(angle)-y*Math.sin(angle))*scale,y:size/2+(t.y+x*Math.sin(angle)+y*Math.cos(angle))*scale},true)
  }
  return <div className="artwork-editor" role="group" aria-label="Artwork positioning" aria-describedby={instructionsId}>
    <p id={instructionsId} className="sr-only">{picking?'Eyedropper active. Move over the artwork to magnify its original pixels. The outlined center pixel is sampled. Click or release a touch to apply its color. Arrow keys move one source pixel; Enter or Space applies it. Escape cancels without changing the background. Transparent pixels cannot be picked.':'Click or tap the artwork to show its resize handles. Click outside it or press Escape to hide them. With the artwork canvas focused, press Enter or Space to select it. Drag to position the image. Drag a round corner handle to resize it proportionally. Hold Alt while dragging to skip center snapping. Use Adjust artwork above for exact width, rotation and horizontal or vertical offsets. Center artwork aligns both axes without changing size or rotation.'}</p>
    <div className="alignment-toolbar">
      <div className={`alignment-feedback ${status==='Centered'?'is-centered':''}`}>
        <span className="alignment-symbol" aria-hidden="true"><Icon name={status==='Centered'?'check':'center'} size={20}/></span>
        <div><span className="alignment-status" role="status" aria-live="polite" aria-atomic="true">{status}</span><span className="alignment-hint">{status==='Centered'?'Aligned on both axes':status==='Centered horizontally'?'Move up or down to finish aligning':status==='Centered vertically'?'Move left or right to finish aligning':'Drag to align, or center in one click'}</span></div>
        <button className="center-button" disabled={!image||picking||(aligned.horizontal&&aligned.vertical)} onClick={()=>{setSelected(false);onChange({fit:'manual',transform:{...t,x:0,y:0}})}}><Icon name="center" size={16}/>Center artwork</button>
      </div>
    </div>
    <div ref={container} className={`editor-canvas ${picking?'picking':''}`} role="group" aria-label="Artwork canvas" aria-describedby={instructionsId} tabIndex={image?0:-1} onPointerLeave={()=>setSample(null)} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget)){setSelected(false);setSample(null)}}} onKeyDown={event=>{if(picking&&['Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();keyboardSample(event.key)}else if((event.key==='Enter'||event.key===' ')&&image){event.preventDefault();setSelected(true)}}}>
    <Stage ref={stage} width={size} height={size} scaleX={scale} scaleY={scale} x={size/2} y={size/2} onPointerMove={()=>{if(picking)pointerSample()}} onPointerUp={()=>{if(picking)pointerSample(true)}} onPointerDown={event=>{if(picking){pointerSample();return}setSelected(event.target===artwork.current||!!transformer.current?.isAncestorOf(event.target));container.current?.focus({preventScroll:true})}}>
      <Layer>
        <Circle radius={circles.outer/2} fill="#ffffff" listening={false}/>
        <Group clipFunc={ctx=>{ctx.arc(0,0,circles.outer/2,0,Math.PI*2)}}>
          <Circle radius={circles.outer/2} fill={design.fill}/>
          {image?<KonvaImage ref={artwork} image={image} width={asset.width} height={asset.height} offsetX={asset.width/2} offsetY={asset.height/2} x={t.x} y={t.y} scaleX={t.mmPerPixel} scaleY={t.mmPerPixel} rotation={t.rotation} draggable={!picking}
            dragBoundFunc={(position,event)=>{
              const parent=artwork.current!.getParent()!.getAbsoluteTransform()
              const local=parent.copy().invert().point(position)
              // Snap before Konva moves the image and handles, within six screen pixels.
              return parent.point(event.altKey?local:snapToCenter({...t,...local},6/scale))
            }}
            onDragStart={()=>{setSelected(true);setInteracting(true)}} onDragMove={drag} onDragEnd={event=>{drag(event);setInteracting(false)}}
            onTransformStart={()=>setInteracting(true)} onTransform={resize} onTransformEnd={()=>{resize();setInteracting(false)}}/>:null}
        </Group>
        {guideVisibility.outer?<Circle radius={circles.outer/2} stroke="#55554e" strokeWidth={0.25} listening={false}/>:null}
        {guideVisibility.inner?<Circle radius={circles.inner/2} stroke="#78766d" strokeWidth={0.18} dash={[1,0.7]} listening={false}/>:null}
        {guideVisibility.safe?<Circle radius={circles.inner/2-circles.safeInset} stroke="#55554e" strokeWidth={0.15} dash={[0.4,0.6]} listening={false}/>:null}
        <Transformer ref={transformer} visible={selected&&!!image&&!picking} rotateEnabled={false} keepRatio centeredScaling flipEnabled={false} shiftBehavior="none" enabledAnchors={['top-left','top-right','bottom-left','bottom-right']}
          borderStroke={alignmentColor} borderStrokeWidth={1} borderDash={[4,3]} anchorStroke={alignmentColor} anchorFill="#ffffff" anchorStrokeWidth={2} anchorSize={12} anchorCornerRadius={6}
          anchorStyleFunc={anchor=>{anchor.hitFunc((context,shape)=>{context.beginPath();context.rect(-6,-6,anchor.width()+12,anchor.height()+12);context.closePath();context.fillStrokeShape(shape)})}}
          boundBoxFunc={(previous,next)=>{const proposedScale=(artwork.current?.scaleX()??t.mmPerPixel)*next.width/previous.width;return next.width<=0||next.height<=0||Math.max(next.width,next.height)<12||!Number.isFinite(proposedScale)||proposedScale<0.000001||proposedScale>2000?previous:next}}/>
        {interacting&&!picking?([aligned.horizontal?[0,-guideExtent,0,guideExtent]:null,aligned.vertical?[-guideExtent,0,guideExtent,0]:null]).map((points,index)=>points?<Group key={index} listening={false}>
          <Line points={points} stroke="#ffffff" strokeWidth={3/scale} opacity={0.85}/><Line points={points} stroke={alignmentColor} strokeWidth={1/scale}/>
        </Group>:null):null}
        {interacting&&!picking&&aligned.horizontal&&aligned.vertical?<Circle radius={3/scale} fill={alignmentColor} stroke="#ffffff" strokeWidth={1/scale} listening={false}/>:null}
      </Layer>
    </Stage>
    {picking?<div ref={loupe} className="eyedropper-loupe" hidden={!sample} style={{transform:`translate(${sample?.left??0}px,${sample?.top??0}px)`}} role="group" aria-label={sample?`Magnified source pixel ${sample.x+1}, ${sample.y+1}: ${sample.color??'transparent, cannot pick'}`:'Magnified source pixels'}>
      <div className="eyedropper-pixels"><canvas ref={magnified} width={11} height={11}/><svg viewBox="0 0 110 110" aria-hidden="true"><path d={Array.from({length:10},(_,i)=>{const p=(i+1)*10;return `M${p} 0V110M0 ${p}H110`}).join(' ')} fill="none" stroke="black" strokeOpacity=".15" strokeWidth=".5"/><rect x="49" y="49" width="12" height="12" fill="none" stroke="white" strokeWidth="2"/><rect x="50" y="50" width="10" height="10" fill="none" stroke="black" strokeWidth="1"/></svg></div>
      <div className="eyedropper-readout"><i style={{background:sample?.color??'transparent'}}/><span className="eyedropper-hex" role="status" aria-live={sample?.keyboard?'polite':'off'} aria-atomic="true">{sample?.color?.toUpperCase()??'Transparent'}</span></div><span className="eyedropper-hint">Esc to cancel</span>
    </div>:null}
    </div>
  </div>
})
