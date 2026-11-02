import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import sharp from 'sharp'

const root=path.dirname(fileURLToPath(import.meta.url))
const ink='#101511',paper='#ffffff',muted='#626a64',line='#dce1dc'
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')
const p=(d,attrs='')=>`<path d="${d}" ${attrs}/>`
const rect=(x,y,width,height,extra='')=>`<rect x="${x}" y="${y}" width="${width}" height="${height}" ${extra}/>`
const group=(body,transform='')=>`<g${transform?` transform="${transform}"`:''}>${body}</g>`

// All lettering is hand-drawn geometry, including the lowercase suffix.
const D={
  soft:p('M0 0H51Q113 0 113 56Q113 112 51 112H0Z M28 25V87H49Q85 87 85 56Q85 25 49 25Z','fill-rule="evenodd"'),
  fold:p('M0 0H72L112 34V80L76 112H0Z M28 25V87H65L85 68V46L62 25Z','fill-rule="evenodd"'),
  inset:p('M0 0H52Q112 0 112 56Q112 112 52 112H0V78H27V88H49Q85 88 85 56Q85 24 49 24H27V57H0Z'),
  step:p('M0 0H68Q113 0 113 43V69Q113 112 68 112H0Z M27 26V86H63Q86 86 86 64V48Q86 26 63 26Z','fill-rule="evenodd"'),
}
const F={
  bridge:p('M0 0H82L111 17V39L76 25H28V49H90V73H28V112H0Z'),
  step:p('M0 0H110V26H28V48H77L92 72H28V112H0Z'),
  fold:p('M0 0H110L86 26H28V49H88L64 74H28V112H0Z'),
  rail:p('M0 0H112V25H27V47H91V72H27V112H0Z M74 0H83V25H74Z','fill-rule="evenodd"'),
}
const C={
  kerf:p('M108 13L91 36Q80 25 59 25Q26 25 26 56Q26 87 59 87Q80 87 91 76L108 99Q89 114 57 114Q0 114 0 56Q0 -2 57 -2Q89 -2 108 13Z')+p('M103 22L115 30L106 43L94 35Z'),
  slice:p('M101 16A56 56 0 1 0 108 80L83 68A29 29 0 1 1 81 39Z'),
  step:p('M112 0H35Q0 0 0 35V77Q0 112 35 112H112V85H40Q27 85 27 72V40Q27 27 40 27H89V47H112Z'),
  bevel:p('M108 12L95 37L80 26H43L26 43V69L43 86H80L95 75L108 100L90 112H30L0 82V30L30 0H90Z'),
  seam:p('M108 14L92 38Q78 24 57 24Q26 24 26 56Q26 88 57 88Q78 88 92 74L108 98Q88 114 56 114Q0 114 0 56Q0 -2 56 -2Q88 -2 108 14Z'),
}
const lower={
  u:p('M0 31H22V78Q22 94 36 94Q52 94 52 78V31H74V112H53V103Q44 115 28 115Q0 115 0 85Z'),
  t:p('M16 9H38V31H60V51H38V81Q38 94 51 94H61V112H44Q16 112 16 83V51H0V31H16Z'),
  s:p('M68 38L60 56Q47 48 35 48Q22 48 22 56Q22 61 36 64L48 67Q70 73 70 89Q70 115 35 115Q13 115 0 104L9 86Q22 96 35 96Q48 96 48 89Q48 84 34 81L23 78Q0 71 0 55Q0 30 34 30Q55 30 68 38Z'),
}
const concepts=[
  {id:'01',name:'Kerf',family:'Cut-paper ligatures',d:'soft',f:'bridge',c:'kerf',icon:'kerf',angle:0,note:'A small offcut makes the C feel freshly cut.'},
  {id:'02',name:'Foldline',family:'Cut-paper ligatures',d:'fold',f:'fold',c:'bevel',icon:'foldline',angle:0,note:'A folded strip becomes a continuous letter junction.'},
  {id:'03',name:'Offcut',family:'Cut-paper ligatures',d:'step',f:'step',c:'slice',icon:'offcut',angle:0,note:'An extracted corner is part of the identity.'},
  {id:'04',name:'Press',family:'Cut-paper ligatures',d:'step',f:'rail',c:'step',icon:'press',angle:0,note:'A compact die-cut block with a stepped counter.'},
  {id:'05',name:'Splice',family:'Interlocking forms',d:'inset',f:'bridge',c:'seam',icon:'splice',angle:0,note:'Two offset loops share one deliberate cutting gap.'},
  {id:'06',name:'Rail',family:'Interlocking forms',d:'soft',f:'rail',c:'step',icon:'rail',angle:0,note:'An F spine and a C return lock into one shape.'},
  {id:'07',name:'Ribbon',family:'Interlocking forms',d:'fold',f:'bridge',c:'kerf',icon:'ribbon',angle:7,note:'A rising paper ribbon folds into the initials.'},
  {id:'08',name:'Lift',family:'Interlocking forms',d:'inset',f:'fold',c:'bevel',icon:'lift',angle:0,note:'The lifted edge becomes the opening of the C.'},
  {id:'09',name:'Index',family:'Compact signatures',d:'soft',f:'step',c:'slice',icon:'index',angle:0,note:'An offset internal corner is the identifying cut.'},
  {id:'10',name:'Cipher',family:'Compact signatures',d:'fold',f:'rail',c:'step',icon:'cipher',angle:0,note:'A squared counter joins the D, F and C logic.'},
  {id:'11',name:'Relay',family:'Compact signatures',d:'step',f:'bridge',c:'bevel',icon:'relay',angle:0,note:'Two curved returns meet around a short F bar.'},
  {id:'12',name:'Hatch',family:'Compact signatures',d:'fold',f:'fold',c:'seam',icon:'hatch',angle:0,note:'A hinged cut through a chamfered outline.'},
  {id:'13',name:'Gauge',family:'Circular experiments',d:'soft',f:'step',c:'kerf',icon:'gauge',angle:0,note:'A button-sized disc with an offset gauge cut.'},
  {id:'14',name:'Roundel',family:'Circular experiments',d:'step',f:'rail',c:'slice',icon:'roundel',angle:0,note:'A curved strip folds inward to suggest the F.'},
  {id:'15',name:'Pocket',family:'Circular experiments',d:'inset',f:'bridge',c:'step',icon:'pocket',angle:0,note:'A pocket-shaped counter opens through the circle.'},
  {id:'16',name:'Shift',family:'Circular experiments',d:'soft',f:'fold',c:'bevel',icon:'shift',angle:5,note:'Two offset segments reveal a clean cutting channel.'},
]

function subtract(body,cuts,key){
  return `<defs><mask id="${key}" maskUnits="userSpaceOnUse" x="-24" y="-24" width="720" height="180">${rect(-24,-24,720,180,'fill="white"')}<g fill="black">${cuts}</g></mask></defs><g mask="url(#${key})">${body}</g>`
}
function wordmark(concept,key){
  const tail=concept.c==='step'?8:0
  const parts=D[concept.d]+group(F[concept.f],'translate(121 0)')+group(C[concept.c],'translate(247.7 -4.3) scale(1.077)')+group(lower.u,`translate(${370+tail} 0)`)+group(lower.t,`translate(${457+tail} 0)`)+group(lower.s,`translate(${530+tail} 0)`)
  return group(parts,concept.angle?`translate(20 0) skewX(-${concept.angle})`:'')
}
const solidD=p('M12 4H66Q116 4 116 56Q116 108 66 108H12Q4 108 4 100V12Q4 4 12 4Z')
const solidRound='<circle cx="56" cy="56" r="54"/>'
function mark(concept,key){
  switch(concept.icon){
    case 'kerf': return subtract(solidD,p('M31 27H84L93 44H50V55H77V73H50V91H31Z')+p('M75 55H123V73H75Z'),key)+p('M103 8L118 17L108 33L94 24Z')
    case 'foldline': return p('M8 4H77L112 37V108H42L8 76Z M34 30V65L53 84H86V49L65 30Z','fill-rule="evenodd"')+p('M34 49H91V67H34Z')
    case 'offcut': return subtract(solidRound,p('M42 28H119V84H42Q28 84 28 70V42Q28 28 42 28Z')+p('M-2 -2H29L-2 29Z'),key)+p('M3 -6H26L3 17Z')
    case 'press': return subtract(p('M0 8H80L112 38V104H32L0 75Z'),p('M27 30H69L86 46V78H60V66H45V87H27Z')+rect(59,46,60,18),key)
    case 'splice': return p('M4 20Q4 4 20 4H68V28H30V84H69V108H20Q4 108 4 92Z')+p('M49 4H86Q116 4 116 34V78Q116 108 86 108H49V84H82Q92 84 92 74V38Q92 28 82 28H49Z')+rect(29,46,52,20)
    case 'rail': return p('M7 3H74V27H31V47H68V69H31V109H7Z')+p('M78 3Q118 3 118 42V74Q118 109 78 109H49V85H75Q94 85 94 69V43Q94 27 78 27Z')
    case 'ribbon': return p('M5 27L82 2L112 25L83 36L39 21L31 47L83 31L105 49L24 76L13 111L-7 94L15 30Z')+p('M62 58L107 43V78L73 109H38L46 85H65L84 68V51Z')
    case 'lift': return p('M4 8H82L111 37V103H79V49L67 34H31V79H64V103H4Z')+p('M44 48H105V70H44Z M85 1L112 28H85Z')
    case 'index': return subtract(p('M15 4H68Q116 4 116 56Q116 108 68 108H15Q3 108 3 96V16Q3 4 15 4Z'),p('M29 29H82V49H50V60H75V80H50V98H29Z')+rect(73,60,49,20),key)
    case 'cipher': return subtract(p('M0 2H85L114 31V83L85 112H0Z'),p('M26 27H74L89 42V58H49V85H26Z')+rect(47,56,72,20)+rect(72,83,18,30),key)
    case 'relay': return p('M5 36Q5 4 38 4H76V28H42Q29 28 29 41V84H5Z')+p('M112 78Q112 110 79 110H41V86H75Q88 86 88 73V30H112Z')+rect(29,46,59,22)
    case 'hatch': return subtract(p('M29 0H91L117 27V90L91 116H29L3 90V27Z'),p('M30 29H81L92 40V58H54V88H30Z')+p('M75 53L125 53V73H75Z')+p('M1 87L29 116H1Z'),key)
    case 'gauge': return subtract(solidRound,p('M30 22H87V43H51V56H78V77H51V99H30Z')+p('M76 56H119V77H76Z'),key)+rect(77,6,9,10)
    case 'roundel': return p('M106 26A55 55 0 1 0 106 86L84 73A30 30 0 1 1 84 39Z')+p('M39 31H76V51H59V65H84V85H39Z')
    case 'pocket': return subtract(solidRound,p('M29 27H82L97 43V76H61L50 93H29Z')+rect(59,49,59,17),key)+p('M31 30H51V52H31Z')
    case 'shift': return group(subtract(solidRound,p('M-5 73L122 31V43L-5 85Z')+p('M31 25H83V46H52V60H76V80H52V104H31Z'),key),'translate(4 0)')
    default: throw new Error('Unknown mark')
  }
}
function svg(body,viewBox,title,description,fill=ink){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${viewBox.split(' ')[2]}" height="${viewBox.split(' ')[3]}" viewBox="${viewBox}" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">${esc(description)}</desc><g fill="${fill}">${body}</g></svg>\n`
}
const markBox='-12 -16 144 144',wordBox='-12 -12 650 144'
const markSvg=(concept,fill=ink,key='mark-'+concept.id)=>svg(mark(concept,key),markBox,`DFCuts ${concept.name} mark`,concept.note,fill)
const wordSvg=(concept,fill=ink,key='word-'+concept.id)=>svg(wordmark(concept,key),wordBox,`DFCuts ${concept.name} wordmark`,`${concept.note} Custom outlined DFCuts lettering.`,fill)
function text(x,y,value,size=20,color=ink,weight=400,extra=''){
  return `<text x="${x}" y="${y}" fill="${color}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="${weight}" xml:space="preserve" ${extra}>${esc(value)}</text>`
}
function cell(concept,x,y,width=600,height=360,prefix='board'){
  const key=prefix+'-'+concept.id
  return group(
    rect(0,0,width,height,`fill="${paper}"`)+
    text(26,36,concept.id,15,muted,600)+text(66,36,concept.name,21,ink,650)+
    group(mark(concept,key+'-mark'),'translate(32 103) scale(1.04)')+
    group(wordmark(concept,key+'-word'),'translate(214 133) scale(.57)')+
    text(28,286,concept.family.toUpperCase(),12,muted,600,'letter-spacing="1.4"')+
    text(28,318,concept.note,15,muted),`translate(${x} ${y})`)
}
function sheet(){
  const width=2484,height=1650
  const body=rect(0,0,width,height,'fill="#eff1ed"')+text(36,56,'DFCuts / original logo directions',32,ink,650)+text(36,91,'16 new constructions: folded stock, extracted corners, interlocking letters and cutting channels.',19,muted)+
    concepts.map((concept,i)=>cell(concept,24+(i%4)*612,122+Math.floor(i/4)*378)).join('')+
    text(36,1630,'Editable SVG paths • Transparent masters + rendered PNGs • Monochrome first',16,muted)
  return svg(body,`0 0 ${width} ${height}`,'DFCuts — sixteen logo concepts','Comparison sheet of sixteen original vector logo directions.',ink)
}
function shortlist(){
  const selected=['01','07','11','16'].map(id=>concepts.find(concept=>concept.id===id)),width=1600,height=1190
  let body=rect(0,0,width,height,'fill="#eff1ed"')+text(36,58,'Four original starting points',32,ink,650)+text(36,92,'01 / extracted corner       07 / folded ribbon       11 / interlocking returns       16 / shifted disc',18,muted)
  for(const [i,concept] of selected.entries()){
    const x=24+(i%2)*788,y=124+Math.floor(i/2)*520,key='short-'+concept.id
    body+=group(rect(0,0,764,496,'fill="white"')+text(28,43,`${concept.id} / ${concept.name}`,24,ink,650)+
      group(mark(concept,key+'m'),'translate(54 100) scale(1.45)')+group(wordmark(concept,key+'w'),'translate(274 153) scale(.72)')+
      rect(24,318,716,150,'fill="#101511" rx="6"')+group(mark(concept,key+'r'),'translate(45 347) scale(.78)')+
      group(wordmark(concept,key+'wr'),'translate(177 365) scale(.84)')+text(280,269,concept.note,15,muted),`translate(${x} ${y})`)
    // Reverse marks use white paint; masks remain black/white luminance masks.
    body=body.replace(`<g transform="translate(45 347) scale(.78)">`,`<g fill="white" transform="translate(45 347) scale(.78)">`).replace(`<g transform="translate(177 365) scale(.84)">`,`<g fill="white" transform="translate(177 365) scale(.84)">`)
  }
  return svg(body,`0 0 ${width} ${height}`,'DFCuts — four starting directions','Four directions shown in positive and reverse applications.',ink)
}
function smallSizes(){
  const width=1600,height=970
  let body=rect(0,0,width,height,'fill="white"')+text(32,49,'Small-size proof',30,ink,650)+text(32,81,'Every mark at 64, 32, 24 and 16 pixels. Judge the silhouette before the detail.',18,muted)
  concepts.forEach((concept,i)=>{
    const x=30+(i%4)*397,y=119+Math.floor(i/4)*208
    body+=text(x,y+22,`${concept.id} / ${concept.name}`,19,ink,650)
    let dx=0
    for(const size of [64,32,24,16]){
      body+=group(group(mark(concept,`proof-${concept.id}-${size}`),'translate(12 16)'),`translate(${x+dx} ${y+57}) scale(${size/144})`)+text(x+dx,y+155,String(size),13,muted)
      dx+=90
    }
    body+=p(`M${x} ${y+181}h365`,`fill="none" stroke="${line}"`)
  })
  return svg(body,`0 0 ${width} ${height}`,'DFCuts — small-size logo proof','Sixteen mark concepts tested at four raster sizes.',ink)
}
async function render(content,file,width){
  await sharp(Buffer.from(content),{density:216}).resize({width}).png({compressionLevel:9}).toFile(file)
}
async function verify(file,transparent=true){
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  let opaque=0,clear=0,minX=info.width,minY=info.height,maxX=-1,maxY=-1
  const alphaBytes=Buffer.alloc(info.width*info.height)
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
    const alpha=data[(y*info.width+x)*4+3]
    alphaBytes[y*info.width+x]=alpha
    if(!alpha)clear++
    if(alpha>16){opaque++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
  }
  assert.ok(opaque>info.width*info.height*.02,`Empty render: ${file}`)
  if(transparent){assert.ok(clear>info.width*info.height*.1,`Transparency missing: ${file}`);assert.ok(minX>0&&minY>0&&maxX<info.width-1&&maxY<info.height-1,`Artwork clipped: ${file}`)}
  return {width:info.width,height:info.height,bounds:[minX,minY,maxX,maxY],alphaHash:createHash('sha256').update(alphaBytes).digest('hex')}
}

await mkdir(root,{recursive:true})
const manifest=[]
for(const concept of concepts){
  const folder=path.join(root,`${concept.id}-${concept.name.toLowerCase()}`)
  await mkdir(folder,{recursive:true})
  const markMaster=markSvg(concept),wordMaster=wordSvg(concept)
  assert.ok(!/<(?:text|image)\b/.test(markMaster+wordMaster),'Logo masters must use vector paths, not font or raster dependencies.')
  await Promise.all([
    writeFile(path.join(folder,'mark.svg'),markMaster),writeFile(path.join(folder,'wordmark.svg'),wordMaster),
    writeFile(path.join(folder,'mark-reversed.svg'),markSvg(concept,'#ffffff')),
    writeFile(path.join(folder,'wordmark-reversed.svg'),wordSvg(concept,'#ffffff')),
    render(markMaster,path.join(folder,'mark.png'),1024),render(wordMaster,path.join(folder,'wordmark.png'),2600),
    render(markSvg(concept,'#ffffff'),path.join(folder,'mark-reversed.png'),1024),
    render(wordSvg(concept,'#ffffff'),path.join(folder,'wordmark-reversed.png'),2600),
  ])
  const markInfo=await verify(path.join(folder,'mark.png')),wordInfo=await verify(path.join(folder,'wordmark.png'))
  const reverseMark=await verify(path.join(folder,'mark-reversed.png')),reverseWord=await verify(path.join(folder,'wordmark-reversed.png'))
  assert.equal(markInfo.alphaHash,reverseMark.alphaHash,'Positive and reverse mark silhouettes must match.')
  assert.equal(wordInfo.alphaHash,reverseWord.alphaHash,'Positive and reverse wordmark silhouettes must match.')
  manifest.push({...concept,folder:path.basename(folder),mark:markInfo,wordmark:wordInfo})
}
assert.equal(new Set(manifest.map(concept=>concept.mark.alphaHash)).size,16,'Every symbol must have a different silhouette.')
assert.equal(new Set(manifest.map(concept=>concept.wordmark.alphaHash)).size,16,'Every wordmark must have a different silhouette.')
for(const [name,content,width] of [['all-concepts',sheet(),2484],['shortlist',shortlist(),1600],['small-size-proof',smallSizes(),1600]]){
  await writeFile(path.join(root,name+'.svg'),content);await render(content,path.join(root,name+'.png'),width);await verify(path.join(root,name+'.png'),false)
}
await writeFile(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n')
await writeFile(path.join(root,'gallery.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DFCuts — 16 SVG logo concepts</title><style>body{margin:0;padding:32px;background:#eff1ed;color:#101511;font:16px/1.5 'Segoe UI',sans-serif}header{max-width:1120px;margin:0 auto 32px}h1{font-size:32px;letter-spacing:-.03em;margin:0 0 8px}p{color:#626a64}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:20px;max-width:1600px;margin:auto}article{background:white;padding:24px;min-width:0;border-radius:8px}h2{font-size:20px;margin:0 0 16px}.pair{display:flex;gap:24px;align-items:center;min-height:160px}.mark{width:100px;height:110px}.word{width:calc(100% - 124px);min-width:0}.reverse{background:#101511;padding:20px;margin:16px 0;border-radius:4px}.reverse img{width:100%;height:64px}.proof{display:flex;align-items:center;gap:24px;margin:24px 0}a{color:inherit;text-underline-offset:4px;margin-right:16px}a:focus-visible{outline:3px solid #49624f;outline-offset:4px}.note{min-height:48px;font-size:14px}footer{max-width:1600px;margin:32px auto}@media(max-width:500px){body{padding:16px}main{grid-template-columns:1fr}article{padding:18px}}</style><header><h1>DFCuts / logo explorations</h1><p>16 original vector constructions based on folded stock, cutting channels, extracted corners and interlocking initials. Every wordmark is outlined; SVG files have transparent backgrounds.</p><a href="all-concepts.png">Comparison sheet</a><a href="shortlist.png">Four starting directions</a><a href="small-size-proof.png">Small-size proof</a></header><main>${concepts.map(concept=>{const folder=manifest.find(item=>item.id===concept.id).folder;return `<article><h2>${concept.id} / ${concept.name}</h2><div class="pair"><img class="mark" src="${folder}/mark.svg" alt="${concept.name} monogram"><img class="word" src="${folder}/wordmark.svg" alt="DFCuts ${concept.name} wordmark"></div><div class="reverse"><img src="${folder}/wordmark-reversed.svg" alt="${concept.name} in white on dark"></div><div class="proof">${[48,32,24,16].map(size=>`<img width="${size}" src="${folder}/mark.svg" alt="${size} pixel mark">`).join('')}</div><p class="note">${esc(concept.note)}</p><a href="${folder}/mark.svg" download>Mark SVG</a><a href="${folder}/wordmark.svg" download>Wordmark SVG</a><a href="${folder}/wordmark.png" download>PNG</a></article>`}).join('')}</main><footer><p>Made as editable vector concepts. Application icons and app branding have not been replaced.</p></footer></html>`)
console.log(`Generated and checked ${concepts.length} concepts: 64 SVG masters, 64 transparent PNGs, 3 comparison sheets, and the HTML gallery. Reverse silhouettes match the positive masters.`)
