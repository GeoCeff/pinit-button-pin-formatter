import { useEffect, useId, useRef, type ReactNode } from 'react'
export function useModal() {
  const ref=useRef<HTMLDialogElement>(null)
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    const node=ref.current!
    node.showModal()
    return()=>{
      node.close()
      queueMicrotask(()=>{
        const target=previous?.isConnected&&previous.checkVisibility()?previous:document.querySelector<HTMLElement>('.design-select[aria-pressed="true"]')??document.querySelector<HTMLElement>('.import-button')
        target?.focus({preventScroll:true})
      })
    }
  },[])
  return ref
}
export function NumberField({label,value,onChange,unit,step=1,min,max,disabled=false,error,integer=false}:{label:string;value:number;onChange:(v:number)=>void;unit?:string;step?:number;min?:number;max?:number;disabled?:boolean;error?:string;integer?:boolean}) {
  const errorId=useId()
  const unitId=useId()
  const issue=error??(!Number.isFinite(value)?'Enter a number.':min!==undefined&&value<min?`Enter at least ${Number(min.toFixed(5))}${unit?` ${unit}`:''}.`:max!==undefined&&value>max?`Enter at most ${Number(max.toFixed(5))}${unit?` ${unit}`:''}.`:integer&&!Number.isSafeInteger(value)?'Enter a whole number.':'')
  return <label className="field"><span>{label}</span><span className="input-unit"><input name={label.toLowerCase().replaceAll(' ','-')} autoComplete="off" inputMode={integer?'numeric':'decimal'} aria-label={label} aria-invalid={!!issue} aria-describedby={[unit?unitId:null,issue?errorId:null].filter(Boolean).join(' ')||undefined} type="number" value={Number.isFinite(value)?Number(value.toFixed(5)):''} onChange={e=>onChange(e.target.value===''?NaN:Number(e.target.value))} step={step} min={min} max={max} disabled={disabled}/>{unit?<small id={unitId}>{unit}</small>:null}</span>{issue?<small id={errorId} className="field-error">{issue}</small>:null}</label>
}
export function SelectField({label,value,onChange,children}:{label:string;value:string;onChange:(v:string)=>void;children:ReactNode}) {return <label className="field"><span>{label}</span><select name={label.toLowerCase().replaceAll(' ','-')} autoComplete="off" aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>{children}</select></label>}
export function Check({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}) {return <label className="check"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/>{label}</label>}
export function Confirm({title='Unsaved project',message,confirmLabel='Discard and continue',onAnswer}:{title?:string;message:string;confirmLabel?:string;onAnswer:(answer:boolean)=>void}) {const ref=useModal();const id=useId();return <dialog ref={ref} role="alertdialog" aria-labelledby={id} aria-describedby={id+'-description'} className="dialog" onCancel={event=>{event.preventDefault();onAnswer(false)}}><h2 id={id}>{title}</h2><p id={id+'-description'}>{message}</p><div className="actions dialog-actions"><button onClick={()=>onAnswer(false)}>Keep editing</button><button className="danger" onClick={()=>onAnswer(true)}>{confirmLabel}</button></div></dialog>}
export function CloseConfirmation({name,dirty,exporting,busy,fileBusy,saveBlocked,error,onKeepEditing,onDiscard,onSave}:{name:string;dirty:boolean;exporting:boolean;busy:boolean;fileBusy:boolean;saveBlocked:string;error:string;onKeepEditing:()=>void;onDiscard:()=>void;onSave:()=>void}) {
  const ref=useModal();const id=useId()
  return <dialog ref={ref} role="alertdialog" aria-labelledby={id} aria-describedby={id+'-description'} aria-busy={busy} className="dialog close-dialog" onCancel={event=>{event.preventDefault();if(!busy)onKeepEditing()}}>
    <h2 id={id}>{dirty?'Save before closing?':exporting?'An export is still running.':'Close dfCuts?'}</h2>
    <p id={id+'-description'}>{dirty?<>Your changes to <strong>{name.trim()||'Untitled project'}</strong> haven’t been saved.</>:exporting?'Closing dfCuts will cancel the export.':'Your project is saved. You can close dfCuts.'}</p>
    {exporting?<p className="close-export-note">Any export still running will be canceled. Completed files are kept.</p>:null}
    {fileBusy?<p className="close-hint" role="status">Wait for the current file operation to finish before saving or closing.</p>:dirty&&saveBlocked?<p className="close-hint">Keep editing to fix the project settings before saving. {saveBlocked}</p>:null}
    {error?<p className="field-error close-error" role="alert">{error}</p>:null}
    <div className="actions dialog-actions close-actions">
      <button autoFocus disabled={busy} onClick={onKeepEditing}>Keep editing</button>
      <button className="close-discard" disabled={busy||fileBusy} onClick={onDiscard}>{dirty?'Discard and close':exporting?'Cancel export and close':'Close dfCuts'}</button>
      {dirty?<button className="primary" disabled={busy||fileBusy||!!saveBlocked} onClick={onSave}>{busy?'Closing…':'Save and close'}</button>:null}
    </div>
  </dialog>
}
export function Dialog({title,children,onClose,className=''}:{title:string;children:ReactNode;onClose:()=>void;className?:string}) {const ref=useModal();const id=useId();return <dialog ref={ref} className={`dialog ${className}`} aria-labelledby={id} onCancel={event=>{event.preventDefault();onClose()}}><div className="section-title"><h2 id={id}>{title}</h2><button onClick={onClose} aria-label="Close dialog">Close</button></div>{children}</dialog>}
