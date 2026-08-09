$ErrorActionPreference = 'Stop'

function ConvertTo-WslPath([string]$windowsPath) {
  if ($windowsPath -notmatch '^([A-Za-z]):\\') { throw "Cannot map '$windowsPath' into the Ubuntu WSL filesystem." }
  $drive = $Matches[1].ToLower()
  $rest = $windowsPath.Substring(3).Replace('\', '/')
  return "/mnt/$drive/$rest"
}

$workerRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backendRoot = (Resolve-Path (Join-Path $workerRoot '..')).Path
$source = Join-Path $backendRoot 'contracts\aqua-reserve-snapshot.compact'
$output = Join-Path $workerRoot 'contracts\managed\aqua-reserve-snapshot'
$wslSource = ConvertTo-WslPath $source
$wslOutput = ConvertTo-WslPath $output

wsl.exe -d Ubuntu -u aniket -- bash -lc "mkdir -p '$wslOutput'; compact compile '$wslSource' '$wslOutput'"
if ($LASTEXITCODE -ne 0) { throw 'Compact compilation failed.' }

if (-not (Test-Path (Join-Path $output 'contract\index.js'))) { throw 'Compact did not produce the contract module.' }
Write-Host "Aqua Reserve Compact artifacts are ready at $output"
