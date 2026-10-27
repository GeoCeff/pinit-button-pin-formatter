import { LIMITS, type Project } from './model'

const id = /^[a-zA-Z0-9-]{1,80}$/
const validId = (x: unknown): x is string => typeof x === 'string' && id.test(x)
const object = (x: unknown): x is Record<string, any> => !!x && typeof x === 'object' && !Array.isArray(x)
const number = (x: unknown, min: number, max = 2000): x is number => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max
const integer = (x: unknown, min: number, max: number) => number(x, min, max) && Number.isSafeInteger(x)
const text = (x: unknown, max = 200): x is string => typeof x === 'string' && x.length <= max
const oneOf = (x: unknown, options: unknown[]) => options.includes(x)

export function validateProject(value: unknown): string[] {
  if (!object(value)) return ['Project must be an object.']
  if (value.version !== 1) return ['Unsupported project version. This app opens version 1 projects.']
  const p = value
  const issues: string[] = []
  if (!validId(p.id) || !text(p.name) || !integer(p.revision, 0, Number.MAX_SAFE_INTEGER)) issues.push('Invalid project identity or revision.')
  if (!object(p.settings)) return [...issues, 'Project settings are missing.']
  const { circles: c, paper: paper, layout: l, output: e } = p.settings
  if (!object(c) || !number(c.inner, 0.1) || !number(c.outer, 0.1) || c.outer < c.inner || !number(c.safeInset, 0) || c.safeInset >= c.inner / 2) issues.push('Circles: enter positive diameters, cut ≥ face, and a safe inset smaller than the face radius.')
  if (!object(paper) || !number(paper.width, 1) || !number(paper.height, 1) || !oneOf(paper.orientation, ['auto', 'portrait', 'landscape']) || !text(paper.description) || !object(paper.margins) || !['top','right','bottom','left'].every(k => number(paper.margins[k], 0))) issues.push('Paper: enter finite dimensions from 1–2000 mm and nonnegative margins.')
  if (!object(l) || !oneOf(l.arrangement, ['auto','grid','staggered']) || !number(l.gap, 0) || !oneOf(l.mixing, ['mixed','separate']) || !(l.perSheet === null || integer(l.perSheet, 1, LIMITS.slots))) issues.push('Layout: use a nonnegative gap and a whole-number sheet limit from 1–10,000.')
  if (!object(e) || !oneOf(e.format, ['pdf','png','jpg']) || !oneOf(e.color, ['rgb','cmyk']) || !integer(e.dpi, 1, 2400) || !number(e.quality, 1, 100) || !object(e.guides) || !['inner','outer','safe'].every(k => typeof e.guides[k] === 'boolean') || !(e.profile === null || (typeof e.profile === 'string' && id.test(e.profile))) || !oneOf(e.intent, [0,1,2,3])) issues.push('Export: check format, color, profile, whole-number DPI (1–2400), quality (1–100) and guides.')
  if (!Array.isArray(p.assets) || p.assets.length > LIMITS.assets || !Array.isArray(p.designs) || p.designs.length > LIMITS.designs) return [...issues, 'A project supports at most 500 assets and 500 designs.']
  const assets = new Set<string>()
  for (const a of p.assets) {
    if (!object(a) || !validId(a.id) || !oneOf(a.kind, ['png','jpg']) || a.path !== `assets/${a.id}.${a.kind}` || !integer(a.width, 1, LIMITS.pixels) || !integer(a.height, 1, LIMITS.pixels) || a.width * a.height > LIMITS.pixels || assets.has(a.id)) issues.push('Invalid or duplicate image asset. Source paths must stay in assets/.')
    else assets.add(a.id)
  }
  const designs = new Set<string>()
  let total = 0
  for (const d of p.designs) {
    if (!object(d) || !validId(d.id) || designs.has(d.id) || !assets.has(d.assetId) || !text(d.name) || !integer(d.quantity, 0, LIMITS.copies) || !oneOf(d.fit, ['safe','contain','fill','manual']) || typeof d.fill !== 'string' || !/^#[\da-f]{6}$/i.test(d.fill) || !object(d.transform) || !number(d.transform.mmPerPixel, 0.000001, 2000) || !number(d.transform.x, -10000, 10000) || !number(d.transform.y, -10000, 10000) || !number(d.transform.rotation, -36000, 36000)) issues.push('Invalid design: check image, quantity, fill and finite transform values.')
    else { designs.add(d.id); total += d.quantity }
  }
  if (total > LIMITS.copies) issues.push('A project supports at most 100,000 copies. Split this order into jobs.')
  return [...new Set(issues)]
}

export function parseProject(value: unknown): Project {
  const issues = validateProject(value)
  if (issues.length) throw new Error(issues.join('\n'))
  if (JSON.stringify(value).length > LIMITS.projectBytes / 3) throw new Error('Project manifest is too large. Remove extra data or split this project.')
  return value as Project
}
