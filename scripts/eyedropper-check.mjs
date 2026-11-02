import { _electron as electron, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import sharp from 'sharp'

const root=path.resolve('local-data',`eyedropper-${Date.now()}`),captures=path.resolve('.impeccable/review')
await mkdir(root,{recursive:true});await mkdir(captures,{recursive:true})
const width=96,height=80,pixels=Buffer.alloc(width*height*4)
function rgba(x,y){return [x*2+10,y*3+5,(x*5+y*7)%256,x<6&&y<6?0:255]}
function hex(x,y){return '#'+rgba(x,y).slice(0,3).map(n=>n.toString(16).padStart(2,'0')).join('')}
for(let y=0;y<height;y++)for(let x=0;x<width;x++)pixels.set(rgba(x,y),(y*width+x)*4)
const fixture=path.join(root,'Synthetic pixel grid.png');await sharp(pixels,{raw:{width,height,channels:4}}).png().toFile(fixture)
const app=await electron.launch({args:['.'],env:{...process.env,PINIT_TEST_DATA:path.join(root,'app-data')},timeout:60000})
const errors=[]
try {
  const page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message))
  await page.getByRole('dialog',{name:'A quick tour of dfCuts',exact:true}).getByRole('button',{name:'Skip tour',exact:true}).click()
  await app.evaluate(({dialog},fixture)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[fixture]})},fixture)
  await page.getByRole('button',{name:'Import artwork',exact:true}).click();await page.getByRole('button',{name:'Adjust artwork',exact:true}).click()
  const tool=page.getByRole('button',{name:'Eyedropper',exact:true}),cancel=page.getByRole('button',{name:'Cancel eyedropper',exact:true}),loupe=page.locator('.eyedropper-loupe'),readout=page.locator('.eyedropper-hex'),fill=page.getByLabel('Background color',{exact:true})
  const xf=page.getByLabel('Horizontal offset',{exact:true}),yf=page.getByLabel('Vertical offset',{exact:true}),wf=page.getByLabel('Artwork width',{exact:true}),rf=page.getByLabel('Rotation',{exact:true})
  await expect(tool).toBeEnabled();await wf.fill('32');await rf.fill('27');await xf.fill('3');await yf.fill('-2')
  const geometry=async()=>({x:await xf.inputValue(),y:await yf.inputValue(),w:await wf.inputValue(),r:await rf.inputValue()})
  const before=await geometry()
  async function scene(){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const b=await page.locator('.editor-canvas .konvajs-content').boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2,scale:b.width/(53*1.14),box:b}}
  async function point(x,y){const s=await scene(),angle=Number(await rf.inputValue())*Math.PI/180,mmPerPixel=Number(await wf.inputValue())/width,px=(x+.5-width/2)*mmPerPixel,py=(y+.5-height/2)*mmPerPixel;return {x:s.x+(Number(await xf.inputValue())+px*Math.cos(angle)-py*Math.sin(angle))*s.scale,y:s.y+(Number(await yf.inputValue())+px*Math.sin(angle)+py*Math.cos(angle))*s.scale}}
  async function hover(x,y){const p=await point(x,y);await page.mouse.move(p.x,p.y);await expect(readout).toHaveText(hex(x,y).toUpperCase());return p}
  async function assertBounds(){const b=await page.locator('.editor-canvas').boundingBox(),l=await loupe.boundingBox();assert.ok(l&&l.x>=b.x&&l.y>=b.y&&l.x+l.width<=b.x+b.width+1&&l.y+l.height<=b.y+b.height+1,'magnifier stays inside its canvas')}
  const oldFill=await fill.innerText();await tool.click();const p=await hover(43,37)
  const cursor=await page.locator('.editor-canvas canvas').first().evaluate(n=>getComputedStyle(n).cursor);assert.ok(cursor.includes('data:image/svg+xml')&&cursor.includes('3 21'),'SVG eyedropper cursor has its tip as the hotspot')
  assert.deepEqual(await loupe.locator('canvas').evaluate(n=>[...n.getContext('2d').getImageData(5,5,1,1).data]),rgba(43,37),'center pixel comes from the original source after rotation, scale and offset')
  assert.deepEqual(await loupe.locator('canvas').evaluate(n=>[...n.getContext('2d').getImageData(6,5,1,1).data]),rgba(44,37),'adjacent source pixels remain distinct')
  await assertBounds();assert.equal(await fill.innerText(),oldFill,'hover only previews the color');await page.screenshot({animations:'disabled',path:path.join(captures,'eyedropper-magnifier.png')})
  await page.mouse.click(p.x,p.y);await expect(tool).toBeVisible();await expect(loupe).toHaveCount(0);await expect(fill).toHaveText(hex(43,37).toUpperCase());assert.deepEqual(await geometry(),before)

  await tool.click();await hover(60,45);await page.keyboard.press('Escape');await expect(tool).toBeVisible();await expect(fill).toHaveText(hex(43,37).toUpperCase())
  await tool.click();const transparent=await point(2,2);await page.mouse.move(transparent.x,transparent.y);await expect(readout).toHaveText('Transparent');await page.mouse.click(transparent.x,transparent.y);await expect(cancel).toBeVisible();await expect(fill).toHaveText(hex(43,37).toUpperCase())
  await page.keyboard.press('Escape');await tool.click();const s=await scene();await page.mouse.click(s.box.x+2,s.box.y+2);await expect(loupe).toBeHidden();await expect(cancel).toBeVisible();await expect(fill).toHaveText(hex(43,37).toUpperCase());await page.keyboard.press('Escape')

  await tool.click();await hover(43,37);await page.keyboard.press('ArrowRight');await expect(readout).toHaveText(hex(44,37).toUpperCase());await page.keyboard.press('ArrowDown');await expect(readout).toHaveText(hex(44,38).toUpperCase());await page.keyboard.press('Enter');await expect(fill).toHaveText(hex(44,38).toUpperCase());await expect(tool).toBeVisible()
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1080,720));await tool.click();await hover(75,60);await assertBounds();await page.screenshot({animations:'disabled',path:path.join(captures,'eyedropper-compact.png')});await page.keyboard.press('Escape')

  const touch=await page.context().newCDPSession(page);await touch.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await tool.click();const touched=await point(43,37)
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touched]});await expect(readout).toHaveText(hex(43,37).toUpperCase());await expect(fill).toHaveText(hex(44,38).toUpperCase());await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(tool).toBeVisible();await expect(fill).toHaveText(hex(43,37).toUpperCase());await touch.send('Emulation.setTouchEmulationEnabled',{enabled:false});await touch.detach()
  assert.deepEqual(await geometry(),before);assert.deepEqual(errors,[])
  await page.evaluate(()=>window.desktop.setDirty(false))
  const result={passed:true,checks:['SVG eyedropper cursor','magnified source pixels','rotation, scale and offsets','hover does not change fill','click applies exact color','Escape cancels','transparent pixel rejected','outside cut rejected','keyboard pixel steps and confirm','compact magnifier bounds','touch previews before release','artwork geometry preserved'],root}
  await writeFile(path.join(root,'validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2))
}catch(error){const page=await app.firstWindow().catch(()=>null);if(page)await page.screenshot({animations:'disabled',path:path.join(captures,'eyedropper-failure.png')}).catch(()=>{});throw error}
finally{await app.evaluate(({dialog})=>{dialog.showMessageBoxSync=()=>1}).catch(()=>{});await app.close()}
