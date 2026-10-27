import { newProject, type Design, type Project, type Settings } from '../core/model'
import type { Imported } from '../bridge'
import { fitImage } from '../core/model'
export type Action = { type:'replace'; project:Project } | { type:'name'; name:string } | { type:'settings'; settings:Settings } | { type:'design'; id:string; patch:Partial<Design> } | { type:'import'; images:Imported[] } | { type:'remove'; id:string } | { type:'relink'; id:string; image:Imported }
export function projectReducer(state: Project, action: Action): Project {
  if(action.type==='replace')return action.project
  let next=state
  switch(action.type) {
    case 'name':next={...state,name:action.name};break
    case 'settings':next={...state,settings:action.settings};break
    case 'design':next={...state,designs:state.designs.map(d=>d.id===action.id?{...d,...action.patch}:d)};break
    case 'import':next={...state,assets:[...state.assets,...action.images.map(i=>i.asset)],designs:[...state.designs,...action.images.map(i=>({id:crypto.randomUUID(),name:i.name,assetId:i.asset.id,quantity:1,fit:'safe' as const,transform:fitImage(i.asset,state.settings.circles,'safe'),fill:i.suggestedFill}))]};break
    case 'remove': { const designs=state.designs.filter(d=>d.id!==action.id);next={...state,designs,assets:state.assets.filter(a=>designs.some(d=>d.assetId===a.id))};break }
    case 'relink': { const design=state.designs.find(d=>d.id===action.id)!;const designs=state.designs.map(d=>d.assetId===design.assetId?{...d,assetId:action.image.asset.id}:d);next={...state,designs,assets:[...state.assets.filter(a=>a.id!==design.assetId),action.image.asset]};break }
  }
  return {...next,revision:state.revision+1}
}
export { newProject }
