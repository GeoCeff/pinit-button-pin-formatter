import { createServer, loadConfigFromFile } from 'vite'
import { _electron as electron } from '@playwright/test'
import { mkdir,readFile } from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=path.resolve('local-data',`dev-check-${Date.now()}`);await mkdir(root,{recursive:true})
const loaded=await loadConfigFromFile({command:'serve',mode:'development'},path.resolve('electron.vite.config.ts'))
const server=await createServer({...loaded.config.renderer,configFile:false,server:{host:'127.0.0.1',port:5187,strictPort:true}})
await server.listen()
let app
try{
  const response=await fetch('http://127.0.0.1:5187/');const html=await response.text();assert.ok(html.includes("script-src 'self' 'unsafe-inline'"))
  assert.ok(!(await readFile('out/renderer/index.html','utf8')).includes("script-src 'self' 'unsafe-inline'"),'production keeps a strict CSP')
  app=await electron.launch({args:['.'],env:{...process.env,PINIT_TEST_DATA:root,ELECTRON_RENDERER_URL:'http://127.0.0.1:5187/'},timeout:30000})
  const page=await app.firstWindow();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.getByRole('heading',{name:'Add your artwork.',exact:true}).waitFor();await page.getByRole('button',{name:'Import artwork',exact:true}).waitFor();assert.deepEqual(errors,[])
  console.log('Development renderer launches with React refresh; production CSP remains strict.')
}finally{if(app)await app.close();await server.close()}
