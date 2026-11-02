import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import sharp from 'sharp'

const root=path.dirname(fileURLToPath(import.meta.url))
const concepts=path.join(root,'../dfcuts-logo-concepts')
const ink='#101511'
const sourceMark=await readFile(path.join(concepts,'06-rail/mark.svg'),'utf8')
const sourceWord=await readFile(path.join(concepts,'16-shift/wordmark.svg'),'utf8')
function artwork(svg){const match=svg.match(/<g fill="#101511">([\s\S]*)<\/g>\s*<\/svg>/);assert.ok(match,'Expected an outlined source SVG.');return match[1]}
const mark=artwork(sourceMark),word=artwork(sourceWord)
const primary=`<g transform="translate(20 -6.72) scale(1.12)">${mark}</g><g transform="translate(178 0)">${word}</g>`
const stacked=`<g transform="translate(160 20) scale(1.6)">${mark}</g><g transform="translate(25.7 230) scale(.75)">${word}</g>`
function svg(body,box,title,color=ink){
  const [, ,width,height]=box.split(' ')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${box}" role="img" aria-labelledby="title desc"><title id="title">${title}</title><desc id="desc">Selected DFCuts identity: icon 06 Rail with the exact outlined wordmark from 16 Shift.</desc><g fill="${color}">${body}</g></svg>\n`
}
async function render(content,file,width){await sharp(Buffer.from(content),{density:216}).resize({width}).png({compressionLevel:9}).toFile(path.join(root,file))}
async function check(file){
  const {data,info}=await sharp(path.join(root,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  const alpha=Buffer.alloc(info.width*info.height)
  let left=info.width,top=info.height,right=-1,bottom=-1,clear=0
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
    const a=data[(y*info.width+x)*4+3];alpha[y*info.width+x]=a
    if(!a)clear++
    if(a>16){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}
  }
  assert.ok(clear>alpha.length*.1,'Expected a transparent background.')
  assert.ok(left>0&&top>0&&right<info.width-1&&bottom<info.height-1,'The logo must not touch or cross the canvas edge.')
  return {width:info.width,height:info.height,bounds:[left,top,right,bottom],alphaHash:createHash('sha256').update(alpha).digest('hex')}
}
await mkdir(root,{recursive:true})
// Preserve the selected individual SVG and PNG exports byte for byte.
for(const [source,stem] of [['06-rail','mark'],['16-shift','wordmark']]){
  for(const suffix of ['', '-reversed'])for(const extension of ['svg','png']){
    const filename=stem+suffix+'.'+extension
    await copyFile(path.join(concepts,source,filename),path.join(root,filename))
    assert.ok((await readFile(path.join(root,filename))).equals(await readFile(path.join(concepts,source,filename))))
  }
}
const outputs={}
for(const [name,body,box,width] of [['logo',primary,'0 -24 824 160',3200],['stacked',stacked,'0 0 520 350',1600]]){
  for(const [suffix,color] of [['',ink],['-reversed','#ffffff']]){
    const content=svg(body,box,`DFCuts ${name==='logo'?'horizontal':'stacked'} logo`,color)
    assert.ok(content.includes(mark)&&content.includes(word),'Both selected vector constructions must be preserved.')
    assert.ok(!/<(?:image|text)\b/.test(content),'The logo must have no embedded image or font dependency.')
    await writeFile(path.join(root,name+suffix+'.svg'),content)
    await render(content,name+suffix+'.png',width)
    outputs[name+suffix]=await check(name+suffix+'.png')
  }
  assert.equal(outputs[name].alphaHash,outputs[name+'-reversed'].alphaHash,'Positive and reversed silhouettes must match.')
}
const label=(x,y,value,size=18,color='#626a64',weight=400)=>`<text x="${x}" y="${y}" fill="${color}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="${weight}">${value}</text>`
const preview=`<rect width="1400" height="800" fill="#eff1ed"/>${label(32,49,'DFCuts / Rail + Shift',28,ink,650)}${label(32,79,'Your selection: icon 06 + wordmark 16. Original lettering and icon geometry preserved.',17)}<rect x="24" y="102" width="1352" height="278" fill="white"/><g transform="translate(88 121) scale(1.5) translate(0 24)">${primary}</g><rect x="24" y="402" width="1352" height="278" fill="${ink}"/><g fill="white" transform="translate(88 421) scale(1.5) translate(0 24)">${primary}</g>${label(32,733,'Editable SVG paths + transparent PNG exports',18)}${label(32,764,'Horizontal logo · stacked logo · separate symbol · separate wordmark',16)}`
await writeFile(path.join(root,'preview.svg'),svg(preview,'0 0 1400 800','DFCuts selected logo preview'))
await render(svg(preview,'0 0 1400 800','DFCuts selected logo preview'),'preview.png',1400)
await writeFile(path.join(root,'manifest.json'),JSON.stringify({selection:{icon:'06 Rail',wordmark:'16 Shift'},outputs},null,2)+'\n')
console.log('Built Rail + Shift logo. Selected source files are unchanged; lockups, transparency, margins, and reversed silhouettes checked.')
