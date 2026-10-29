import { LIMITS, type Project } from './model'
import { validateProject } from './validation'

export interface Point { x: number; y: number }
export interface Slot extends Point { designId: string }
export interface Sheet { slots: Slot[] }
export interface SheetPlan { width: number; height: number; capacity: number; perSheet: number; arrangement: string; centers: Point[]; sheets: Sheet[] }
export type PlanResult = { ok: true; plan: SheetPlan } | { ok: false; error: string }
const EPS = 1e-8

function centers(w: number, h: number, d: number, gap: number, stagger: boolean, parity: number): Point[] {
  const pitch = d + gap
  const rowPitch = stagger ? Math.sqrt(3) * pitch / 2 : pitch
  const rows = Math.max(0, Math.floor((h - d + EPS) / rowPitch) + 1)
  const cols = Math.max(0, Math.floor((w + gap + EPS) / pitch))
  if (rows * cols > LIMITS.slots) throw new Error('This geometry exceeds 10,000 circles per sheet. Increase the diameter or use smaller paper.')
  const out: Point[] = []
  for (let row = 0; row < rows; row++) {
    const shift = stagger && (row + parity) % 2 ? pitch / 2 : 0
    for (let col = 0; col < cols; col++) {
      const x = d / 2 + shift + col * pitch
      if (x + d / 2 <= w + EPS) out.push({ x, y: d / 2 + row * rowPitch })
    }
  }
  return out
}

export function buildSheetPlan(project: Project): PlanResult {
  const issues = validateProject(project)
  if (issues.length) return { ok: false, error: issues[0] }
  try {
    const { circles, paper, layout, output } = project.settings
    // All printed guides have a 0.12 mm stroke. Reserve any extent beyond the artwork.
    const diameter = Math.max(
      circles.outer,
      output.guides.outer ? circles.outer + 0.12 : 0,
      output.guides.inner ? circles.inner + 0.12 : 0,
      output.guides.safe ? circles.inner - 2 * circles.safeInset + 0.12 : 0
    )
    const portrait = [Math.min(paper.width, paper.height), Math.max(paper.width, paper.height)]
    const dimensions = paper.orientation === 'auto' ? [portrait, [...portrait].reverse()] : [paper.orientation === 'portrait' ? portrait : [...portrait].reverse()]
    let best: { points: Point[]; width: number; height: number; label: string } | undefined
    for (const [width, height] of dimensions) {
      const w = width - paper.margins.left - paper.margins.right
      const h = height - paper.margins.top - paper.margins.bottom
      if (w + EPS < diameter || h + EPS < diameter) continue
      const candidates: { points: Point[]; label: string }[] = []
      if (layout.arrangement !== 'staggered') candidates.push({ points: centers(w, h, diameter, layout.gap, false, 0), label: 'Grid' })
      if (layout.arrangement !== 'grid') for (const parity of [0, 1]) {
        candidates.push({ points: centers(w, h, diameter, layout.gap, true, parity), label: 'Staggered rows' })
        candidates.push({ points: centers(h, w, diameter, layout.gap, true, parity).map(p => ({ x: p.y, y: p.x })), label: 'Staggered columns' })
      }
      for (const candidate of candidates) {
        const pts = candidate.points
        if (!pts.length || (best && best.points.length >= pts.length)) continue
        const minX = Math.min(...pts.map(p => p.x)) - diameter / 2
        const maxX = Math.max(...pts.map(p => p.x)) + diameter / 2
        const minY = Math.min(...pts.map(p => p.y)) - diameter / 2
        const maxY = Math.max(...pts.map(p => p.y)) + diameter / 2
        const dx = paper.margins.left + (w - (maxX - minX)) / 2 - minX
        const dy = paper.margins.top + (h - (maxY - minY)) / 2 - minY
        best = { points: pts.map(p => ({ x: p.x + dx, y: p.y + dy })).sort((a,b) => a.y - b.y || a.x - b.x), width, height, label: candidate.label }
      }
    }
    if (!best?.points.length) return { ok: false, error: 'No circle fits inside the paper margins. Increase the paper or reduce the cut diameter, gap or margins.' }
    const perSheet = Math.min(best.points.length, layout.perSheet ?? best.points.length)
    const count = layout.mixing === 'mixed' ? Math.ceil(project.designs.reduce((n,d) => n + d.quantity, 0) / perSheet) : project.designs.reduce((n,d) => n + Math.ceil(d.quantity / perSheet), 0)
    if (count > LIMITS.pages) return { ok: false, error: 'This job exceeds 1,000 sheets. Split it into smaller projects.' }
    const sheets: Sheet[] = []
    let sheet: Sheet | undefined
    for (const design of project.designs) {
      if (layout.mixing === 'separate') sheet = undefined
      for (let i = 0; i < design.quantity; i++) {
        if (!sheet || sheet.slots.length === perSheet) { sheet = { slots: [] }; sheets.push(sheet) }
        sheet.slots.push({ ...best.points[sheet.slots.length], designId: design.id })
      }
    }
    return { ok: true, plan: { width: best.width, height: best.height, arrangement: best.label, capacity: best.points.length, perSheet, centers: best.points, sheets } }
  } catch (error) { return { ok: false, error: (error as Error).message } }
}
