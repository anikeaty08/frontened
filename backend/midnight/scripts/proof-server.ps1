param([ValidateSet('up', 'down')] [string]$Action = 'up')

$ErrorActionPreference = 'Stop'

function ConvertTo-WslPath([string]$windowsPath) {
  if ($windowsPath -notmatch '^([A-Za-z]):\\') { throw "Cannot map '$windowsPath' into the Ubuntu WSL filesystem." }
  $drive = $Matches[1].ToLower()
  $rest = $windowsPath.Substring(3).Replace('\', '/')
  return "/mnt/$drive/$rest"
}

$workerRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$compose = Join-Path $workerRoot 'compose.yml'
$wslCompose = ConvertTo-WslPath $compose
$arguments = @('compose', '-f', $wslCompose)
if ($Action -eq 'up') { $arguments += @('up', '-d', '--wait', 'proof-server') }
if ($Action -eq 'down') { $arguments += @('stop', 'proof-server') }
& wsl.exe -d Ubuntu -u aniket -- docker @arguments
if ($LASTEXITCODE -ne 0) { throw "Proof server $Action failed." }
