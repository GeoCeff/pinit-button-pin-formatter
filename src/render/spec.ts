import { LIMITS, mmToPixels, type Project } from '../core/model'
import { type SheetPlan } from '../core/layout'
export interface RenderSpec { project: Project; plan: SheetPlan }
export const buildRenderSpec = (project: Project, plan: SheetPlan): RenderSpec => ({ project, plan })
export function checkExportSize({ project, plan }: RenderSpec): void {
  if (!plan.sheets.length) throw new Error('Add artwork and at least one copy before exporting.')
  const dpi = project.settings.output.dpi
  if (mmToPixels(plan.width,dpi)<1||mmToPixels(plan.height,dpi)<1||mmToPixels(project.settings.circles.outer,dpi)<1) throw new Error('DPI is too low for this paper or cut diameter. Increase the resolution until each dimension has at least one pixel.')
  const pixels = mmToPixels(plan.width, dpi) * mmToPixels(plan.height, dpi)
  const tilePixels = mmToPixels(project.settings.circles.outer, dpi) ** 2
  if (tilePixels * 4 > LIMITS.rasterBytes) throw new Error('Output exceeds the 256 MB raster budget. Reduce paper size or DPI.')
  if (project.settings.output.format === 'pdf' && tilePixels * 4 * project.designs.filter(d => d.quantity > 0).length > LIMITS.rasterBytes) throw new Error('PDF artwork exceeds the 256 MB tile budget. Reduce DPI or split designs into jobs.')
  if (project.settings.output.format !== 'pdf' && (pixels + tilePixels * project.designs.filter(d=>d.quantity>0).length) * 4 > LIMITS.rasterBytes) throw new Error('Sheets and artwork exceed the 256 MB raster budget. Reduce DPI or split designs into jobs.')
}
