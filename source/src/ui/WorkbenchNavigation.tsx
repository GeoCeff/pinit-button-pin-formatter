import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)
export interface WorkbenchItem { id:string; label:string; icon:ReactNode; kind:'view'|'action'; disabled?:boolean }
export function WorkbenchNavigation({items,active,onSelect}:{items:WorkbenchItem[];active:string;onSelect:(id:string)=>void}) {
  const root=useRef<HTMLElement>(null)
  const indicator=useRef<HTMLSpanElement>(null)
  useGSAP(()=>{
    const update=()=>{
      const button=root.current?.querySelector<HTMLButtonElement>('[aria-pressed=true]')
      if(!button||!indicator.current)return
      const instant=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.input==='keyboard'
      gsap.to(indicator.current,{x:button.offsetLeft,scaleX:button.offsetWidth,duration:instant?0:.15,ease:'power3.out',overwrite:true})
    }
    update();const observer=new ResizeObserver(update);observer.observe(root.current!)
    return()=>observer.disconnect()
  },{scope:root,dependencies:[active],revertOnUpdate:true})
  function navigate(event:KeyboardEvent<HTMLElement>){
    const buttons=[...root.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
    const index=buttons.indexOf(document.activeElement as HTMLButtonElement)
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:event.key==='ArrowRight'?(index+1)%buttons.length:event.key==='ArrowLeft'?(index-1+buttons.length)%buttons.length:null
    if(next===null)return
    event.preventDefault();buttons[next]?.focus()
  }
  return <nav ref={root} className="workbench-nav" aria-label="Studio tools" onKeyDown={navigate}>
    {items.map(item=><button key={item.id} className="workbench-tab" aria-label={item.label} aria-pressed={item.kind==='view'?active===item.id:undefined} disabled={item.disabled} onClick={()=>onSelect(item.id)}>{item.icon}<span>{item.label}</span></button>)}
    <span ref={indicator} className="nav-indicator" aria-hidden="true"/>
  </nav>
}
