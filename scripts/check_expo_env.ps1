<#
Short troubleshooting script for Expo / Android connectivity.
Runs: adb devices, web health check to http://127.0.0.1:19000/, and `npx expo status`.
Run from the repo root in PowerShell:

  Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
  .\scripts\check_expo_env.ps1

#>

Write-Host "=== Expo / ADB Troubleshooter ===" -ForegroundColor Cyan

function Write-OK($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host $msg -ForegroundColor Red }

Write-Host "`n[1/3] ADB devices check..." -NoNewline
if (Get-Command adb -ErrorAction SilentlyContinue) {
    try {
        $out = & adb devices 2>&1
        Write-OK " ✅ adb found"
        Write-Host $out

        # Show any port reverse mappings (useful when using physical devices)
        try {
            $rev = & adb reverse --list 2>&1
            if ($rev) { Write-Host "\n[adb reverse --list]"; Write-Host $rev }
        } catch { }
    } catch {
        Write-Err " ❌ adb command failed: $($_.Exception.Message)"
    }
} else {
    Write-Err " ❌ adb not found in PATH. Install Android platform-tools and ensure adb is on PATH."
}

Write-Host "`n[2/3] Expo web server health (http://127.0.0.1:19000/)..." -NoNewline
try {
    $resp = Invoke-WebRequest -Uri 'http://127.0.0.1:19000/' -UseBasicParsing -TimeoutSec 5
    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
        Write-OK " ✅ HTTP $($resp.StatusCode)"
    } else {
        Write-Warn " ⚠️ HTTP $($resp.StatusCode)"
    }
} catch {
    Write-Err " ❌ Unable to reach Expo server: $($_.Exception.Message)"
    Write-Host "    → If Metro/Expo isn't running: run 'npx expo start' and retry." -ForegroundColor Yellow
}

Write-Host "`n[3/3] Expo CLI status check..." -NoNewline
if (Get-Command npx -ErrorAction SilentlyContinue) {
    try {
        $out = & npx expo status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-OK " ✅ expo status OK"
            Write-Host $out
        } else {
            Write-Err " ❌ expo status failed (exit $LASTEXITCODE)"
            Write-Host $out
        }
    } catch {
        Write-Err " ❌ Error running 'npx expo status': $($_.Exception.Message)"
    }
} else {
    Write-Err " ❌ 'npx' not found. Ensure Node.js is installed and on PATH."
}

Write-Host "`nSummary:" -ForegroundColor Magenta
Write-Host " - ADB: check device list and adb reverse for physical devices." -ForegroundColor Yellow
Write-Host " - Expo: ensure Metro is running (npx expo start). Use --tunnel if device can't reach host." -ForegroundColor Yellow
Write-Host " - If issues persist, run the commands shown above manually for full logs." -ForegroundColor Yellow

Write-Host "`nDone." -ForegroundColor Cyan
