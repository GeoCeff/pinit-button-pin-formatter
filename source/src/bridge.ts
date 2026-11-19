import type { Asset, Preset, Project, Settings } from './core/model'

export interface Imported { asset: Asset; name: string; source: string; suggestedFill: string }
export interface PathImportResult { imported: Imported[]; skipped: number }
export interface Opened { project: Project; images: Imported[]; missing: string[]; profileMissing: boolean; location: string }
export interface RecentProject { name: string; path: string; updatedAt: string; designCount: number }
export interface AppInfo { version: string; name: string; cmyk: boolean; portable: boolean }

export interface DesktopBridge {
  resetSession(): Promise<void>
  importImages(): Promise<Imported[]>
  importPaths(paths: string[]): Promise<PathImportResult>
  importClipboard(): Promise<Imported | null>
  getPathForFile(file: File): string
  relinkImage(): Promise<Imported | null>
  openProject(): Promise<Opened | null>
  saveProject(project: Project, saveAs: boolean): Promise<string | null>
  importProfile(): Promise<string | null>
  presets(): Promise<Preset[]>
  savePreset(preset: Preset): Promise<void>
  deletePreset(name: string): Promise<void>
  recentProjects(): Promise<RecentProject[]>
  openRecentProject(projectPath: string): Promise<Opened | null>
  beginExport(project: Project): Promise<string | null>
  writeExport(id: string, name: string, bytes: Uint8Array): Promise<void>
  finishExport(id: string): Promise<string>
  cancelExport(id: string): Promise<void>
  openOutput(target: 'folder' | 'file'): Promise<void>
  exportCalibration(settings: Settings): Promise<string | null>
  appInfo(): Promise<AppInfo>
  setDirty(dirty: boolean): void
  onCloseRequested(callback: (request: { exporting: boolean }) => void): () => void
  respondToClose(action: 'cancel' | 'discard'): Promise<void>
  onProgress(callback: (message: string) => void): () => void
  runtimeStatus(): Promise<{ cmyk: boolean }>
}

declare global { interface Window { desktop: DesktopBridge } }
