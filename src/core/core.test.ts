import { describe, expect, it } from 'vitest'
import { defaultSettings, effectivePpi, fitImage, mmToPixels, mmToPt, newProject, type Project } from './model'
import { buildSheetPlan } from './layout'
import { parseProject, validateProject } from './validation'
import { checkExportSize } from '../render/spec'

function order(): Project {
  const p=newProject();p.assets=[{id:'a',kind:'png',path:'assets/a.png',width:1200,height:800}]
  p.designs=['a','b'].map((id,i)=>({id,name:id,assetId:'a',quantity:i?7:20,fit:'safe',transform:fitImage(p.assets[0],p.settings.circles,'safe'),fill:'#ffffff'}))
  return p
}
function planned(p: Project){const r=buildSheetPlan(p);if(!r.ok)throw new Error(r.error);return r.plan}
describe('physical geometry and fit',()=>{
  it('keeps print units exact and image corners inside the selected circle',()=>{
    expect(mmToPt(25.4)).toBe(72);expect(mmToPixels(25.4,300)).toBe(300)
    const p=order();const a=p.assets[0];const t=fitImage(a,p.settings.circles,'safe')
    expect(Math.hypot(a.width,a.height)*t.mmPerPixel).toBeCloseTo(40,12)
    expect(Math.min(a.width,a.height)*fitImage(a,p.settings.circles,'fill').mmPerPixel).toBe(44)
    expect(effectivePpi({...t,mmPerPixel:25.4/200})).toBe(200)
  })
  it('finds 18 default circles and never changes diameters to fit',()=>{const p=order();const before=structuredClone(p.settings.circles);expect(planned(p).capacity).toBe(18);expect(p.settings.circles).toEqual(before)})
  it.each(['inner','safe'] as const)('keeps printed %s guides inside the paper without reserving space for contained guides',guide=>{
    const p=order();p.settings.circles={inner:52.5,outer:52.5,safeInset:0};p.settings.paper.orientation='portrait';p.settings.layout={...p.settings.layout,arrangement:'grid',gap:0}
    expect(planned(p).capacity).toBe(20)
    p.settings.output.guides[guide]=true
    const plan=planned(p);const radius=52.5/2+0.06
    expect(plan.capacity).toBe(15)
    for(const center of plan.centers){expect(center.x-radius).toBeGreaterThanOrEqual(-1e-7);expect(center.x+radius).toBeLessThanOrEqual(plan.width+1e-7);expect(center.y-radius).toBeGreaterThanOrEqual(-1e-7);expect(center.y+radius).toBeLessThanOrEqual(plan.height+1e-7)}
    p.settings.circles.inner=50;expect(planned(p).capacity).toBe(20)
  })
  it('keeps circles within asymmetric margins and apart across arrangements and orientations',()=>{
    for(const arrangement of ['grid','staggered','auto'] as const)for(const orientation of ['portrait','landscape','auto'] as const)for(const outer of [25,32,53,67]) {
      const p=order();p.settings.circles={inner:outer-4,outer,safeInset:1};p.settings.paper.orientation=orientation;p.settings.paper.margins={top:3,right:11,bottom:7,left:5};p.settings.layout={...p.settings.layout,arrangement,gap:2};p.settings.output.guides.outer=true
      const plan=planned(p);const radius=outer/2+0.06
      for(const center of plan.centers){expect(center.x-radius).toBeGreaterThanOrEqual(5-1e-7);expect(center.x+radius).toBeLessThanOrEqual(plan.width-11+1e-7);expect(center.y-radius).toBeGreaterThanOrEqual(3-1e-7);expect(center.y+radius).toBeLessThanOrEqual(plan.height-7+1e-7)}
      for(let a=0;a<plan.centers.length;a++)for(let b=a+1;b<plan.centers.length;b++)expect(Math.hypot(plan.centers[a].x-plan.centers[b].x,plan.centers[a].y-plan.centers[b].y)).toBeGreaterThanOrEqual(outer+2-1e-7)
      expect(planned(p)).toEqual(plan)
    }
  })
  it('honors totals, mixing modes and caps without filling unused slots',()=>{
    const p=order();expect(planned(p).sheets.map(s=>s.slots.length)).toEqual([18,9])
    p.settings.layout.mixing='separate';expect(planned(p).sheets.map(s=>s.slots.length)).toEqual([18,2,7])
    p.settings.layout.mixing='mixed';p.settings.layout.perSheet=10;const plan=planned(p);expect(plan.sheets.map(s=>s.slots.length)).toEqual([10,10,7]);const ids=plan.sheets.flatMap(s=>s.slots.map(s=>s.designId));expect(ids.filter(id=>id==='a')).toHaveLength(20);expect(ids.filter(id=>id==='b')).toHaveLength(7)
    p.designs.forEach(d=>d.quantity=0);expect(planned(p).sheets).toEqual([])
  })
  it('returns errors for zero capacity, tiny-circle overload and excessive page counts',()=>{
    const p=order();p.settings.circles.outer=500;expect(buildSheetPlan(p).ok).toBe(false)
    p.settings.circles={inner:0.1,outer:0.1,safeInset:0};expect(buildSheetPlan(p).ok).toBe(false)
    p.settings=defaultSettings();p.settings.layout.perSheet=1;p.designs[0].quantity=2000;expect(buildSheetPlan(p).ok).toBe(false)
  })
})
describe('untrusted project validation',()=>{
  it.each([null,{}, {version:9}, {version:1,settings:null}])('rejects malformed manifests without crashing (%j)',value=>{expect(validateProject(value).length).toBeGreaterThan(0);expect(()=>parseProject(value)).toThrow()})
  it('rejects path traversal, duplicate IDs, non-finite transforms and unsafe quantities',()=>{
    for(const mutate of [(p:Project)=>{p.assets[0].path='../secret.png'},(p:Project)=>{p.designs[1].id=p.designs[0].id},(p:Project)=>{p.designs[0].transform.x=NaN},(p:Project)=>{p.designs[0].quantity=1.5},(p:Project)=>{p.settings.circles.safeInset=22},(p:Project)=>{p.settings.circles.inner=54}]){const p=order();mutate(p);expect(()=>parseProject(p)).toThrow()}
  })
  it('budgets PDF artwork without counting a full-page raster and still bounds raster exports',()=>{
    const p=order();p.designs=p.designs.slice(0,1);p.settings.output.dpi=1200
    expect(()=>checkExportSize({project:p,plan:planned(p)})).not.toThrow()
    for(const format of ['png','jpg'] as const){p.settings.output.format=format;expect(()=>checkExportSize({project:p,plan:planned(p)})).toThrow(/raster budget/)}
    p.settings.output.format='pdf';p.settings.output.dpi=2400
    p.designs=Array.from({length:3},(_,i)=>({...p.designs[0],id:`design-${i}`}))
    expect(()=>checkExportSize({project:p,plan:planned(p)})).toThrow(/tile budget/)
    p.designs=p.designs.slice(0,1);p.settings.circles.outer=100
    expect(()=>checkExportSize({project:p,plan:planned(p)})).toThrow(/raster budget/)
  })
  it('rejects fractional density and output smaller than a pixel',()=>{const p=order();p.settings.output.dpi=150.5;expect(()=>parseProject(p)).toThrow(/whole-number DPI/);p.settings.output.dpi=1;p.settings.circles={inner:0.1,outer:0.1,safeInset:0};p.settings.paper.width=p.settings.paper.height=1;expect(()=>checkExportSize({project:p,plan:planned(p)})).toThrow(/DPI is too low/)})
})
