import { useCallback, useDeferredValue, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { defaultSettings, fitImage, newProject, type Design, type Preset, type Project } from '../core/model'
import { buildSheetPlan } from '../core/layout'
import { validateProject } from '../core/validation'
import { buildRenderSpec, checkExportSize, type RenderSpec } from '../render/spec'
import { projectReducer } from '../state/project'
import { Check, Confirm, Dialog } from './controls'
import { Icon } from './Icon'
import { InspectorTabs, type InspectorTab } from './InspectorTabs'
import { ArtworkControls, ArtworkLibrary } from './Workspace'
import { Editor, useImages } from './Editor'
import { SheetPreview } from './SheetPreview'
import { Settings } from './Settings'
import { ExportOptions } from './ExportOptions'

const initialPreset:Preset={name:'44 mm face / 53 mm cut · A4',settings:defaultSettings()}
export function App() {
  const [project,dispatch]=useReducer(projectReducer,undefined,newProject)
  const [savedRevision,setSavedRevision]=useState(0)
  const [selectedId,setSelectedId]=useState('')
  const [sources,setSources]=useState<Record<string,string>>({})
  const images=useImages(sources)
  const [presets,setPresets]=useState<Preset[]>([initialPreset])
  const [location,setLocation]=useState('')
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [ioBusy,setIoBusy]=useState(false)
  const [exportOpen,setExportOpen]=useState(false)
  const [exporting,setExporting]=useState(false)
  const [progress,setProgress]=useState('')
  const [cmyk,setCmyk]=useState(false)
  const [page,setPage]=useState(0)
  const [picking,setPicking]=useState(false)
  const [inspectorTab,setInspectorTab]=useState<InspectorTab>('artwork')
  const [guides,setGuides]=useState({inner:true,outer:true,safe:true})
  const [confirm,setConfirm]=useState<{title?:string;confirmLabel?:string;message:string;resolve:(v:boolean)=>void}|null>(null)
  const job=useRef<{id:string;worker:Worker;canceled:boolean}|null>(null)
  const deferred=useDeferredValue(project)
  const result=useMemo(()=>buildSheetPlan(deferred),[deferred])
  const valid=useMemo(()=>validateProject(project),[project])
  const renderedSpec=useMemo(()=>result.ok?buildRenderSpec(deferred,result.plan):null,[deferred,result])
  const lastSpec=useRef<RenderSpec|null>(null)
  if(renderedSpec)lastSpec.current=renderedSpec
  const spec=lastSpec.current
  const plan=spec?.plan
  const design=project.designs.find(d=>d.id===selectedId)??project.designs[0]
  const safeDesign=spec?.project.designs.find(d=>d.id===design?.id)
  const asset=project.assets.find(a=>a.id===design?.assetId)
  const dirty=project.revision!==savedRevision
  const total=project.designs.reduce((n,d)=>n+(Number.isFinite(d.quantity)?d.quantity:0),0)
  const currentDesignId=design?.id
  const updateDesign=useCallback((patch:Partial<Design>)=>{if(currentDesignId)dispatch({type:'design',id:currentDesignId,patch})},[currentDesignId])
  const updateSettings=useCallback((settings:Project['settings'])=>dispatch({type:'settings',settings}),[])
  const pickColor=useCallback((fill:string)=>{updateDesign({fill});setPicking(false)},[updateDesign])
  const selectDesign=useCallback((id:string)=>{setSelectedId(id);setInspectorTab('artwork')},[])
  useEffect(()=>window.desktop.setDirty(dirty),[dirty])
  useEffect(()=>{window.desktop.presets().then(p=>setPresets([initialPreset,...p])).catch(e=>setError(e.message));window.desktop.runtimeStatus().then(s=>setCmyk(s.cmyk)).catch(e=>setError(e.message));return window.desktop.onProgress(setProgress)},[])
  useEffect(()=>{setPage(0)},[plan?.sheets.length])
  useEffect(()=>{setPicking(false)},[design?.id])

  const operation=useCallback(async(fn:()=>Promise<void>)=>{setError('');setNotice('');setIoBusy(true);try{await fn()}catch(e){setError((e as Error).message)}finally{setIoBusy(false)}},[])
  async function canDiscard(){return !dirty||await new Promise<boolean>(resolve=>setConfirm({message:'Save your project first to keep the latest artwork and settings.',resolve}))}
  async function importArtwork(){await operation(async()=>{if(valid.length)throw new Error('Correct the project settings before importing artwork.');const added=await window.desktop.importImages();if(!added.length)return;dispatch({type:'import',images:added});setSources(previous=>({...previous,...Object.fromEntries(added.map(i=>[i.asset.id,i.source]))}));setSelectedId('');setInspectorTab('artwork');setNotice(`Imported ${added.length} ${added.length===1?'design':'designs'}.`)})}
  async function openProject(){if(!await canDiscard())return;await operation(async()=>{const opened=await window.desktop.openProject();if(!opened)return;dispatch({type:'replace',project:opened.project});setSavedRevision(opened.project.revision);setSources(Object.fromEntries(opened.images.map(i=>[i.asset.id,i.source])));setLocation(opened.location);setSelectedId('');setInspectorTab('artwork');if(opened.profileMissing)setError('The saved CMYK profile is missing. Import it again in Export sheets or select the bundled generic profile.');if(opened.missing.length)setError(`${opened.missing.length} source image(s) are missing or changed. Select each design and relink artwork. Its edits are preserved.`)})}
  async function saveProject(saveAs=false){await operation(async()=>{const snapshot=structuredClone(project);const path=await window.desktop.saveProject(snapshot,saveAs);if(path){setSavedRevision(snapshot.revision);setLocation(path);setNotice('Project saved with preserved source artwork.')}})}
  async function relink(){if(!design)return;await operation(async()=>{const imported=await window.desktop.relinkImage();if(!imported)return;dispatch({type:'relink',id:design.id,image:imported});setSources(previous=>({...previous,[imported.asset.id]:imported.source}));setNotice('Artwork relinked. Position, scale and quantity were retained.')})}
  function fit(mode:'safe'|'contain'|'fill'){if(!asset||valid.length)return;updateDesign({fit:mode,transform:fitImage(asset,project.settings.circles,mode)})}
  const savePreset=useCallback(async(name:string)=>{await operation(async()=>{const settings=structuredClone(project.settings);settings.output.profile=null;await window.desktop.savePreset({name,settings});const saved=await window.desktop.presets();setPresets([initialPreset,...saved]);setNotice('Preset saved. Existing projects keep their own settings.')})},[operation,project.settings])
  async function cancelExport(){const active=job.current;if(!active)return;active.canceled=true;active.worker.terminate();setProgress('Canceling…');try{await window.desktop.cancelExport(active.id);if(job.current===active){job.current=null;setProgress('Export canceled. Existing files are unchanged.');setExporting(false)}}catch(e){setError((e as Error).message)}}
  async function startExport(){
    setError('');setNotice('');setExporting(true);setProgress('Choose where to save…')
    let id:string|null=null
    try {
      const snapshot=structuredClone(project);const planned=buildSheetPlan(snapshot);if(!planned.ok)throw new Error(planned.error)
      const frozen=buildRenderSpec(snapshot,planned.plan);checkExportSize(frozen)
      id=await window.desktop.beginExport(snapshot);if(!id){setExporting(false);setProgress('');return}
      const worker=new Worker(new URL('../render/export.worker.ts',import.meta.url),{type:'module'})
      const active={id,worker,canceled:false};job.current=active;setExportOpen(false);setProgress('Preparing artwork…')
      const fail=async(message:string)=>{if(active.canceled)return;active.canceled=true;worker.terminate();try{await window.desktop.cancelExport(active.id)}catch{}if(job.current===active){job.current=null;setExporting(false);setProgress('');setError(message)}}
      worker.onerror=event=>void fail(event.message||'The export worker stopped. Try a smaller job.')
      worker.onmessage=async event=>{
        if(active.canceled)return
        if(event.data.error){await fail(event.data.error);return}
        if(event.data.progress)setProgress(event.data.progress)
        if(event.data.file){try{await window.desktop.writeExport(active.id,event.data.file.name,event.data.file.bytes);if(!active.canceled)worker.postMessage({ack:true})}catch(e){await fail((e as Error).message)}}
        if(event.data.done){worker.terminate();setProgress('Verifying and saving files…');try{const destination=await window.desktop.finishExport(active.id);setNotice(`Export saved: ${destination}`);setProgress('Export complete.');job.current=null;setExporting(false)}catch(e){await fail((e as Error).message)}}
      }
      worker.postMessage({spec:frozen,sources:structuredClone(sources)})
    }catch(e){if(id)await window.desktop.cancelExport(id).catch(()=>{});setExporting(false);setProgress('');setError((e as Error).message)}
  }

  async function removeDesign(item:Design) {
    const approved=await new Promise<boolean>(resolve=>setConfirm({title:'Remove artwork?',message:`Remove “${item.name}” and its copy count from this project?`,confirmLabel:'Remove artwork',resolve}))
    if(approved)dispatch({type:'remove',id:item.id})
  }
  async function createProject() {
    if(!await canDiscard())return
    await operation(async()=>{await window.desktop.resetSession();dispatch({type:'replace',project:newProject()});setSavedRevision(0);setSources({});setLocation('');setSelectedId('');setInspectorTab('artwork')})
  }
  const invalid=valid[0]??(!result.ok?result.error:'')
  const circles=spec?.project.settings.circles??project.settings.circles
  const setOutput=(output:Project['settings']['output'])=>updateSettings({...project.settings,output})
  return <div className="app">
    <a className="skip-link" href="#artwork-workspace">Skip to artwork workspace</a>
    <header className="topbar">
      <div className="brand" aria-label="PinIt"><span className="brand-mark" aria-hidden="true"/><div><strong>PinIt</strong><span>Button-pin studio</span></div></div>
      <div className="project-name"><input name="project-name" aria-label="Project name" autoComplete="off" spellCheck={false} maxLength={200} value={project.name} onChange={event=>dispatch({type:'name',name:event.target.value})}/><span>{ioBusy?'Working with local files…':dirty?'Unsaved changes':location?'Saved locally':'Local project'}</span></div>
      <div className="actions file-actions">
        <button className="quiet-button" disabled={ioBusy||exporting} onClick={()=>void createProject()}><Icon name="plus" size={16}/>New</button>
        <button className="quiet-button" disabled={ioBusy||exporting} onClick={()=>void openProject()}><Icon name="folder" size={16}/>Open</button>
        <button disabled={ioBusy||!!invalid} onClick={()=>void saveProject()}><Icon name="save" size={16}/>Save</button>
        <button className="quiet-button" aria-label="Save project as a copy" disabled={ioBusy||!!invalid} onClick={()=>void saveProject(true)}>Save as</button>
        <button className="primary" disabled={ioBusy||exporting||!!invalid||!total} onClick={()=>setExportOpen(true)}><Icon name="download" size={17}/>Export sheets</button>
      </div>
    </header>
    <div className="status-area">
      {error?<div className="message error" role="alert"><span>{error}</span><button className="text-button" onClick={()=>setError('')} aria-label="Dismiss error">Dismiss</button></div>:null}
      {notice?<div className="message notice" role="status"><Icon name="check" size={16}/><span>{notice}</span><button className="icon-button" onClick={()=>setNotice('')} aria-label="Dismiss notification"><Icon name="close" size={15}/></button></div>:null}
      {invalid?<div className="message error" role="alert"><span>{invalid} Last valid preview is retained.</span><button className="text-button" onClick={()=>setInspectorTab('sheet')}>Review settings</button></div>:null}
    </div>
    <main className="workspace">
      <ArtworkLibrary designs={project.designs} selectedId={design?.id} sources={sources} total={total} disabled={ioBusy||exporting} onImport={()=>void importArtwork()} onSelect={selectDesign} onRemove={item=>void removeDesign(item)}/>
      <section className="work-area" id="artwork-workspace" tabIndex={-1} aria-label="Artwork workspace">
        <div className="work-heading"><div><h1 title={design?.name}>{design?design.name:'Make your first pin.'}</h1><p>{design?'A little adjustment. A print that feels right.':'Bring your artwork. We’ll make room for it.'}</p></div><span className="local-badge"><Icon name="shield" size={15}/>Offline</span></div>
        <div className="canvas-panels">
          <section className="editor-panel" aria-label="Artwork editor">
            <div className="panel-heading"><h2>Artwork editor</h2><span>{circles.outer} mm cut</span></div>
            {design&&asset&&safeDesign&&spec?<><Editor key={`${design.id}-${asset.id}`} design={valid.length||!result.ok?safeDesign:design} asset={asset} image={images[design.assetId]} circles={spec.project.settings.circles} onChange={updateDesign} guideVisibility={guides} picking={picking} onPick={pickColor}/>{!sources[design.assetId]?<div className="missing-message">Source missing. <button className="text-button" onClick={()=>void relink()}>Relink artwork</button></div>:!images[design.assetId]?<p className="artwork-loading" role="status">Loading artwork…</p>:null}</>:<div className="empty-editor">
              <div className="empty-cut"><div className="empty-face" style={{width:`${circles.inner/circles.outer*100}%`}}/><div className="empty-safe" style={{width:`${(circles.inner-2*circles.safeInset)/circles.outer*100}%`}}/><div className="empty-placement"><Icon name="image" size={38}/><span>Your artwork goes here</span></div></div>
              <button className="primary" disabled={ioBusy} onClick={()=>void importArtwork()}><Icon name="plus" size={18}/>Import first design</button>
              <p>One design is all it takes to start.</p>
            </div>}
            <div className="guide-legend"><span>Guides</span><Check label="Cut" checked={guides.outer} onChange={value=>setGuides({...guides,outer:value})}/><Check label="Face" checked={guides.inner} onChange={value=>setGuides({...guides,inner:value})}/><Check label="Safe" checked={guides.safe} onChange={value=>setGuides({...guides,safe:value})}/></div>
            <p className="canvas-caption">{picking?'Click an artwork pixel to sample its color.':design?'Drag to position · pull a corner to resize · Alt for free placement':'Set your pin dimensions in the Sheet tab.'}</p>
          </section>
          <section className="preview-panel" aria-label="Sheet preview">
            <div className="panel-heading"><h2>Sheet preview</h2><Icon name="stack" size={18}/></div>
            <div className="preview-paper-label"><span>{plan?`${plan.width} × ${plan.height} mm`:'No layout'}</span><span>Print at 100%</span></div>
            <div className="paper-stage">{spec?<SheetPreview spec={spec} page={page} images={images}/>:<p>Correct the settings to preview sheets.</p>}</div>
            <div className="page-nav"><button className="icon-button" aria-label="Previous sheet" disabled={!plan||page===0} onClick={()=>setPage(previous=>previous-1)}><Icon name="left" size={17}/></button><span>{plan?.sheets.length?`Sheet ${page+1} of ${plan.sheets.length}`:'No copies yet'}</span><button className="icon-button" aria-label="Next sheet" disabled={!plan||page>=plan.sheets.length-1} onClick={()=>setPage(previous=>previous+1)}><Icon name="right" size={17}/></button></div>
            <div className="layout-summary"><div><strong>{plan?.capacity??0}</strong><span>capacity per sheet</span></div><p>{plan?.arrangement??'—'}<br/><span>{plan?.sheets.length??0} sheets · {plan?.perSheet??0} copy limit</span></p></div>
          </section>
        </div>
        <div className="workspace-summary"><span><strong>{circles.inner} mm</strong> face</span><span><strong>{circles.outer} mm</strong> cut</span><span className="wrap-note">{Number.isFinite(circles.outer-circles.inner)?((circles.outer-circles.inner)/2).toLocaleString(undefined,{maximumFractionDigits:2}):'—'} mm wrap on each side</span></div>
      </section>
      <aside className="inspector-shell" aria-label="Artwork and sheet settings">
        <InspectorTabs.Root value={inspectorTab} onChange={setInspectorTab}>
          <InspectorTabs.List><InspectorTabs.Tab value="artwork">Artwork</InspectorTabs.Tab><InspectorTabs.Tab value="sheet">Sheet</InspectorTabs.Tab></InspectorTabs.List>
          <InspectorTabs.Panel value="artwork">{design&&asset?<ArtworkControls design={design} asset={asset} onChange={updateDesign} onFit={fit} onRelink={()=>void relink()} picking={picking} onTogglePick={()=>setPicking(previous=>!previous)} sourceReady={!!images[design.assetId]} ioBusy={ioBusy}/>:<div className="inspector-empty"><Icon name="image" size={28}/><h2>Make it your own.</h2><p>Import artwork to adjust its size, position, background, and copy count.</p><button onClick={()=>setInspectorTab('sheet')}>Set up your sheet<Icon name="right" size={16}/></button><div className="empty-pin-summary"><span>Current pin size</span><strong>{circles.inner} / {circles.outer} mm</strong><small>Face / cut diameter</small></div></div>}</InspectorTabs.Panel>
          <InspectorTabs.Panel value="sheet"><Settings key={project.id} settings={project.settings} onChange={updateSettings} presets={presets} onSavePreset={savePreset}/></InspectorTabs.Panel>
        </InspectorTabs.Root>
      </aside>
    </main>
    <footer className="app-footer"><span title={location}><Icon name="shield" size={14}/>{location||'Artwork stays on this computer.'}</span><span>Dimensions in millimetres · print at 100%</span></footer>
    {exporting?<div className="export-progress"><div role="status"><strong>Exporting your sheets</strong><p>{progress}</p></div><button disabled={!job.current} onClick={()=>void cancelExport()}>Cancel export</button></div>:null}
    {exportOpen?<Dialog title="Export sheets" onClose={()=>{if(!exporting)setExportOpen(false)}}><p>{total.toLocaleString()} copies across {plan?.sheets.length??0} sheets. A new output folder keeps previous exports intact.</p>{invalid||error?<p role="alert" className="field-error">{invalid||error}</p>:null}<ExportOptions value={project.settings.output} onChange={setOutput} cmyk={cmyk} onProfile={()=>void operation(async()=>{const profile=await window.desktop.importProfile();if(profile)setOutput({...project.settings.output,profile})})}/><div className="actions dialog-actions"><button onClick={()=>setExportOpen(false)} disabled={exporting}>Back to workspace</button><button className="primary" disabled={exporting||ioBusy||!!invalid||(project.settings.output.format==='pdf'&&project.settings.output.color==='cmyk'&&!cmyk)} onClick={()=>void startExport()}>Choose folder & export</button></div></Dialog>:null}
    {confirm?<Confirm title={confirm.title} message={confirm.message} confirmLabel={confirm.confirmLabel} onAnswer={value=>{confirm.resolve(value);setConfirm(null)}}/>:null}
  </div>
}



