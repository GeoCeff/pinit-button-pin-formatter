import { useCallback, useDeferredValue, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { defaultSettings, fitImage, newProject, type Design, type Preset, type Project } from '../core/model'
import { buildSheetPlan } from '../core/layout'
import { validateProject } from '../core/validation'
import { buildRenderSpec, checkExportSize, type RenderSpec } from '../render/spec'
import { projectReducer } from '../state/project'
import { Check, Confirm, Dialog, NumberField } from './controls'
import { Icon } from './Icon'
import MacFloatingDock, { type DockItem } from '@/components/ui/mac-style-floating-dock'
import { QuickStart } from './QuickStart'
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
  const [workspaceView,setWorkspaceView]=useState('artwork')
  const [adjustmentsOpen,setAdjustmentsOpen]=useState(false)
  const [guides,setGuides]=useState({inner:true,outer:true,safe:false})
  const [tutorialOpen,setTutorialOpen]=useState(()=>{try{return localStorage.getItem('pinit.quick-start.v1')!=='seen'}catch{return true}})
  const [noticePaused,setNoticePaused]=useState(false)
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
  const saveState=ioBusy?'working':dirty?'unsaved':location?'saved':'local'
  const saveLabel=ioBusy?'Working…':dirty?'Unsaved changes':location?'Saved locally':'Local project'
  const total=project.designs.reduce((n,d)=>n+(Number.isFinite(d.quantity)?d.quantity:0),0)
  const currentDesignId=design?.id
  const updateDesign=useCallback((patch:Partial<Design>)=>{if(currentDesignId)dispatch({type:'design',id:currentDesignId,patch})},[currentDesignId])
  const updateSettings=useCallback((settings:Project['settings'])=>dispatch({type:'settings',settings}),[])
  const pickColor=useCallback((fill:string)=>{updateDesign({fill});setPicking(false)},[updateDesign])
  const selectDesign=useCallback((id:string)=>{setSelectedId(id);setWorkspaceView('artwork')},[])
  useEffect(()=>window.desktop.setDirty(dirty),[dirty])
  useEffect(()=>{if(!notice||noticePaused||notice.startsWith('Export saved:'))return;const timer=setTimeout(()=>setNotice(''),6000);return()=>clearTimeout(timer)},[notice,noticePaused])
  useEffect(()=>{window.desktop.presets().then(p=>setPresets([initialPreset,...p])).catch(e=>setError(e.message));window.desktop.runtimeStatus().then(s=>setCmyk(s.cmyk)).catch(e=>setError(e.message));return window.desktop.onProgress(setProgress)},[])
  useEffect(()=>{setPage(0)},[plan?.sheets.length])
  useEffect(()=>{setPicking(false)},[design?.id])

  const operation=useCallback(async(fn:()=>Promise<void>)=>{setError('');setNotice('');setIoBusy(true);try{await fn()}catch(e){setError((e as Error).message)}finally{setIoBusy(false)}},[])
  async function canDiscard(){return !dirty||await new Promise<boolean>(resolve=>setConfirm({message:'Save your project first to keep the latest artwork and settings.',resolve}))}
  async function importArtwork(){await operation(async()=>{if(valid.length)throw new Error('Correct the project settings before importing artwork.');const added=await window.desktop.importImages();if(!added.length)return;dispatch({type:'import',images:added});setSources(previous=>({...previous,...Object.fromEntries(added.map(i=>[i.asset.id,i.source]))}));setSelectedId('');setWorkspaceView('artwork');setNotice(`Imported ${added.length} ${added.length===1?'design':'designs'}.`)})}
  async function openProject(){if(!await canDiscard())return;await operation(async()=>{const opened=await window.desktop.openProject();if(!opened)return;dispatch({type:'replace',project:opened.project});setSavedRevision(opened.project.revision);setSources(Object.fromEntries(opened.images.map(i=>[i.asset.id,i.source])));setLocation(opened.location);setSelectedId('');setWorkspaceView('artwork');if(opened.profileMissing)setError('The saved CMYK profile is missing. Import it again in Export sheets or select the bundled generic profile.');if(opened.missing.length)setError(`${opened.missing.length} source image(s) are missing or changed. Select each design and relink artwork. Its edits are preserved.`)})}
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
    await operation(async()=>{await window.desktop.resetSession();dispatch({type:'replace',project:newProject()});setSavedRevision(0);setSources({});setLocation('');setSelectedId('');setWorkspaceView('artwork')})
  }
  const invalid=valid[0]??(!result.ok?result.error:'')
  const circles=spec?.project.settings.circles??project.settings.circles
  const setOutput=(output:Project['settings']['output'])=>updateSettings({...project.settings,output})
  function closeTutorial(){try{localStorage.setItem('pinit.quick-start.v1','seen')}catch{}setTutorialOpen(false)}
  const artworkLibrary=<ArtworkLibrary designs={project.designs} selectedId={design?.id} sources={sources} variant={workspaceView==='library'?'gallery':'tray'} disabled={ioBusy||exporting} onImport={()=>void importArtwork()} onManage={()=>setWorkspaceView('library')} onSelect={selectDesign} onRemove={item=>void removeDesign(item)}/>
  const dockItems:DockItem[]=[
    {id:'artwork',label:'Artwork',kind:'view',icon:<Icon name="image" size={24}/>},
    {id:'sheet',label:'Sheet',kind:'view',icon:<Icon name="stack" size={24}/>},
    {id:'library',label:'Library',kind:'view',icon:<Icon name="folder" size={24}/>},
    {id:'help',label:'Help',kind:'action',icon:<Icon name="help" size={24}/>},
    {id:'export',label:'Export',kind:'action',icon:<Icon name="download" size={24}/>,disabled:ioBusy||exporting||!!invalid||!total}
  ]
  return <div className="app" onPointerDownCapture={()=>{document.documentElement.dataset.input='pointer'}} onKeyDownCapture={()=>{document.documentElement.dataset.input='keyboard'}}>
    <a className="skip-link" href="#artwork-workspace">Skip to artwork workspace</a>
    <header className="topbar">
      <div className="brand" aria-label="PinIt"><span className="brand-symbol" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.7"/><circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 2"/></svg></span><strong>PinIt</strong></div>
      <div className="project-block"><div className="project-name"><input name="project-name" aria-label="Project name" title={project.name} autoComplete="off" spellCheck={false} maxLength={200} value={project.name} onChange={event=>dispatch({type:'name',name:event.target.value})}/><Icon name="edit" className="project-edit-icon" size={14}/></div>
        <div className="actions file-actions">
          <span className="project-save-state" data-state={saveState} role="status" aria-live="polite" aria-atomic="true">{saveState==='saved'?<Icon name="check" size={14}/>:<i aria-hidden="true"/>}{saveLabel}</span>
          <button className="quiet-button" disabled={ioBusy||exporting} onClick={()=>void createProject()}><Icon name="plus" size={16}/>New</button>
          <button className="quiet-button" disabled={ioBusy||exporting} onClick={()=>void openProject()}><Icon name="folder" size={16}/>Open</button>
          <button disabled={ioBusy||!!invalid} onClick={()=>void saveProject()}><Icon name="save" size={16}/>Save</button>
          <button className="quiet-button" aria-label="Save project as a copy" disabled={ioBusy||!!invalid} onClick={()=>void saveProject(true)}>Save as</button>
        </div>
      </div>
      <button className="export-block" disabled={ioBusy||exporting||!!invalid||!total} onClick={()=>setExportOpen(true)}><span>Export sheets</span><Icon name="download" size={24}/></button>
    </header>
    <div className="status-area">
      {error?<div className="message error" role="alert"><span>{error}</span><button className="text-button" onClick={()=>setError('')} aria-label="Dismiss error">Dismiss</button></div>:null}
      {notice?<div className="message notice" role="status" onMouseEnter={()=>setNoticePaused(true)} onMouseLeave={()=>setNoticePaused(false)} onFocusCapture={()=>setNoticePaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setNoticePaused(false)}}><Icon name="check" size={16}/><span>{notice}</span><button className="icon-button" onClick={()=>{setNotice('');setNoticePaused(false)}} aria-label="Dismiss notification"><Icon name="close" size={15}/></button></div>:null}
      {invalid?<div className="message error" role="alert"><span>{invalid} Last valid preview is retained.</span><button className="text-button" onClick={()=>setWorkspaceView('sheet')}>Review settings</button></div>:null}
    </div>
    <aside className="dock-bay" aria-label="Project artwork"><div className="tray-slot">{workspaceView==='artwork'?<div className="artwork-shelf">{artworkLibrary}</div>:<div className="tray-summary"><span className="summary-symbol"><Icon name="stack" size={24}/></span><span className="eyebrow">This project</span><strong>{project.designs.length} {project.designs.length===1?'design':'designs'}</strong><span>{total.toLocaleString()} {total===1?'copy':'copies'} to print</span><div className="summary-dimensions"><span>{circles.inner} mm face</span><span>{circles.outer} mm cut</span></div><button className="text-button" onClick={()=>setWorkspaceView('artwork')}><Icon name="left" size={16}/>Back to artwork</button></div>}</div></aside>
    <main className="workspace" id="artwork-workspace" tabIndex={-1} data-view={workspaceView}>
      <div className="studio-zone">
        <div className="workspace-tools"><div className="workspace-title"><Icon name="studio" size={18}/><span>Workspace</span></div><MacFloatingDock items={dockItems} active={workspaceView} onSelect={id=>{if(id==='export')setExportOpen(true);else if(id==='help')setTutorialOpen(true);else setWorkspaceView(id)}}/></div>
        <section className="editor-panel" aria-label="Artwork editor" hidden={workspaceView!=='artwork'}>
          <header className="studio-heading"><div className="design-heading">{design&&sources[design.assetId]?<img className="heading-thumbnail" src={sources[design.assetId]} alt=""/>:<Icon name="image" size={22}/>}<div>{design?<h1 title={design.name}>{design.name}</h1>:<h2>Artwork</h2>}<span>{circles.inner} mm face / {circles.outer} mm cut</span></div></div>
            {design?<div className="studio-actions"><div className="fit-modes" role="group" aria-label="Artwork fit"><button aria-label="Fit within safe circle" aria-pressed={design.fit==='safe'} disabled={!!invalid} onClick={()=>fit('safe')}>Safe</button><button aria-label="Fit within face circle" aria-pressed={design.fit==='contain'} disabled={!!invalid} onClick={()=>fit('contain')}>Face</button><button aria-label="Fill face circle" aria-pressed={design.fit==='fill'} disabled={!!invalid} onClick={()=>fit('fill')}>Fill</button></div><div className="quick-copies"><NumberField label="Copies" value={design.quantity} onChange={quantity=>updateDesign({quantity})} min={0} max={100000} integer/></div><button className="adjust-toggle" aria-expanded={adjustmentsOpen} aria-controls="artwork-adjustments" onClick={()=>setAdjustmentsOpen(value=>!value)}><Icon name="sliders" size={16}/>{adjustmentsOpen?'Hide adjustments':'Adjust artwork'}</button></div>:<span className="offline-note"><Icon name="shield" size={16}/>Offline workspace</span>}
          </header>
          <div className="editor-layout" data-adjustments={adjustmentsOpen&&!!design}>
            <aside id="artwork-adjustments" className="adjustment-drawer" hidden={!adjustmentsOpen||!design} aria-label="Artwork adjustments">
              {design&&asset?<ArtworkControls design={design} asset={asset} onChange={updateDesign} onFit={fit} onRelink={()=>void relink()} picking={picking} onTogglePick={()=>setPicking(previous=>!previous)} sourceReady={!!images[design.assetId]} ioBusy={ioBusy}/>:null}
            </aside>
            <div className="stage-surface">
              {design&&asset&&safeDesign&&spec?<><Editor key={design.id+'-'+asset.id} design={valid.length||!result.ok?safeDesign:design} asset={asset} image={images[design.assetId]} circles={spec.project.settings.circles} onChange={updateDesign} guideVisibility={guides} picking={picking} onPick={pickColor}/>{!sources[design.assetId]?<div className="missing-message">Source missing. <button className="text-button" onClick={()=>void relink()}>Relink artwork</button></div>:!images[design.assetId]?<p className="artwork-loading" role="status">Loading artwork…</p>:null}</>:<div className="empty-editor">
                <div className="empty-copy"><div className="empty-pin" aria-hidden="true"><div className="empty-cut"><div className="empty-face" style={{width:(circles.inner/circles.outer*100)+'%'}}/><Icon name="image" size={28}/></div></div><h1 className="max-w-5xl">Add your artwork.</h1><p>Bring a PNG or JPG. Position it once,<br/>then let PinIt prepare the sheet.</p><button className="primary" disabled={ioBusy} onClick={()=>void importArtwork()}><Icon name="upload" size={18}/>Import first design</button><button className="text-button empty-help" onClick={()=>setTutorialOpen(true)}>Show me how it works<Icon name="right" size={15}/></button></div>
              </div>}
            </div>
          </div>
          <footer className="editor-footer"><div className="guide-legend"><span>Guides</span><Check label="Cut" checked={guides.outer} onChange={value=>setGuides({...guides,outer:value})}/><Check label="Face" checked={guides.inner} onChange={value=>setGuides({...guides,inner:value})}/><Check label="Safe" checked={guides.safe} onChange={value=>setGuides({...guides,safe:value})}/></div>{picking?<p role="status">Click artwork to pick a color.</p>:null}</footer>
        </section>
        <section className="sheet-workspace" aria-label="Sheet setup" hidden={workspaceView!=='sheet'}><header className="mode-heading"><div><h1>Sheet setup</h1><p>Dimensions, paper and arrangement.</p></div><Icon name="stack" size={26}/></header><Settings key={project.id} settings={project.settings} onChange={updateSettings} presets={presets} onSavePreset={savePreset}/></section>
        {workspaceView==='library'?<><header className="library-mode-heading"><div><h1>Your artwork</h1><p>Select a design to edit its position and copies.</p></div><span className="item-count">{project.designs.length}</span></header><div className="artwork-shelf" data-expanded="true">{artworkLibrary}</div></>:null}
      </div>
      <section className="preview-panel" aria-label="Sheet preview">
        <header className="preview-heading"><h2>Sheet preview</h2><button className="text-button preview-setup" aria-label="Edit sheet settings" onClick={()=>setWorkspaceView('sheet')}><Icon name="sliders" size={15}/>Setup</button></header>
        <div className="preview-paper-label"><span>{plan?plan.width+' × '+plan.height+' mm':'No layout'}</span><span><Icon name="check" size={13}/>Print at 100%</span></div>
        <div className="paper-stage">{spec?<SheetPreview spec={spec} page={page} images={images}/>:<p>Correct the settings to preview sheets.</p>}</div>
        <div className="page-nav"><button className="icon-button" aria-label="Previous sheet" disabled={!plan||page===0} onClick={()=>setPage(previous=>previous-1)}><Icon name="left" size={18}/></button><span className="sheet-counter" role="status" aria-live="polite" aria-atomic="true" aria-label={plan?.sheets.length?`Sheet ${page+1} of ${plan.sheets.length}`:'No sheets yet'}>{plan?.sheets.length?<><strong>{page+1}</strong><span>/ {plan.sheets.length}</span></>:'No sheets yet'}</span><button className="icon-button" aria-label="Next sheet" disabled={!plan||page>=plan.sheets.length-1} onClick={()=>setPage(previous=>previous+1)}><Icon name="right" size={18}/></button></div>
        <footer className="layout-summary"><div><strong>{total.toLocaleString()}</strong><span>Total copies</span></div><div><strong>{plan?.perSheet??0}</strong><span>Copies / sheet</span></div></footer><div className="packing-detail"><p><span>Layout</span><strong>{plan?.arrangement??'No layout'}</strong></p><p><span title="Margin between the face and cut boundary">Wrap</span><strong>{((circles.outer-circles.inner)/2).toLocaleString(undefined,{maximumFractionDigits:2})} mm</strong></p></div>
      </section>
    </main>
    {tutorialOpen?<QuickStart hasArtwork={!!project.designs.length} onClose={closeTutorial} onImport={()=>void importArtwork()}/>:null}
    {exporting?<div className="export-progress"><div role="status"><strong>Exporting your sheets</strong><p>{progress}</p></div><button disabled={!job.current} onClick={()=>void cancelExport()}>Cancel export</button></div>:null}
    {exportOpen?<Dialog title="Export sheets" onClose={()=>{if(!exporting)setExportOpen(false)}}><p>{total.toLocaleString()} copies across {plan?.sheets.length??0} sheets. A new output folder keeps previous exports intact.</p>{invalid||error?<p role="alert" className="field-error">{invalid||error}</p>:null}<ExportOptions value={project.settings.output} onChange={setOutput} cmyk={cmyk} onProfile={()=>void operation(async()=>{const profile=await window.desktop.importProfile();if(profile)setOutput({...project.settings.output,profile})})}/><div className="actions dialog-actions"><button onClick={()=>setExportOpen(false)} disabled={exporting}>Back to workspace</button><button className="primary" disabled={exporting||ioBusy||!!invalid||(project.settings.output.format==='pdf'&&project.settings.output.color==='cmyk'&&!cmyk)} onClick={()=>void startExport()}>Choose folder & export</button></div></Dialog>:null}
    {confirm?<Confirm title={confirm.title} message={confirm.message} confirmLabel={confirm.confirmLabel} onAnswer={value=>{confirm.resolve(value);setConfirm(null)}}/>:null}
  </div>
}



