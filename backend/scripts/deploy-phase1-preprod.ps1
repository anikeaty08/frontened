$ErrorActionPreference = 'Stop'

# This runner has one intentional side effect: after readiness is proven it
# publishes and attests exactly one synthetic Phase 1 snapshot. Wallet-sync
# retries occur before deployment only; a failed deployment is never retried.
$projectRoot = Split-Path -Parent $PSScriptRoot
$workerRoot = Join-Path $projectRoot 'midnight'
$proofReady = Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 'http://127.0.0.1:6300/ready'
if ($proofReady.StatusCode -ne 200) { throw 'The Midnight proof server is not ready on http://127.0.0.1:6300.' }

# A cold DUST wallet must replay historical private ledger events before it can
# safely select a fee coin. Checkpoints make this resumable, but a short outer
# timeout only creates needless reconnect/restart churn during the first run.
$env:MIDNIGHT_SYNC_TIMEOUT_MS = if ($env:MIDNIGHT_SYNC_TIMEOUT_MS) { $env:MIDNIGHT_SYNC_TIMEOUT_MS } else { '28800000' }
$env:MIDNIGHT_ANCHOR_MODE = 'midnight-preprod'

$ready = $false
for ($attempt = 1; $attempt -le 24; $attempt++) {
  Write-Host "[preprod] wallet readiness attempt $attempt of 24"
  Push-Location $workerRoot
  try {
    npm run lifecycle -- status
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  } finally {
    Pop-Location
  }
  Write-Warning '[preprod] wallet sync interrupted; checkpoint saved. Retrying in five seconds.'
  Start-Sleep -Seconds 5
}
if (-not $ready) { throw 'Wallet did not synchronize within the bounded readiness window; no contract was submitted.' }

$occupied = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($occupied) { throw 'Port 3000 is already in use. Stop the existing API or run the demo against that known Preprod API instance.' }

$api = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
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
