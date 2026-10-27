import { promises as fs } from 'node:fs'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import sharp from 'sharp'
import { LIMITS, type Asset } from '../src/core/model'
import type { Imported } from '../src/bridge'

export interface StoredImage { asset: Asset; original: Buffer; source: string }
export const images = new Map<string, StoredImage>()
export const profiles = new Map<string, Buffer>()
export function isInside(root: string, target: string): boolean {
  const relative = path.relative(root, target)
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative)
}
export async function containedFile(root: string, relative: string): Promise<string> {
  const realRoot = await fs.realpath(root); const actual = await fs.realpath(path.resolve(root,relative))
  if (!isInside(realRoot, actual)) throw new Error('Project asset points outside its folder. Copy the source into assets/ and relink it.')
  return actual
}
export async function boundedRead(file: string, max: number): Promise<Buffer> {
  const handle = await fs.open(file,'r')
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size > max) throw new Error('File exceeds the supported size or is not a regular file.')
    const data = Buffer.alloc(stat.size)
    let offset = 0
    while (offset < data.length) { const { bytesRead } = await handle.read(data,offset,data.length-offset,offset); if (!bytesRead) throw new Error('File changed while reading. Try again.'); offset += bytesRead }
    return data
  } finally { await handle.close() }
}
export async function atomicWrite(file: string, data: string | Buffer): Promise<void> {
  const temporary = `${file}.${randomUUID()}.tmp`
  try { await fs.writeFile(temporary,data,{flag:'wx'}); await fs.rename(temporary,file) }
  finally { await fs.rm(temporary,{force:true}) }
}
export function checkProfile(bytes: Buffer): void {
  if (bytes.length < 128 || bytes.length > 16 * 1024 * 1024 || bytes.toString('ascii',36,40) !== 'acsp' || bytes.toString('ascii',16,20) !== 'CMYK' || bytes.readUInt32BE(0) !== bytes.length || !['prtr','spac'].includes(bytes.toString('ascii',12,16))) throw new Error('Choose a valid CMYK output ICC profile (not a device-link profile), at most 16 MB.')
}
export async function decodeImage(bytes: Buffer, name: string, existing?: Asset): Promise<Imported> {
  const png = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (!png && !jpg) throw new Error('Only PNG and JPEG artwork is supported. The file signature did not match.')
  const decoded = await sharp(bytes,{limitInputPixels:LIMITS.pixels, animated:false}).rotate().toColourspace('srgb').png().toBuffer({resolveWithObject:true})
  const id = existing?.id ?? randomUUID()
  const asset: Asset = { id, kind: png ? 'png' : 'jpg', path:`assets/${id}.${png ? 'png' : 'jpg'}`, width:decoded.info.width, height:decoded.info.height }
  if (existing && (existing.width !== asset.width || existing.height !== asset.height || existing.kind !== asset.kind)) throw new Error('An image no longer matches the saved source dimensions. Relink it to keep the saved edits.')
  let total = bytes.length + decoded.data.length
  let pixelTotal = asset.width * asset.height
  for (const entry of images.values()) if (entry.asset.id !== id) { total += entry.original.length + entry.source.length * 0.75; pixelTotal += entry.asset.width * entry.asset.height }
  if (total > LIMITS.rasterBytes || pixelTotal * 4 > LIMITS.rasterBytes) throw new Error('Imported artwork exceeds the 256 MB session budget. Start a new project or use smaller source images.')
  const source = `data:image/png;base64,${decoded.data.toString('base64')}`
  const edge=await sharp(decoded.data).resize(24,24,{fit:'fill'}).ensureAlpha().raw().toBuffer()
  const channels:[number[],number[],number[]]=[[],[],[]]
  for(let y=0;y<24;y++)for(let x=0;x<24;x++)if(x===0||y===0||x===23||y===23){const i=(y*24+x)*4;if(edge[i+3]>=128)for(let c=0;c<3;c++)channels[c].push(edge[i+c])}
  const suggestedFill=channels[0].length?'#'+channels.map(values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)].toString(16).padStart(2,'0')).join(''):'#ffffff'
  images.set(id,{asset,original:bytes,source})
  return { asset, source, suggestedFill, name:path.parse(name).name.slice(0,200) }
}
