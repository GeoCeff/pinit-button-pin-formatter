import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { DesktopBridge } from '../src/bridge'

const invoke = (name: string, ...args: unknown[]) => ipcRenderer.invoke(`pinit:${name}`, ...args)

const api: DesktopBridge = {
  resetSession: () => invoke('reset'),
  importImages: () => invoke('import'),
  importPaths: paths => invoke('import-paths', paths),
  importClipboard: () => invoke('import-clipboard'),
  getPathForFile: file => webUtils.getPathForFile(file),
  relinkImage: () => invoke('relink'),
  openProject: () => invoke('open'),
  saveProject: (p, saveAs) => invoke('save', p, saveAs),
  importProfile: () => invoke('profile'),
  presets: () => invoke('presets'),
  savePreset: p => invoke('preset-save', p),
  deletePreset: name => invoke('preset-delete', name),
  recentProjects: () => invoke('recent'),
  openRecentProject: projectPath => invoke('open-recent', projectPath),
  beginExport: p => invoke('export-begin', p),
  writeExport: (id, name, bytes) => invoke('export-write', id, name, bytes),
  finishExport: id => invoke('export-finish', id),
  cancelExport: id => invoke('export-cancel', id),
  openOutput: target => invoke('open-output', target),
  exportCalibration: settings => invoke('export-calibration', settings),
  appInfo: () => invoke('app-info'),
  setDirty: dirty => ipcRenderer.send('pinit:dirty', dirty),
  runtimeStatus: () => invoke('runtime'),
  respondToClose: action => invoke('close-response', action),
  onCloseRequested: callback => {
    const listener = (_: unknown, request: { exporting: boolean }) => callback(request)
    ipcRenderer.on('pinit:close-request', listener)
    return () => ipcRenderer.removeListener('pinit:close-request', listener)
  },
  onProgress: callback => {
    const listener = (_: unknown, message: string) => callback(message)
    ipcRenderer.on('pinit:progress', listener)
    return () => ipcRenderer.removeListener('pinit:progress', listener)
  }
}

contextBridge.exposeInMainWorld('desktop', api)
