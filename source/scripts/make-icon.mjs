import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'

const sizes = [16, 32, 48, 64, 128, 256]
const frames = await Promise.all(
  sizes.map(size => sharp('resources/icon.svg').resize(size, size).png().toBuffer())
)

// Keep 256x256 PNG for window/app icon usage.
await writeFile('resources/icon.png', frames[frames.length - 1])

const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)

const entries = []
let offset = 6 + sizes.length * 16
for (let i = 0; i < sizes.length; i++) {
  const size = sizes[i]
  const png = frames[i]
  const entry = Buffer.alloc(16)
  entry.writeUInt8(size === 256 ? 0 : size, 0)
  entry.writeUInt8(size === 256 ? 0 : size, 1)
  entry.writeUInt8(0, 2)
  entry.writeUInt8(0, 3)
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(offset, 12)
  entries.push(entry)
  offset += png.length
}

await writeFile('resources/icon.ico', Buffer.concat([header, ...entries, ...frames]))
console.log(`Generated resources/icon.png and multi-size resources/icon.ico (${sizes.join(', ')} px).`)
