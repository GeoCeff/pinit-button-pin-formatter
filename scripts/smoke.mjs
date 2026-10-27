import { _electron as electron, expect } from '@playwright/test'
import { mkdir,readFile,readdir,writeFile,cp,rm } from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib'

const root=path.resolve('local-data',`smoke-${Date.now()}`);await mkdir(root,{recursive:true})
const screenshotDir=path.resolve('.impeccable/review');await mkdir(screenshotDir,{recursive:true})
const fixture=path.join(root,'Garden club.png');const second=path.join(root,'Slow mornings.jpg')
await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000"><rect width="1000" height="1000" fill="#e9d8b4"/><circle cx="500" cy="500" r="360" fill="#315e4c"/><text x="500" y="455" text-anchor="middle" font-family="Arial" font-size="108" fill="#fff4db">GARDEN</text><text x="500" y="575" text-anchor="middle" font-family="Arial" font-size="125" fill="#fff4db">CLUB</text></svg>')).png().toFile(fixture)
await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="750"><rect width="900" height="750" fill="#ba5a3b"/><circle cx="450" cy="280" r="110" fill="#f5df9f"/><text x="450" y="525" text-anchor="middle" font-family="Arial" font-size="76" fill="#fff4db">SLOW MORNINGS</text></svg>')).jpeg().toFile(second)
const app=await electron.launch({executablePath:process.env.PINIT_EXECUTABLE,args:process.env.PINIT_EXECUTABLE?[]:['.'],env:{...process.env,PINIT_TEST_DATA:path.join(root,'app-data')},timeout:60000})
const errors=[]
try {
  const page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message))
  await page.getByRole('heading',{name:'Add your artwork.',exact:true}).waitFor()
  await page.evaluate(()=>document.fonts.ready)
  assert.ok(await page.evaluate(()=>document.fonts.check('800 24px "PinIt Sans"')),'the bundled font loads offline')
  await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'empty.png')})
  async function choose(paths){await app.evaluate(({dialog},paths)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:paths})},paths)}
  await choose([fixture,second]);await page.getByRole('button',{name:'Import artwork',exact:true}).click()
  await page.getByRole('status').filter({hasText:'Imported 2 designs.'}).waitFor();await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'notice.png')});await page.getByRole('button',{name:'Dismiss notification',exact:true}).click()
  const artworkTab=page.getByRole('button',{name:'Artwork',exact:true});const sheetTab=page.getByRole('button',{name:'Sheet',exact:true})
  const firstTile=page.locator('.dock-tile').first()
  const dockScale=()=>firstTile.evaluate(node=>new DOMMatrixReadOnly(getComputedStyle(node).transform).a)
  await artworkTab.hover();await expect.poll(dockScale).toBeGreaterThan(1.1);await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'dock-hover.png')})
  await artworkTab.focus();await expect.poll(dockScale).toBeCloseTo(1,4)
  await page.emulateMedia({reducedMotion:'reduce'});await artworkTab.hover();await expect.poll(dockScale).toBeCloseTo(1,4);await page.mouse.move(0,0);await page.emulateMedia({reducedMotion:'no-preference'});await artworkTab.hover();await expect.poll(dockScale).toBeGreaterThan(1.1);await page.mouse.move(0,0);await artworkTab.focus();await expect.poll(dockScale).toBeCloseTo(1,4)
  await artworkTab.focus();await page.keyboard.press('ArrowRight');await expect(sheetTab).toBeFocused();await page.keyboard.press('Enter');await expect(sheetTab).toHaveAttribute('aria-pressed','true')
  await page.keyboard.press('Home');await expect(artworkTab).toBeFocused();await page.keyboard.press('Enter');await expect(artworkTab).toHaveAttribute('aria-pressed','true')
  await page.getByRole('button',{name:'Fit within face circle',exact:true}).click();await expect(page.getByRole('button',{name:'Fit within face circle',exact:true})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'Fit within safe circle',exact:true}).click()
  await artworkTab.focus();await page.keyboard.press('End');await expect(page.getByRole('button',{name:'Export',exact:true})).toBeFocused();await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'Your artwork',exact:true})).toBeVisible();await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'library.png')});await sheetTab.click()
  await page.getByLabel('Paper size',{exact:true}).selectOption('custom')
  assert.equal(await page.getByLabel('Paper width',{exact:true}).inputValue(),'210');assert.equal(await page.getByLabel('Paper height',{exact:true}).inputValue(),'297')
  await page.getByLabel('Paper size',{exact:true}).selectOption('a4')
  await page.keyboard.press('Escape');await artworkTab.click()
  await page.getByRole('button',{name:'Remove Garden club',exact:true}).click();await page.getByRole('alertdialog').waitFor();await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'remove-confirmation.png')})
  const removeAction=page.getByRole('alertdialog').getByRole('button',{name:'Remove artwork',exact:true})
  await removeAction.hover();await expect.poll(()=>removeAction.evaluate(node=>getComputedStyle(node).backgroundColor)).toBe('rgb(133, 34, 33)');assert.equal(await removeAction.evaluate(node=>getComputedStyle(node).color),'rgb(255, 255, 255)');await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'remove-hover.png')});await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('button',{name:/Garden club.*1 copy/}).count(),1,'canceling removal preserves the design')
  await page.getByRole('button',{name:'Adjust artwork',exact:true}).click()
  await page.getByLabel('Total copies',{exact:true}).fill('20')
  await page.getByRole('button',{name:/Slow mornings.*1 copy/}).click();await page.getByLabel('Total copies',{exact:true}).fill('7')
  await page.getByLabel('Project name',{exact:true}).fill('Garden club · synthetic test')
  await page.getByLabel('Rotation',{exact:true}).fill('17');await page.getByLabel('Horizontal offset',{exact:true}).fill('1.5')
  await page.getByRole('button',{name:/Garden club.*20 copies/}).click()
  await page.getByLabel('Project name',{exact:true}).fill('Garden club · '+ 'A very long project name '.repeat(8));await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'long-project-name.png')});await page.getByLabel('Project name',{exact:true}).fill('Garden club · synthetic test')
  await sheetTab.click()
  await page.getByLabel('Cut diameter',{exact:true}).fill('20');await page.getByRole('alert').filter({hasText:'Circles:'}).waitFor();assert.equal(await page.getByLabel('Cut diameter',{exact:true}).getAttribute('aria-invalid'),'true');await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'invalid-cut.png')});await page.getByLabel('Cut diameter',{exact:true}).fill('53')
  await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'sheet-settings.png')});await artworkTab.click()
  await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'artwork-adjustments.png')});await page.getByRole('button',{name:'Hide adjustments',exact:true}).click()
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'desktop.png')})
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'desktop has no horizontal overflow')
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1080,720));await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'compact.png')});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'minimum window has no horizontal overflow');await expect.poll(async()=>(await page.locator('.editor-canvas .konvajs-content').boundingBox()).width/1.14).toBeGreaterThanOrEqual(300)
  await sheetTab.click();await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'compact-sheet.png')});await artworkTab.click();await page.getByRole('button',{name:'Adjust artwork',exact:true}).click();await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'compact-adjustments.png')});await page.getByRole('button',{name:'Hide adjustments',exact:true}).click()
  await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];w.setMinimumSize(360,600);w.setSize(406,874)});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const narrow=await page.evaluate(()=>({width:document.documentElement.clientWidth,inner:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right})).slice(0,12)}));assert.ok(narrow.scroll<=narrow.width,JSON.stringify(narrow));await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'mobile.png'),fullPage:true,style:`html { overflow-y: scroll !important; } .app { width: ${narrow.width}px !important; }`})
  await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];w.setMinimumSize(1080,720);w.setSize(1500,960)})
  await page.getByRole('button',{name:'Adjust artwork',exact:true}).click()
  await choose([root]);await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('status').filter({hasText:'Project saved'}).waitFor()
  const projectFolder=path.join(root,(await readdir(root)).find(n=>n.startsWith('PinIt-')))
  let project=JSON.parse(await readFile(path.join(projectFolder,'project.json'),'utf8'))
  assert.deepEqual(project.designs.map(d=>d.quantity),[20,7]);assert.equal(project.designs[1].transform.rotation,17)
  assert.deepEqual(await readFile(path.join(projectFolder,project.assets[0].path)),await readFile(fixture))
  async function exportFormat(format,color='rgb') {
    await page.getByRole('button',{name:'Export sheets',exact:true}).click();await page.getByLabel('File format',{exact:true}).selectOption(format)
    if(format==='pdf'&&color==='rgb'){await page.getByRole('button',{name:'Close dialog',exact:true}).focus();await page.keyboard.press('Shift+Tab');assert.equal(await page.locator(':focus').innerText(),'Choose folder & export');await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').getAttribute('aria-label'),'Close dialog');await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);await expect(page.getByRole('button',{name:'Export sheets',exact:true})).toBeFocused();await page.getByRole('button',{name:'Export sheets',exact:true}).click()}
    if(format==='pdf')await page.getByLabel('PDF color',{exact:true}).selectOption(color)
    if(format==='pdf'&&color==='rgb'){await page.getByLabel('Raster resolution',{exact:true}).fill('');assert.equal(await page.getByLabel('Raster resolution',{exact:true}).getAttribute('aria-invalid'),'true');await page.getByRole('dialog').getByRole('alert').waitFor();assert.ok(await page.getByRole('button',{name:'Choose folder & export'}).isDisabled());await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'invalid-export.png')})}
    await page.getByLabel('Raster resolution',{exact:true}).fill('150')
    await page.screenshot({animations:'disabled',path:path.join(screenshotDir,`export-${format}-${color}.png`)})
    const before=new Set(await readdir(root));await choose([root]);await page.getByRole('button',{name:'Choose folder & export'}).click()
    await Promise.race([page.getByRole('status').filter({hasText:'Export saved:'}).waitFor({timeout:120000}),page.getByRole('alert').first().waitFor({timeout:120000}).then(async()=>{throw new Error(await page.getByRole('alert').first().innerText())})])
    const folder=(await readdir(root)).find(n=>n.startsWith('PinIt-export-')&&!before.has(n));assert.ok(folder,'export published a new directory');return path.join(root,folder)
  }
  let rgbPdf
  for(const [format,color] of [['pdf','rgb'],['png','rgb'],['jpg','rgb'],['pdf','cmyk']]) {
    const folder=await exportFormat(format,color);const files=await readdir(folder)
    if(format==='pdf') {
      const pdf=await PDFDocument.load(await readFile(path.join(folder,'sheets.pdf')));assert.equal(pdf.getPageCount(),2)
      if(color==='rgb')rgbPdf=await readFile(path.join(folder,'sheets.pdf'))
      assert.ok(Math.abs(pdf.getPage(0).getWidth()*25.4/72-210)<0.01)
      const images=pdf.context.enumerateIndirectObjects().filter(([,obj])=>obj instanceof PDFRawStream&&obj.dict.get(PDFName.of('Subtype'))?.toString()==='/Image')
      assert.ok(images.length>=2)
      if(color==='cmyk')assert.ok(images.some(([,obj])=>obj.dict.get(PDFName.of('ColorSpace'))?.toString()==='/DeviceCMYK'))
    } else {
      assert.equal(files.length,2);const metadata=await sharp(await readFile(path.join(folder,files[0]))).metadata();assert.equal(metadata.width,1240);assert.equal(metadata.height,1754);assert.equal(metadata.density,150)
    }
  }
  await choose([root])
  project.settings.output.color='rgb';const id=await page.evaluate(p=>window.desktop.beginExport(p),project);assert.ok(id)
  const traversal=await page.evaluate(async({id,bytes})=>{try{await window.desktop.writeExport(id,'../outside.pdf',new Uint8Array(bytes));return false}catch{return true}},{id,bytes:[...rgbPdf]});assert.equal(traversal,true)
  await page.evaluate(async({id,bytes})=>window.desktop.writeExport(id,'sheets.pdf',new Uint8Array(bytes)),{id,bytes:[...rgbPdf]});await page.evaluate(id=>window.desktop.cancelExport(id),id);assert.ok(!(await readdir(root)).some(n=>n.startsWith('.pinit-')))
  const corrupt=await readFile('resources/ghostscript/iccprofiles/default_cmyk.icc');corrupt.fill(0,128);const corruptPath=path.join(root,'broken-cmyk.icc');await writeFile(corruptPath,corrupt);await choose([corruptPath]);const profile=await page.evaluate(()=>window.desktop.importProfile());project.settings.output.color='cmyk';project.settings.output.profile=profile
  await choose([root]);const failedId=await page.evaluate(p=>window.desktop.beginExport(p),project);await page.evaluate(async({id,bytes})=>window.desktop.writeExport(id,'sheets.pdf',new Uint8Array(bytes)),{id:failedId,bytes:[...rgbPdf]})
  const failure=await page.evaluate(async id=>{try{await window.desktop.finishExport(id);return null}catch(e){return e.message}},failedId);assert.ok(failure,'invalid CMYK profile must fail explicitly');assert.ok(!(await readdir(root)).some(n=>n.startsWith('.pinit-')));project.settings.output.profile=null
  await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('status').filter({hasText:'Project saved'}).waitFor()
  project=JSON.parse(await readFile(path.join(projectFolder,'project.json'),'utf8'))
  const moved=path.join(root,'Moved project');await cp(projectFolder,moved,{recursive:true});await choose([path.join(moved,'project.json')]);await page.getByRole('button',{name:'Open',exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('input[aria-label="Project name"]')?.value==='Garden club · synthetic test')
  assert.equal(await page.getByLabel('Total copies',{exact:true}).inputValue(),'20')
  await rm(path.join(moved,project.assets[0].path));await choose([path.join(moved,'project.json')]);await page.getByRole('button',{name:'Open',exact:true}).click();await page.getByRole('alert').filter({hasText:'missing or changed'}).waitFor()
  await choose([fixture]);await page.getByRole('button',{name:'Relink artwork',exact:true}).click();await page.getByRole('status').filter({hasText:'Artwork relinked'}).waitFor()
  assert.equal(await page.getByLabel('Total copies',{exact:true}).inputValue(),'20')
  await page.getByRole('button',{name:'Remove Slow mornings',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Remove artwork',exact:true}).click();assert.equal(await page.getByRole('button',{name:/Slow mornings.*7 copies/}).count(),0,'confirmed removal removes only the chosen design')
  assert.deepEqual(errors,[])
  await page.evaluate(()=>window.desktop.setDirty(false))
  console.log(JSON.stringify({passed:true,checks:['offline Geist font','dock pointer magnification','reduced motion','keyboard dock navigation','modal focus restoration','custom paper','removal cancel and confirm','import','orientation','quantities','invalid settings','portable save/open','missing source/relink','RGB PDF','CMYK PDF','PNG/JPG metadata','cancel cleanup','desktop and compact layouts','narrow fallback'],root},null,2))
}catch(error){const page=await app.firstWindow().catch(()=>null);if(page)await page.screenshot({animations:'disabled',path:path.join(screenshotDir,'smoke-failure.png')}).catch(()=>{});throw error}
finally{await app.evaluate(({dialog})=>{dialog.showMessageBoxSync=()=>1}).catch(()=>{});await app.close()}
