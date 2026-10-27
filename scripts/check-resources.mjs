import { access, readFile } from 'node:fs/promises'
const files=['bin/gswin64c.exe','bin/gsdll64.dll','iccprofiles/default_cmyk.icc','doc/COPYING','doc/Source-availability.txt','vcredist_x64.exe']
for(const file of files)await access(`resources/ghostscript/${file}`).catch(()=>{throw new Error(`Missing offline resource: ${file}. Run scripts/prepare-resources.ps1 before packaging.`)})
const profile=await readFile('resources/ghostscript/iccprofiles/default_cmyk.icc')
if(profile.toString('ascii',36,40)!=='acsp'||profile.toString('ascii',16,20)!=='CMYK')throw new Error('Invalid bundled CMYK profile.')
console.log('Offline CMYK runtime, profile, license and source notice are present.')
