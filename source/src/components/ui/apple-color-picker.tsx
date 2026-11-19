import { useEffect, useId, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useModal } from '@/ui/controls'
import { Icon } from '@/ui/Icon'

type RGB = { r:number; g:number; b:number }
type HSV = { h:number; s:number; v:number }
type Tab = 'Grid' | 'Spectrum' | 'Sliders'
interface Props { isOpen:boolean; onClose:()=>void; initialColor?:string; onChange:(hex:string)=>void; onPick:()=>void; canPick:boolean }
const tabs:Tab[]=['Grid','Spectrum','Sliders']
const paletteKey='dfcuts.saved-colors.v1'
const clamp=(value:number,min=0,max=255)=>Math.max(min,Math.min(max,value))
function normalizeHex(value:string):string|null {
  const hex=value.trim().replace(/^#/,'')
  if(/^[\da-f]{6}$/i.test(hex))return '#'+hex.toLowerCase()
  if(/^[\da-f]{3}$/i.test(hex))return '#'+[...hex].map(char=>char+char).join('').toLowerCase()
  return null
}
function hexToRgb(hex:string):RGB {return {r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)}}
function rgbToHex(rgb:RGB):string {return '#'+[rgb.r,rgb.g,rgb.b].map(value=>Math.round(clamp(value)).toString(16).padStart(2,'0')).join('')}
function rgbToHsv({r,g,b}:RGB):HSV {
  r/=255;g/=255;b/=255
  const max=Math.max(r,g,b),delta=max-Math.min(r,g,b)
  let h=0
  if(delta){if(max===r)h=((g-b)/delta+6)%6;else if(max===g)h=(b-r)/delta+2;else h=(r-g)/delta+4}
  return {h:h*60,s:max?delta/max*100:0,v:max*100}
}
function hsvToRgb({h,s,v}:HSV):RGB {
  s/=100;v/=100
  const channel=(offset:number)=>{const k=(offset+h/60)%6;return Math.round(255*(v-v*s*Math.max(0,Math.min(k,4-k,1))))}
  return {r:channel(5),g:channel(3),b:channel(1)}
}
const gridColors=[
  '#FFFFFF','#EBEBEB','#D6D6D6','#C2C2C2','#ADADAD','#999999','#858585','#707070','#5C5C5C','#474747','#333333','#000000',
  '#003366','#336699','#3366CC','#003399','#000099','#0000CC','#000066','#333366','#663399','#660099','#330066','#330033',
  '#006699','#0099CC','#0066CC','#0033CC','#0000FF','#3333FF','#333399','#6633CC','#9933CC','#9900CC','#6600CC','#660066',
  '#0099CC','#00CCFF','#0099FF','#0066FF','#3366FF','#6666FF','#6666CC','#9966CC','#CC66FF','#CC33FF','#9900FF','#990099',
  '#33CCCC','#66FFFF','#33CCFF','#3399FF','#6699FF','#9999FF','#9999CC','#CC99FF','#FF99FF','#FF66FF','#CC00FF','#CC00CC',
  '#66CCCC','#99FFFF','#66CCFF','#6699FF','#99CCFF','#CCCCFF','#CC99CC','#FFCCFF','#FF99FF','#FF66FF','#FF33FF','#FF00FF',
  '#99CCCC','#CCFFFF','#99CCFF','#9999FF','#CCCCFF','#FFFFFF','#FFCCFF','#FF99FF','#FF66FF','#FF00FF','#CC00CC','#990099',
  '#CCFFCC','#FFFFCC','#FFFF99','#FFFF66','#FFFF33','#FFFF00','#FFCC00','#FF9900','#FF6600','#FF3300','#FF0000','#CC0000',
  '#99FF99','#CCFF99','#CCCC66','#CCCC33','#CCCC00','#CC9900','#CC6600','#CC3300','#CC0000','#990000','#660000','#330000',
  '#66FF66','#99FF66','#99CC66','#99CC33','#999900','#996600','#993300','#990000','#660000','#330000','#000000','#000000',
  '#33FF33','#66FF33','#66CC33','#669933','#666600','#663300','#660000','#330000','#000000','#000000','#000000','#000000',
  '#00FF00','#33FF00','#33CC00','#339900','#336600','#333300','#330000','#000000','#000000','#000000','#000000','#000000',
]
function loadColors():string[] {
  try {
    const raw:unknown=JSON.parse(localStorage.getItem(paletteKey)??'[]')
    return Array.isArray(raw)?[...new Set(raw.filter((value):value is string=>typeof value==='string'&&/^#[\da-f]{6}$/i.test(value)).map(value=>value.toLowerCase()))].slice(0,12):[]
  } catch {return []}
}
function Picker({onClose,initialColor='#007aff',onChange,onPick,canPick}:Omit<Props,'isOpen'>) {
  const ref=useModal(),id=useId()
  useEffect(()=>{ref.current?.querySelector<HTMLElement>('[role=tab][aria-selected=true]')?.focus()},[ref])
  const [tab,setTab]=useState<Tab>('Grid')
  const [hex,setHex]=useState(()=>normalizeHex(initialColor)??'#000000')
  const [hsv,setHsv]=useState(()=>rgbToHsv(hexToRgb(hex)))
  const [hexDraft,setHexDraft]=useState(hex.toUpperCase())
  const [saved,setSaved]=useState(loadColors)
  const [storageError,setStorageError]=useState('')
  const [gridFocus,setGridFocus]=useState(()=>Math.max(0,gridColors.findIndex(color=>color.toLowerCase()===hex)))
  const rgb=hexToRgb(hex)
  const invalidHex=!normalizeHex(hexDraft)
  function choose(next:string,nextHsv?:HSV) {
    const color=normalizeHex(next)
    if(!color)return
    setHex(color);setHexDraft(color.toUpperCase());setHsv(nextHsv??rgbToHsv(hexToRgb(color)))
    if(color!==hex)onChange(color)
  }
  function chooseHsv(next:HSV){choose(rgbToHex(hsvToRgb(next)),next)}
  function commitHex(){const color=normalizeHex(hexDraft);if(color)choose(color)}
  function moveSpectrum(event:PointerEvent<HTMLDivElement>){
    const bounds=event.currentTarget.getBoundingClientRect()
    chooseHsv({...hsv,s:clamp((event.clientX-bounds.left)/bounds.width,0,1)*100,v:(1-clamp((event.clientY-bounds.top)/bounds.height,0,1))*100})
  }
  function spectrumKey(event:KeyboardEvent<HTMLDivElement>){
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return
    event.preventDefault()
    const step=event.shiftKey?10:1
    chooseHsv({...hsv,s:clamp(hsv.s+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0),0,100),v:clamp(hsv.v+(event.key==='ArrowUp'?step:event.key==='ArrowDown'?-step:0),0,100)})
  }
  function gridKey(event:KeyboardEvent<HTMLButtonElement>,index:number){
    const columns=getComputedStyle(event.currentTarget.parentElement!).gridTemplateColumns.split(' ').length
    let next=index
    switch(event.key){case 'ArrowRight':next++;break;case 'ArrowLeft':next--;break;case 'ArrowDown':next+=columns;break;case 'ArrowUp':next-=columns;break;case 'Home':next=0;break;case 'End':next=gridColors.length-1;break;default:return}
    event.preventDefault();next=clamp(next,0,gridColors.length-1);setGridFocus(next)
    event.currentTarget.parentElement!.querySelectorAll('button')[next].focus()
  }
  function saveColor(){
    const next=[hex,...saved.filter(color=>color!==hex)].slice(0,12)
    setSaved(next)
    try{localStorage.setItem(paletteKey,JSON.stringify(next));setStorageError('')}catch{setStorageError('Color selected, but it could not be saved for reuse. Try again.')}
  }
  return <dialog ref={ref} className="dialog apple-color-picker" aria-labelledby={id+'-title'} aria-describedby={id+'-description'} onCancel={event=>{event.preventDefault();onClose()}}>
    <div className="color-picker-header">
      <button className="icon-button quiet-button" aria-label="Pick color from artwork" title="Pick color from artwork" disabled={!canPick} onClick={()=>{onClose();requestAnimationFrame(onPick)}}><Icon name="dropper"/></button>
      <h2 id={id+'-title'}>Colors</h2>
      <button className="icon-button quiet-button" aria-label="Close color picker" onClick={onClose}><Icon name="close"/></button>
    </div>
    <p id={id+'-description'} className="sr-only">Choose a solid background color. Changes apply to the artwork immediately.</p>
    <div className="color-picker-tabs" role="tablist" aria-label="Color selection method">
      {tabs.map((option,index)=><button type="button" key={option} id={id+'-'+option} role="tab" aria-selected={tab===option} aria-controls={id+'-panel'} tabIndex={tab===option?0:-1} onClick={()=>setTab(option)} onKeyDown={event=>{
        let next=index
        if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return
        event.preventDefault();setTab(tabs[next]);event.currentTarget.parentElement!.querySelectorAll('button')[next].focus()
      }}>{option}</button>)}
    </div>
    <div id={id+'-panel'} role="tabpanel" aria-labelledby={id+'-'+tab} className="color-picker-panel">
      {tab==='Grid'?<div className="color-picker-grid" role="group" aria-label="Color swatches">
        {gridColors.map((color,index)=><button type="button" key={index} aria-label={`Color ${color}, swatch ${index+1}`} title={color} aria-pressed={color.toLowerCase()===hex} tabIndex={gridFocus===index?0:-1} style={{backgroundColor:color}} onFocus={()=>setGridFocus(index)} onKeyDown={event=>gridKey(event,index)} onClick={()=>choose(color)}/>)}
      </div>:tab==='Spectrum'?<div className="color-picker-spectrum">
        <div className="color-picker-plane" role="group" tabIndex={0} aria-label="Color spectrum" aria-describedby={id+'-spectrum-help'} style={{backgroundColor:`hsl(${hsv.h} 100% 50%)`}} onKeyDown={spectrumKey} onPointerDown={event=>{if(!event.isPrimary||event.button!==0)return;event.preventDefault();event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);moveSpectrum(event)}} onPointerMove={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))moveSpectrum(event)}} onPointerUp={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId)){moveSpectrum(event);event.currentTarget.releasePointerCapture(event.pointerId)}}}>
          <span className="color-picker-cursor" style={{left:hsv.s+'%',top:(100-hsv.v)+'%',backgroundColor:hex}}/>
        </div>
        <span className="sr-only" id={id+'-spectrum-help'}>Left and right change saturation; up and down change brightness. Hold Shift for larger steps. Saturation {Math.round(hsv.s)}%, brightness {Math.round(hsv.v)}%.</span>
        <label className="color-picker-hue"><span className="sr-only">Hue</span><input type="range" min={0} max={360} value={hsv.h} aria-valuetext={`${Math.round(hsv.h)} degrees`} onChange={event=>chooseHsv({...hsv,h:Number(event.target.value)})}/></label>
      </div>:<div className="color-picker-sliders">
        {(['r','g','b'] as const).map((channel,index)=>{const label=['Red','Green','Blue'][index];const low={...rgb,[channel]:0},high={...rgb,[channel]:255};return <div className="color-picker-channel" key={channel}>
          <label htmlFor={id+'-'+channel}>{label}</label>
          <input id={id+'-'+channel} type="range" min={0} max={255} step={1} value={rgb[channel]} style={{backgroundImage:`linear-gradient(to right,${rgbToHex(low)},${rgbToHex(high)})`}} onChange={event=>choose(rgbToHex({...rgb,[channel]:Number(event.target.value)}))}/>
          <input aria-label={label+' value'} type="number" inputMode="numeric" min={0} max={255} step={1} value={rgb[channel]} onChange={event=>{const value=event.target.valueAsNumber;if(Number.isFinite(value))choose(rgbToHex({...rgb,[channel]:value}))}}/>
        </div>})}
      </div>}
    </div>
    <div className="color-picker-readout"><span className="color-picker-current" role="img" style={{backgroundColor:hex}} aria-label={'Current color '+hex.toUpperCase()}/><label className="field"><span>Hex color</span><input value={hexDraft} name="hex-color" autoComplete="off" spellCheck={false} maxLength={7} aria-invalid={invalidHex} aria-describedby={invalidHex?id+'-hex-error':undefined} onChange={event=>{const value=event.target.value;setHexDraft(value);if(/^#?[\da-f]{6}$/i.test(value))choose(value)}} onBlur={commitHex} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();commitHex()}}}/></label></div>
    {invalidHex?<p id={id+'-hex-error'} className="field-error">Use 3 or 6 hexadecimal digits, such as #315E4C.</p>:null}
    <div className="color-picker-saved"><div className="color-picker-saved-heading"><h3>Saved colors</h3><button className="text-button" disabled={invalidHex} onClick={saveColor}><Icon name="plus" size={14}/>Save color</button></div>
      {saved.length?<div className="color-picker-saved-list">{saved.map(color=><button key={color} aria-label={'Saved color '+color.toUpperCase()} title={color.toUpperCase()} aria-pressed={hex===color} style={{backgroundColor:color}} onClick={()=>choose(color)}/>)}</div>:<p>Save a color to reuse it across designs.</p>}
      {saved.length===12?<p>Saving another color replaces the oldest saved color.</p>:null}
      {storageError?<p className="field-error" role="status">{storageError}</p>:null}
    </div>
    <div className="color-picker-footer"><span>Solid print color</span><button onClick={onClose} className="primary">Done</button></div>
  </dialog>
}
export function Component({isOpen,...props}:Props){return isOpen?<Picker {...props}/>:null}
