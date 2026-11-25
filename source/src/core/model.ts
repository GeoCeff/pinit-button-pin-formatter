export type FitMode = 'safe' | 'contain' | 'fill' | 'bleed' | 'manual'
export type Arrangement = 'auto' | 'grid' | 'staggered'
export interface CircleSettings { inner: number; outer: number; safeInset: number }
export function centerGuide(circles: CircleSettings) {
  const radius = circles.outer / 2
  const foldWidth = (circles.outer - circles.inner) / 2
  const length = Math.min(3, radius * 0.12, Math.max(1, foldWidth * 0.65))
  return { top: -radius, bottom: -radius + length }
}
export interface PaperSettings { width: number; height: number; orientation: 'auto' | 'portrait' | 'landscape'; margins: { top: number; right: number; bottom: number; left: number }; description: string }
export interface LayoutSettings { arrangement: Arrangement; gap: number; mixing: 'mixed' | 'separate'; perSheet: number | null }
export const CENTER_GUIDE_COLORS = {
  black: [0, 0, 0],
  red: [235, 32, 48],
  blue: [36, 104, 255],
} as const
export type CenterGuideColor = keyof typeof CENTER_GUIDE_COLORS
export function centerGuideCssColor(color: CenterGuideColor = 'black'): string {
  return `rgb(${CENTER_GUIDE_COLORS[color].join(', ')})`
}
export interface ExportGuides { inner: boolean; outer: boolean; safe: boolean; center?: boolean; centerColor?: CenterGuideColor; crosshairs?: boolean }
export interface ExportSettings { format: 'pdf' | 'png' | 'jpg' | 'pins'; color: 'cmyk' | 'rgb'; dpi: number; quality: number; guides: ExportGuides; profile: string | null; intent: 0 | 1 | 2 | 3; sheetLabel?: boolean }
export interface Settings { circles: CircleSettings; paper: PaperSettings; layout: LayoutSettings; output: ExportSettings }
export interface Asset { id: string; path: string; kind: 'png' | 'jpg' | 'webp'; width: number; height: number }
export interface ImageTransform { mmPerPixel: number; x: number; y: number; rotation: number; flipX?: boolean; flipY?: boolean }
export interface Design { id: string; name: string; assetId: string; quantity: number; fit: FitMode; transform: ImageTransform; fill: string }
export interface Project { version: 1; id: string; name: string; revision: number; settings: Settings; assets: Asset[]; designs: Design[] }
export interface Preset { name: string; settings: Settings }
export const LIMITS = { assets: 500, designs: 500, copies: 100_000, pages: 1000, slots: 10_000, pixels: 40_000_000, rasterBytes: 256 * 1024 * 1024, fileBytes: 50 * 1024 * 1024, projectBytes: 4 * 1024 * 1024 }
export const defaultSettings = (): Settings => ({
  circles: { inner: 44, outer: 53, safeInset: 2 },
  paper: { width: 210, height: 297, orientation: 'auto', margins: { top: 0, right: 0, bottom: 0, left: 0 }, description: '' },
  layout: { arrangement: 'auto', gap: 2, mixing: 'mixed', perSheet: null },
  output: { format: 'pdf', color: 'cmyk', dpi: 300, quality: 95, guides: { inner: false, outer: false, safe: false, center: false, crosshairs: false }, profile: null, intent: 0, sheetLabel: false }
})
export const STARTER_PRESETS: Preset[] = [
  { name: '44 mm face / 53 mm cut · A4', settings: defaultSettings() },
  {
    name: '44 mm face / 53 mm cut · US Letter',
    settings: (() => { const s = defaultSettings(); s.paper.width = 215.9; s.paper.height = 279.4; return s })()
  },
  {
    name: '25 mm face / 35 mm cut · A4 (verify die)',
    settings: (() => { const s = defaultSettings(); s.circles = { inner: 25, outer: 35, safeInset: 1.5 }; return s })()
  },
  {
    name: '32 mm face / 44 mm cut · A4 (verify die)',
    settings: (() => { const s = defaultSettings(); s.circles = { inner: 32, outer: 44, safeInset: 1.5 }; return s })()
  },
  {
    name: '37 mm face / 48 mm cut · A4 (verify die)',
    settings: (() => { const s = defaultSettings(); s.circles = { inner: 37, outer: 48, safeInset: 2 }; return s })()
  },
  {
    name: '58 mm face / 70 mm cut · A4 (verify die)',
    settings: (() => { const s = defaultSettings(); s.circles = { inner: 58, outer: 70, safeInset: 2.5 }; return s })()
  },
  {
    name: '75 mm face / 86 mm cut · A4 (verify die)',
    settings: (() => { const s = defaultSettings(); s.circles = { inner: 75, outer: 86, safeInset: 3 }; return s })()
  }
]
export function newProject(): Project { return { version: 1, id: crypto.randomUUID(), name: 'Untitled project', revision: 0, settings: defaultSettings(), assets: [], designs: [] } }
export const mmToPt = (mm: number) => mm * 72 / 25.4
export const mmToPixels = (mm: number, dpi: number) => Math.round(mm * dpi / 25.4)
export const effectivePpi = (t: ImageTransform) => 25.4 / t.mmPerPixel
export function fitImage(asset: Asset, circles: CircleSettings, mode: Exclude<FitMode, 'manual'>): ImageTransform {
  const diameter = mode === 'safe' ? circles.inner - 2 * circles.safeInset : mode === 'bleed' ? circles.outer : circles.inner
  const fillCircle = mode === 'fill' || mode === 'bleed'
  return { mmPerPixel: fillCircle ? diameter / Math.min(asset.width, asset.height) : diameter / Math.hypot(asset.width, asset.height), x: 0, y: 0, rotation: 0 }
}
export function sanitizeFileSlug(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/g, '')
  return slug || 'design'
}
export function pinExportFilename(index: number, name: string): string {
  return `pin-${String(index + 1).padStart(4, '0')}-${sanitizeFileSlug(name)}.png`
}
