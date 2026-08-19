param([ValidateSet('up', 'down')] [string]$Action = 'up')

$ErrorActionPreference = 'Stop'

function Resolve-DockerCommand {
  $docker = Get-Command 'docker' -ErrorAction SilentlyContinue
  if ($docker) {
    return @{
      Executable = $docker.Source
      Prefix = @()
      PathStyle = 'windows'
    }
  }

  $dockerDesktopBin = Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin\docker.exe'
  if (Test-Path $dockerDesktopBin) {
    return @{
      Executable = $dockerDesktopBin
      Prefix = @()
      PathStyle = 'windows'
    }
  }

  $wslDistro = $env:AQUA_WSL_DISTRO
  $wslUser = $env:AQUA_WSL_USER
  if ($wslDistro -and $wslUser) {
    return @{
      Executable = 'wsl.exe'
      Prefix = @('-d', $wslDistro, '-u', $wslUser, '--', 'docker')
      PathStyle = 'wsl'
    }
  }
  if ($wslDistro) {
    return @{
      Executable = 'wsl.exe'
      Prefix = @('-d', $wslDistro, '--', 'docker')
      PathStyle = 'wsl'
    }
  }

  throw 'Docker CLI was not found. Install Docker Desktop, add Docker to PATH, or set AQUA_WSL_DISTRO/AQUA_WSL_USER for a WSL Docker CLI.'
}

function ConvertTo-WslPath([string]$windowsPath) {
  if ($windowsPath -notmatch '^([A-Za-z]):\\') { throw "Cannot map '$windowsPath' into the Ubuntu WSL filesystem." }
  $drive = $Matches[1].ToLower()
  $rest = $windowsPath.Substring(3).Replace('\', '/')
  return "/mnt/$drive/$rest"
}

$workerRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$compose = Join-Path $workerRoot 'compose.yml'
$dockerCommand = Resolve-DockerCommand
$composeForDocker = if ($dockerCommand.PathStyle -eq 'wsl') { ConvertTo-WslPath $compose } else { $compose }
$arguments = @($dockerCommand.Prefix) + @('compose', '-f', $composeForDocker)
if ($Action -eq 'up') { $arguments += @('up', '-d', '--wait', 'proof-server') }
if ($Action -eq 'down') { $arguments += @('stop', 'proof-server') }
& $dockerCommand.Executable @arguments
if ($LASTEXITCODE -ne 0) { throw "Proof server $Action failed." }
