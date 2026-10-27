import type { Asset, Preset, Project } from './core/model'
export interface Imported { asset: Asset; name: string; source: string; suggestedFill: string }
export interface Opened { project: Project; images: Imported[]; missing: string[]; profileMissing: boolean; location: string }
export interface DesktopBridge {
  resetSession(): Promise<void>
  importImages(): Promise<Imported[]>
  relinkImage(): Promise<Imported | null>
  openProject(): Promise<Opened | null>
  saveProject(project: Project, saveAs: boolean): Promise<string | null>
  importProfile(): Promise<string | null>
  presets(): Promise<Preset[]>
  savePreset(preset: Preset): Promise<void>
  beginExport(project: Project): Promise<string | null>
  writeExport(id: string, name: string, bytes: Uint8Array): Promise<void>
  finishExport(id: string): Promise<string>
  cancelExport(id: string): Promise<void>
  setDirty(dirty: boolean): void
  onProgress(callback: (message: string) => void): () => void
  runtimeStatus(): Promise<{ cmyk: boolean }>
}
declare global { interface Window { desktop: DesktopBridge } }
