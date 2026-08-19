$ErrorActionPreference = 'Stop'

# This runner has one intentional side effect: it publishes and attests exactly
# one synthetic Phase 1 snapshot. Wallet sync happens once inside the API-owned
# warm lifecycle worker so the deployment does not pay for a separate pre-sync.
$projectRoot = Split-Path -Parent $PSScriptRoot
$workerRoot = Join-Path $projectRoot 'midnight'
$runtimeDirectory = Join-Path $projectRoot '.runtime'
New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null
$apiOutputLog = Join-Path $runtimeDirectory 'api-preprod-live.out.log'
$apiErrorLog = Join-Path $runtimeDirectory 'api-preprod-live.err.log'
$proofReady = Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 'http://127.0.0.1:6300/ready'
if ($proofReady.StatusCode -ne 200) { throw 'The Midnight proof server is not ready on http://127.0.0.1:6300.' }

# A cold DUST wallet must replay historical private ledger events before it can
# safely select a fee coin. Checkpoints make this resumable, but a short outer
# timeout only creates needless reconnect/restart churn during the first run.
$env:MIDNIGHT_SYNC_TIMEOUT_MS = if ($env:MIDNIGHT_SYNC_TIMEOUT_MS) { $env:MIDNIGHT_SYNC_TIMEOUT_MS } else { '28800000' }
$env:MIDNIGHT_ANCHOR_MODE = 'midnight-preprod'

Write-Host '[preprod] wallet readiness will be proven by the API-owned warm lifecycle worker during the first deployment call'

$occupied = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($occupied) { throw 'Port 3000 is already in use. Stop the existing API or run the demo against that known Preprod API instance.' }

$api = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $apiOutputLog -RedirectStandardError $apiErrorLog
try {
  $deadline = (Get-Date).AddSeconds(30)
  do {
    Start-Sleep -Milliseconds 500
    try {
      $health = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 'http://127.0.0.1:3000/health'
    } catch {
      $health = $null
    }
  } while (-not $health -and (Get-Date) -lt $deadline)
  if (-not $health) { throw 'AquaReserve API did not become healthy within 30 seconds.' }

  Set-Location $projectRoot
  npm run demo:phase1
  if ($LASTEXITCODE -ne 0) { throw 'Phase 1 demo publication failed. The deployment lifecycle retained its safe state; do not blindly retry.' }
} catch {
  if (-not $api.HasExited) { Stop-Process -Id $api.Id -Force }
  throw
}
