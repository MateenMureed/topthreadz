$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$backendPath'; npm run dev"
)

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$frontendPath'; npm run dev"
)

Write-Host "Backend and frontend dev servers launched in separate PowerShell windows."
