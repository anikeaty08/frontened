$ErrorActionPreference = 'Stop'
$env:MIDNIGHT_SYNC_TIMEOUT_MS = '3600000'
npm run lifecycle -- status
exit $LASTEXITCODE
