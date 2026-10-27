import { memo, useState } from 'react'
import type { Preset, Settings as SettingsType } from '../core/model'
import { Check, NumberField, SelectField } from './controls'
export const Settings=memo(function Settings({settings:s,onChange,presets,onSavePreset}:{settings:SettingsType;onChange:(s:SettingsType)=>void;presets:Preset[];onSavePreset:(name:string)=>void}) {
  const [unit,setUnit]=useState('mm');const [name,setName]=useState('')
  const [customPaper,setCustomPaper]=useState(false)
  const paperSize=s.paper.width===210&&s.paper.height===297?'a4':s.paper.width===215.9&&s.paper.height===279.4?'letter':'custom'
  const factor=unit==='in'?25.4:1
  const dimension=(label:string,value:number,change:(v:number)=>void)=>{
    const error=label==='Cut diameter'&&s.circles.outer<s.circles.inner?'Cut must be at least the face diameter.':label==='Safe inset'&&s.circles.safeInset>=s.circles.inner/2?'Inset must be smaller than the face radius.':undefined
    const minimum=label.includes('diameter')?0.1:label==='Paper width'||label==='Paper height'?1:0
    return <NumberField label={label} value={value/factor} onChange={v=>change(v*factor)} unit={unit} step={unit==='mm'?0.5:0.01} min={minimum/factor} max={2000/factor} error={error}/>
  }
  const circle=(key:keyof typeof s.circles,value:number)=>onChange({...s,circles:{...s.circles,[key]:value}})
  return <section className="inspector" aria-label="Project settings">
    <div className="section-title"><h2>Sheet settings</h2><select name="measurement-unit" aria-label="Measurement unit" value={unit} onChange={e=>setUnit(e.target.value)}><option value="mm">mm</option><option value="in">inches</option></select></div>
    <section className="settings-group"><h3>Pin dimensions</h3>
      <SelectField label="Preset" value="" onChange={value=>{const selected=presets[Number(value)];if(selected){setCustomPaper(false);onChange(structuredClone(selected.settings))}}}><option value="">Custom settings</option>{presets.map((p,i)=><option key={p.name} value={i}>{p.name}</option>)}</SelectField>
      <div className="two-col">{dimension('Face diameter',s.circles.inner,v=>circle('inner',v))}{dimension('Cut diameter',s.circles.outer,v=>circle('outer',v))}</div>
      {dimension('Safe inset',s.circles.safeInset,v=>circle('safeInset',v))}
      <p className="hint">{Number.isFinite(s.circles.outer-s.circles.inner)?((s.circles.outer-s.circles.inner)/2).toFixed(2):'—'} mm wrap on each side</p>
    </section>
    <details open className="settings-group"><summary>Paper & margins</summary>
      <SelectField label="Paper size" value={customPaper?'custom':paperSize} onChange={v=>{setCustomPaper(v==='custom');if(v==='a4'||v==='letter')onChange({...s,paper:{...s.paper,width:v==='a4'?210:215.9,height:v==='a4'?297:279.4}})}}><option value="a4">A4 · 210 × 297 mm</option><option value="letter">US Letter · 215.9 × 279.4 mm</option><option value="custom">Custom</option></SelectField>
      {customPaper||paperSize==='custom'?<div className="two-col">{dimension('Paper width',s.paper.width,v=>onChange({...s,paper:{...s.paper,width:v}}))}{dimension('Paper height',s.paper.height,v=>onChange({...s,paper:{...s.paper,height:v}}))}</div>:null}
      <SelectField label="Orientation" value={s.paper.orientation} onChange={v=>onChange({...s,paper:{...s.paper,orientation:v as typeof s.paper.orientation}})}><option value="auto">Auto · best capacity</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></SelectField>
      <div className="section-title"><h4>Margins</h4><button className="text-button" onClick={()=>onChange({...s,paper:{...s.paper,margins:{top:5,right:5,bottom:5,left:5}}})}>Use 5 mm</button></div>
      <div className="two-col">{(['top','right','bottom','left'] as const).map(k=><div key={k}>{dimension(`${k[0].toUpperCase()+k.slice(1)} margin`,s.paper.margins[k],v=>onChange({...s,paper:{...s.paper,margins:{...s.paper.margins,[k]:v}}}))}</div>)}</div>
      <label className="field"><span>Paper type / weight</span><input name="paper-description" autoComplete="off" value={s.paper.description} maxLength={200} placeholder="Matte, 120 gsm…" onChange={e=>onChange({...s,paper:{...s.paper,description:e.target.value}})}/></label>
    </details>
    <details open className="settings-group"><summary>Arrangement</summary>
      <SelectField label="Layout" value={s.layout.arrangement} onChange={v=>onChange({...s,layout:{...s.layout,arrangement:v as typeof s.layout.arrangement}})}><option value="auto">Auto · best capacity</option><option value="grid">Grid</option><option value="staggered">Staggered</option></SelectField>
      {dimension('Gap between cuts',s.layout.gap,v=>onChange({...s,layout:{...s.layout,gap:v}}))}
      <SelectField label="Design mixing" value={s.layout.mixing} onChange={v=>onChange({...s,layout:{...s.layout,mixing:v as typeof s.layout.mixing}})}><option value="mixed">Mix designs on sheets</option><option value="separate">Separate sheets per design</option></SelectField>
      <Check label="Limit copies per sheet" checked={s.layout.perSheet!==null} onChange={v=>onChange({...s,layout:{...s.layout,perSheet:v?10:null}})}/>
      {s.layout.perSheet!==null?<NumberField label="Copies per sheet" value={s.layout.perSheet} min={1} max={10000} integer onChange={v=>onChange({...s,layout:{...s.layout,perSheet:v}})}/>:null}
    </details>
    <details className="settings-group"><summary>Save reusable settings</summary><label className="field"><span>Preset name</span><input name="preset-name" autoComplete="off" value={name} maxLength={100} onChange={e=>setName(e.target.value)} placeholder="My pin & paper setup…"/></label><button disabled={!name.trim()} onClick={()=>{onSavePreset(name.trim());setName('')}}>Save preset</button><p className="hint">Copies settings, without artwork or a custom ICC profile.</p></details>
  </section>
})
