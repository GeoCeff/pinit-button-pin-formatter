import { contextBridge, ipcRenderer } from 'electron'
import type { DesktopBridge } from '../src/bridge'
const invoke = (name: string,...args: unknown[]) => ipcRenderer.invoke(`pinit:${name}`,...args)
const api: DesktopBridge = {
  resetSession:()=>invoke('reset'),
  importImages:()=>invoke('import'), relinkImage:()=>invoke('relink'), openProject:()=>invoke('open'),
  saveProject:(p,saveAs)=>invoke('save',p,saveAs), importProfile:()=>invoke('profile'),
  presets:()=>invoke('presets'),savePreset:p=>invoke('preset-save',p),
  beginExport:p=>invoke('export-begin',p),writeExport:(id,name,bytes)=>invoke('export-write',id,name,bytes),
  finishExport:id=>invoke('export-finish',id),cancelExport:id=>invoke('export-cancel',id),
  setDirty:dirty=>ipcRenderer.send('pinit:dirty',dirty),runtimeStatus:()=>invoke('runtime'),
  onProgress:callback=>{ const listener=(_:unknown,message:string)=>callback(message); ipcRenderer.on('pinit:progress',listener);return()=>ipcRenderer.removeListener('pinit:progress',listener) }
}
contextBridge.exposeInMainWorld('desktop',api)
