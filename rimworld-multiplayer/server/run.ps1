# Run the standalone server in a restart loop on Windows.
#   powershell -ExecutionPolicy Bypass -File server\run.ps1 [-Dir path]
# Default dir: server\dist\Windows (from scripts/build-server.sh) or the extracted Server\Windows
# folder of Server-beta.zip. The server exits on purpose after the bootstrap upload, so it is
# restarted automatically. Ctrl+C stops it.
param([string]$Dir = "$PSScriptRoot\dist\Windows")
if (-not (Test-Path "$Dir\Server.exe")) { Write-Error "no Server.exe in $Dir"; exit 1 }
while ($true) {
    Write-Host "[run.ps1] starting server from $Dir at $(Get-Date -Format s)"
    Push-Location $Dir
    try { & .\Server.exe } finally { Pop-Location }
    Write-Host "[run.ps1] server exited with code $LASTEXITCODE; restarting in 3s (Ctrl+C to quit)"
    Start-Sleep -Seconds 3
}
