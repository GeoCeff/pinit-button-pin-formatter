export type FitMode = 'safe' | 'contain' | 'fill' | 'manual'
export type Arrangement = 'auto' | 'grid' | 'staggered'
export interface CircleSettings { inner: number; outer: number; safeInset: number }
export interface PaperSettings { width: number; height: number; orientation: 'auto' | 'portrait' | 'landscape'; margins: { top: number; right: number; bottom: number; left: number }; description: string }
export interface LayoutSettings { arrangement: Arrangement; gap: number; mixing: 'mixed' | 'separate'; perSheet: number | null }
export interface ExportSettings { format: 'pdf' | 'png' | 'jpg'; color: 'cmyk' | 'rgb'; dpi: number; quality: number; guides: { inner: boolean; outer: boolean; safe: boolean }; profile: string | null; intent: 0 | 1 | 2 | 3 }
export interface Settings { circles: CircleSettings; paper: PaperSettings; layout: LayoutSettings; output: ExportSettings }
export interface Asset { id: string; path: string; kind: 'png' | 'jpg'; width: number; height: number }
export interface ImageTransform { mmPerPixel: number; x: number; y: number; rotation: number }
export interface Design { id: string; name: string; assetId: string; quantity: number; fit: FitMode; transform: ImageTransform; fill: string }
export interface Project { version: 1; id: string; name: string; revision: number; settings: Settings; assets: Asset[]; designs: Design[] }
export interface Preset { name: string; settings: Settings }
export const LIMITS = { assets: 500, designs: 500, copies: 100_000, pages: 1000, slots: 10_000, pixels: 40_000_000, rasterBytes: 256 * 1024 * 1024, fileBytes: 50 * 1024 * 1024, projectBytes: 4 * 1024 * 1024 }
export const defaultSettings = (): Settings => ({
  circles: { inner: 44, outer: 53, safeInset: 2 },
  paper: { width: 210, height: 297, orientation: 'auto', margins: { top: 0, right: 0, bottom: 0, left: 0 }, description: '' },
  layout: { arrangement: 'auto', gap: 2, mixing: 'mixed', perSheet: null },
  output: { format: 'pdf', color: 'cmyk', dpi: 300, quality: 95, guides: { inner: false, outer: false, safe: false }, profile: null, intent: 0 }
})
export function newProject(): Project { return { version: 1, id: crypto.randomUUID(), name: 'Untitled project', revision: 0, settings: defaultSettings(), assets: [], designs: [] } }
export const mmToPt = (mm: number) => mm * 72 / 25.4
export const mmToPixels = (mm: number, dpi: number) => Math.round(mm * dpi / 25.4)
export const effectivePpi = (t: ImageTransform) => 25.4 / t.mmPerPixel
export function fitImage(asset: Asset, circles: CircleSettings, mode: Exclude<FitMode, 'manual'>): ImageTransform {
  const diameter = mode === 'safe' ? circles.inner - 2 * circles.safeInset : circles.inner
  return { mmPerPixel: mode === 'fill' ? diameter / Math.min(asset.width, asset.height) : diameter / Math.hypot(asset.width, asset.height), x: 0, y: 0, rotation: 0 }
}
