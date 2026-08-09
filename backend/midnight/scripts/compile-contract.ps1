$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$source = Join-Path $repoRoot 'contracts\aqua-reserve-snapshot.compact'
$output = Join-Path $repoRoot 'midnight\contracts\managed\aqua-reserve-snapshot'

wsl.exe -d Ubuntu -u aniket -- bash -lc "mkdir -p /mnt/c/Users/anike/Desktop/aqua/midnight/contracts/managed; compact compile /mnt/c/Users/anike/Desktop/aqua/contracts/aqua-reserve-snapshot.compact /mnt/c/Users/anike/Desktop/aqua/midnight/contracts/managed/aqua-reserve-snapshot"
if ($LASTEXITCODE -ne 0) { throw 'Compact compilation failed.' }

if (-not (Test-Path (Join-Path $output 'contract\index.js'))) { throw 'Compact did not produce the contract module.' }
Write-Host "Aqua Reserve Compact artifacts are ready at $output"
