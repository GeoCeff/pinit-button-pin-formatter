import { createHash } from 'node:crypto'
import { copyFile, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const built = path.resolve('release/dfCuts.exe')
const destination = path.resolve('../dfCuts.exe')

await copyFile(built, destination)
const info = await stat(destination)
const hash = createHash('sha256').update(await readFile(destination)).digest('hex')
const mb = (info.size / (1024 * 1024)).toFixed(2)

console.log(`Published portable executable: ${destination} (${mb} MB, SHA-256: ${hash})`)
