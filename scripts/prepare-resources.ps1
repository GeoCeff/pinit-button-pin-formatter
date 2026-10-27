$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$archivePath = Join-Path $projectRoot 'local-data/gs10080w64.exe'
$runtimePath = Join-Path $projectRoot 'resources/ghostscript'
$expectedHash = 'CB3ECC798508851BA28B05E3FB914DDEFE78168190726376D8581546CE61D5B216FFA3359E6F829072786BC12350501C7B6F99110D578696B87213D157774269'
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $archivePath) | Out-Null
if (-not (Test-Path -LiteralPath $archivePath)) {
  Invoke-WebRequest -Uri 'https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10080/gs10080w64.exe' -OutFile $archivePath
}
if ((Get-FileHash -LiteralPath $archivePath -Algorithm SHA512).Hash -ne $expectedHash) { throw 'Ghostscript archive checksum mismatch.' }
$extractorPath = Join-Path $projectRoot 'node_modules/electron-winstaller/vendor/7z-x64.exe'
& $extractorPath x $archivePath "-o$runtimePath" 'bin/*' 'iccprofiles/*' 'lib/*' 'Resource/*' 'doc/*' 'vcredist_x64.exe' -y
if ($LASTEXITCODE -ne 0) { throw 'Ghostscript extraction failed.' }
@'
Ghostscript 10.08.0 is an unmodified Artifex AGPL distribution.
License: COPYING in this directory (GNU Affero General Public License v3).
Corresponding source: https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10080/ghostpdl-10.08.0.tar.xz
Upstream release: https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/tag/gs10080
ICC profiles retain the notices in the distribution documentation.
'@ | Set-Content -LiteralPath (Join-Path $runtimePath 'doc/Source-availability.txt') -Encoding utf8
& (Join-Path $runtimePath 'bin/gswin64c.exe') --version
if ($LASTEXITCODE -ne 0) { throw 'Ghostscript runtime verification failed.' }
