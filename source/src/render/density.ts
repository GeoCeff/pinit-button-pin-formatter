// Canvas encoders default to 96 DPI. Replace density metadata at the encoding boundary.
const table = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
function crc(bytes: Uint8Array): number { let c = 0xffffffff; for (const b of bytes) c = table[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
export function setPngDensity(bytes: Uint8Array, dpi: number): Uint8Array {
  const chunk = new Uint8Array(21); const view = new DataView(chunk.buffer)
  view.setUint32(0, 9); chunk.set([112,72,89,115], 4)
  view.setUint32(8, Math.round(dpi / 0.0254)); view.setUint32(12, Math.round(dpi / 0.0254)); chunk[16] = 1; view.setUint32(17, crc(chunk.subarray(4, 17)))
  // IHDR must remain the first chunk in a PNG.
  const parts: Uint8Array[] = [bytes.subarray(0, 33), chunk]
  let offset = 33
  while (offset < bytes.length) {
    const size = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0) + 12
    if (String.fromCharCode(...bytes.subarray(offset + 4, offset + 8)) !== 'pHYs') parts.push(bytes.subarray(offset, offset + size))
    offset += size
  }
  const result = new Uint8Array(parts.reduce((n,p) => n + p.length, 0)); offset = 0
  for (const part of parts) { result.set(part, offset); offset += part.length }
  return result
}
export function setJpgDensity(bytes: Uint8Array, dpi: number): Uint8Array {
  const density = Math.max(1, Math.round(dpi))
  const app0 = new Uint8Array([255,224,0,16,74,70,73,70,0,1,2,1,density >> 8,density & 255,density >> 8,density & 255,0,0])
  let start = 2
  if (bytes[2] === 255 && bytes[3] === 224) start = 4 + ((bytes[4] << 8) | bytes[5])
  const out = new Uint8Array(2 + app0.length + bytes.length - start)
  out.set(bytes.subarray(0,2)); out.set(app0,2); out.set(bytes.subarray(start), 2 + app0.length)
  return out
}
