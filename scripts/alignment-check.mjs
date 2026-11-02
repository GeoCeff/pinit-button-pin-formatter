import { _electron as electron, expect } from '@playwright/test'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import sharp from 'sharp'

const root=path.resolve('local-data',`alignment-${Date.now()}`)
const captures=path.resolve('.impeccable/review')
await mkdir(root,{recursive:true});await mkdir(captures,{recursive:true})
const fixture=path.join(root,'Synthetic alignment artwork.png')
await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="800"><rect width="1000" height="800" fill="#e9d8b4"/><circle cx="500" cy="400" r="260" fill="#315e4c"/><text x="500" y="425" text-anchor="middle" font-family="Arial" font-size="62" fill="#fffefa">CENTER TEST</text></svg>')).png().toFile(fixture)
const app=await electron.launch({executablePath:process.env.PINIT_EXECUTABLE,args:process.env.PINIT_EXECUTABLE?[]:['.'],env:{...process.env,PINIT_TEST_DATA:path.join(root,'app-data')},timeout:60000})
const errors=[]
try {
  const page=await app.firstWindow();page.on('pageerror',error=>errors.push(error.message))
  await page.getByRole('dialog',{name:'A quick tour of dfCuts',exact:true}).getByRole('button',{name:'Skip tour',exact:true}).click()
  const xField=page.getByLabel('Horizontal offset',{exact:true})
  const yField=page.getByLabel('Vertical offset',{exact:true})
  const widthField=page.getByLabel('Artwork width',{exact:true})
  const rotationField=page.getByLabel('Rotation',{exact:true})
  const indicator=page.locator('.alignment-status')
  const centerButton=page.getByRole('button',{name:'Center artwork',exact:true})
  async function choose(paths){await app.evaluate(({dialog},paths)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:paths})},paths)}
  async function scene(){
    await page.evaluate(()=>window.scrollTo(0,0))
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
    const box=await page.locator('.editor-canvas .konvajs-content').boundingBox()
    return {x:box.x+box.width/2,y:box.y+box.height/2,scale:box.width/(53*1.14)}
  }
  async function offsets(){return {x:Number(await xField.inputValue()),y:Number(await yField.inputValue())}}
  async function selectionPixels(){return page.locator('.editor-canvas canvas').first().evaluate(canvas=>{
    const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data
    let count=0;for(let i=0;i<data.length;i+=4)if(data[i]===73&&data[i+1]===98&&data[i+2]===79&&data[i+3]===255)count++
    return count
  })}
  async function selectArtwork(){const s=await scene();const position=await offsets();await page.mouse.click(s.x+position.x*s.scale,s.y+position.y*s.scale);await expect.poll(selectionPixels).toBeGreaterThan(0)}
  async function dragTo(xPixels,yPixels,{alt=false,capture,steps=12}={}){
    const s=await scene();const current=await offsets()
    if(alt)await page.keyboard.down('Alt')
    await page.mouse.move(s.x+current.x*s.scale,s.y+current.y*s.scale);await page.mouse.down()
    await page.mouse.move(s.x+xPixels,s.y+yPixels,{steps})
    if(capture)await page.screenshot({animations:'disabled',path:path.join(captures,capture)})
    await page.mouse.up();if(alt)await page.keyboard.up('Alt')
  }
  async function resizeCorner(factor,capture){
    await selectArtwork()
    const s=await scene();const position=await offsets();const width=Number(await widthField.inputValue());const height=width*0.8
    const angle=Number(await rotationField.inputValue())*Math.PI/180
    const dx=(width/2*Math.cos(angle)-height/2*Math.sin(angle))*s.scale
    const dy=(width/2*Math.sin(angle)+height/2*Math.cos(angle))*s.scale
    const center={x:s.x+position.x*s.scale,y:s.y+position.y*s.scale}
    await page.mouse.move(center.x+dx,center.y+dy);await page.mouse.down()
    await page.mouse.move(center.x+dx*factor,center.y+dy*factor,{steps:12})
    if(capture)await page.screenshot({animations:'disabled',path:path.join(captures,capture)})
    await page.mouse.up()
  }
  await choose([fixture]);await page.getByRole('button',{name:'Import artwork',exact:true}).click()
  await page.getByRole('button',{name:'Adjust artwork',exact:true}).click()
  await expect(page.getByRole('button',{name:'Eyedropper',exact:true})).toBeEnabled()
  await expect(indicator).toHaveText('Centered');await expect(centerButton).toBeHidden()
  await expect.poll(selectionPixels).toBe(0)
  await page.screenshot({animations:'disabled',path:path.join(captures,'artwork-deselected.png')})
  await selectArtwork();await page.screenshot({animations:'disabled',path:path.join(captures,'artwork-selected.png')})
  const blank=await scene();await page.mouse.click(blank.x-26.5*1.14*blank.scale+4,blank.y-26.5*1.14*blank.scale+4);await expect.poll(selectionPixels).toBe(0)
  await selectArtwork();await page.keyboard.press('Escape');await expect.poll(selectionPixels).toBe(0)
  const canvas=page.getByRole('group',{name:'Artwork canvas',exact:true});await canvas.focus();await page.keyboard.press('Enter');await expect.poll(selectionPixels).toBeGreaterThan(0)
  await page.keyboard.press('Escape');await expect.poll(selectionPixels).toBe(0);await page.keyboard.press('Space');await expect.poll(selectionPixels).toBeGreaterThan(0)
  await page.keyboard.press('Tab');await expect.poll(selectionPixels).toBe(0)
  await selectArtwork();await page.locator('.design-heading h1').click();await expect.poll(selectionPixels).toBe(0)
  const touch=await page.context().newCDPSession(page)
  await touch.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1})
  const tapped=await scene()
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tapped.x,y:tapped.y}]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(selectionPixels).toBeGreaterThan(0)
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tapped.x-26.5*1.14*tapped.scale+4,y:tapped.y-26.5*1.14*tapped.scale+4}]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(selectionPixels).toBe(0)
  await touch.send('Emulation.setTouchEmulationEnabled',{enabled:false});await touch.detach()
  assert.deepEqual(await offsets(),{x:0,y:0})
  await xField.fill('4');await yField.fill('5');await rotationField.fill('27');await widthField.fill('32')
  await expect(indicator).toHaveText('Off center');await selectArtwork();await centerButton.click();await expect.poll(selectionPixels).toBe(0)
  assert.deepEqual(await offsets(),{x:0,y:0});assert.equal(Number(await widthField.inputValue()),32);assert.equal(Number(await rotationField.inputValue()),27)

  await dragTo(44,30);await expect(indicator).toHaveText('Off center')
  await dragTo(3,30,{capture:'alignment-one-axis.png'});await expect(indicator).toHaveText('Centered horizontally')
  assert.equal((await offsets()).x,0);assert.ok((await offsets()).y>1)
  await dragTo(3,4,{capture:'alignment-centered.png'});await expect(indicator).toHaveText('Centered')
  assert.deepEqual(await offsets(),{x:0,y:0})
  for(const [x,y] of [[-40,-24],[44,28],[-24,42]]){await dragTo(x,y,{steps:1});await dragTo(3,4,{steps:1});await expect(indicator).toHaveText('Centered');assert.deepEqual(await offsets(),{x:0,y:0})}

  await dragTo(3,4,{alt:true});await expect(indicator).toHaveText('Off center')
  const unsnapped=await offsets();assert.ok(unsnapped.x>0&&unsnapped.y>0,'Alt allows precise placement inside the snap zone')
  await centerButton.click();await resizeCorner(1.3,'alignment-resize.png')
  const centeredWidth=Number(await widthField.inputValue())
  assert.ok(centeredWidth>40&&centeredWidth<43,`corner resize changed width to ${centeredWidth}`)
  assert.deepEqual(await offsets(),{x:0,y:0});assert.equal(Number(await rotationField.inputValue()),27)
  await expect(indicator).toHaveText('Centered')

  await rotationField.fill('0');await widthField.fill('30');await xField.fill('3');await yField.fill('-2')
  await resizeCorner(1.2)
  const offCenter=await offsets();assert.ok(Math.abs(offCenter.x-3)<0.0001&&Math.abs(offCenter.y+2)<0.0001,'resize preserves an intentional center offset')
  const pointerTolerance=2/(await scene()).scale
  assert.ok(Math.abs(Number(await widthField.inputValue())-36)<pointerTolerance,'proportional resize stays within two screen pixels of the target')
  await centerButton.click()

  await page.getByRole('button',{name:'Eyedropper',exact:true}).click();const s=await scene();await page.mouse.click(s.x,s.y)
  await expect(page.getByRole('button',{name:'Eyedropper',exact:true})).toBeVisible();assert.deepEqual(await offsets(),{x:0,y:0})
  for(const label of ['Cut','Face','Safe'])await page.getByLabel(label,{exact:true}).uncheck()
  await dragTo(3,4,{capture:'alignment-guides-only.png'});await expect(indicator).toHaveText('Centered')
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1080,720))
  await dragTo(38,28);await dragTo(4,5,{capture:'alignment-compact.png'});assert.deepEqual(await offsets(),{x:0,y:0})
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1500,960))

  await choose([root]);await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('status').filter({hasText:'Project saved'}).waitFor()
  const projectFolder=path.join(root,(await readdir(root)).find(name=>name.startsWith('dfCuts-')))
  const saved=JSON.parse(await readFile(path.join(projectFolder,'project.json'),'utf8'))
  assert.ok(Math.abs(saved.designs[0].transform.x)<1e-7);assert.ok(Math.abs(saved.designs[0].transform.y)<1e-7)
  assert.ok(Math.abs(saved.designs[0].transform.mmPerPixel*1000-36)<pointerTolerance)
  await page.getByRole('button',{name:'Export sheets',exact:true}).click();await page.getByLabel('File format',{exact:true}).selectOption('png');await page.getByLabel('Raster resolution',{exact:true}).fill('150')
  await choose([root]);await page.getByRole('button',{name:'Choose folder & export'}).click();await page.getByRole('status').filter({hasText:'Export saved:'}).waitFor({timeout:60000})
  const output=path.join(root,(await readdir(root)).find(name=>name.startsWith('dfCuts-export-')),'sheet-0001.png')
  const {data,info}=await sharp(output).raw().toBuffer({resolveWithObject:true})
  let selectionInk=0
  for(let i=0;i<data.length;i+=info.channels)if(data[i]===73&&data[i+1]===98&&data[i+2]===79)selectionInk++
  assert.equal(selectionInk,0,'alignment guides and selection handles must not be printed')
  assert.deepEqual(errors,[])
  await page.evaluate(()=>window.desktop.setDirty(false))
  const report={passed:true,checks:['selection hidden initially','click artwork to select','blank canvas deselects','outside click deselects','Escape deselects','keyboard selection','Tab deselects','touch selection and deselection','centering hides handles','independent-axis snap','center feedback','Alt bypass','rotated proportional resizing','preserved offsets','center action preserves size/rotation','eyedropper','minimum window','saved geometry','no alignment guides in export'],root}
  await writeFile(path.join(root,'validation.json'),JSON.stringify(report,null,2))
  console.log(JSON.stringify(report,null,2))
}catch(error){const page=await app.firstWindow().catch(()=>null);if(page)await page.screenshot({animations:'disabled',path:path.join(captures,'alignment-failure.png')}).catch(()=>{});throw error}
finally{await app.evaluate(({dialog})=>{dialog.showMessageBoxSync=()=>1}).catch(()=>{});await app.close()}

