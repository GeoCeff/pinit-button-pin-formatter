import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { atomicWrite, checkProfile, containedFile, decodeImage, images, isInside } from './files'
import { setJpgDensity, setPngDensity } from '../src/render/density'
import { PDFDocument } from 'pdf-lib'
import { verifyPdf } from './color'
import { mmToPt } from '../src/core/model'
describe('files and output boundaries',()=>{
  it('does not confuse sibling folders with contained paths',()=>{expect(isInside(path.resolve('work'),path.resolve('work','assets','a.png'))).toBe(true);expect(isInside(path.resolve('work'),path.resolve('work-other','a.png'))).toBe(false);expect(isInside(path.resolve('work'),path.resolve('work','..','a.png'))).toBe(false)})
  it('rejects project assets that escape through a linked directory',async()=>{
    const root=await mkdtemp(path.join(os.tmpdir(),'pinit-test-'))
    try {
      const project=path.join(root,'project');const outside=path.join(root,'outside')
      await mkdir(project);await mkdir(outside)
      await writeFile(path.join(project,'inside.png'),'inside');await writeFile(path.join(outside,'source.png'),'outside')
      await symlink(outside,path.join(project,'assets'),process.platform==='win32'?'junction':'dir')
      await expect(containedFile(project,'inside.png')).resolves.toBe(await realpath(path.join(project,'inside.png')))
      await expect(containedFile(project,'assets/source.png')).rejects.toThrow(/outside its folder/)
      expect(await readFile(path.join(outside,'source.png'),'utf8')).toBe('outside')
    } finally {
      if(!isInside(path.resolve(os.tmpdir()),path.resolve(root))||!path.basename(root).startsWith('pinit-test-'))throw new Error('Invalid test temp directory')
      await rm(root,{recursive:true,force:true})
    }
  })
  it('writes complete replacements and preserves original imported bytes',async()=>{
    const root=await mkdtemp(path.join(os.tmpdir(),'pinit-test-'))
    try{const file=path.join(root,'project.json');await atomicWrite(file,'old');await atomicWrite(file,'new');expect(await readFile(file,'utf8')).toBe('new')}
    finally{if(!path.basename(root).startsWith('pinit-test-'))throw new Error('Invalid test temp directory');await rm(root,{recursive:true,force:true})}
    const bytes=await sharp({create:{width:80,height:40,channels:3,background:'#d05539'}}).jpeg().withMetadata({orientation:6}).toBuffer();const imported=await decodeImage(bytes,'synthetic.jpg');expect(imported.asset.width).toBe(40);expect(imported.asset.height).toBe(80);expect(images.get(imported.asset.id)?.original.equals(bytes)).toBe(true);images.clear()
    await expect(decodeImage(Buffer.from('<svg/>'),'fake.png')).rejects.toThrow(/signature/)
  })
  it('writes PNG and JPEG resolution metadata without changing pixel geometry',async()=>{
    const input=sharp({create:{width:128,height:256,channels:3,background:'#315e4c'}})
    const png=setPngDensity(await input.clone().png().toBuffer(),300)
    const jpg=setJpgDensity(await input.clone().jpeg().toBuffer(),600)
    expect(await sharp(png).metadata()).toMatchObject({width:128,height:256,density:300,format:'png'})
    expect(await sharp(jpg).metadata()).toMatchObject({width:128,height:256,density:600,format:'jpeg'})
  })
  it('rejects wrong PDF geometry and mislabeled CMYK artwork',async()=>{
    const pdf=await PDFDocument.create();pdf.addPage([mmToPt(210),mmToPt(297)]);const bytes=await pdf.save()
    await expect(verifyPdf(bytes,210,297,1,false)).resolves.toBeUndefined()
    await expect(verifyPdf(bytes,211,297,1,false)).rejects.toThrow(/geometry/)
    await expect(verifyPdf(bytes,210,297,1,true)).rejects.toThrow(/no converted artwork/)
    expect(()=>checkProfile(Buffer.alloc(128))).toThrow(/CMYK/)
  })
})
