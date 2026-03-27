# Claude Code Statusline — PowerShell Installer
# Copies scripts and merges settings into your Claude Code configuration

$ErrorActionPreference = "Stop"

$ClaudeDir = "$env:USERPROFILE\.claude"
$ScriptsDir = "$ClaudeDir\scripts"
$SettingsFile = "$ClaudeDir\settings.json"
$ScriptRoot = $PSScriptRoot

Write-Host "=== Claude Code Statusline Installer ===" -ForegroundColor Cyan
Write-Host ""

# Create scripts directory
if (!(Test-Path $ScriptsDir)) {
    New-Item -ItemType Directory -Path $ScriptsDir -Force | Out-Null
}

# Copy scripts
Copy-Item "$ScriptRoot\scripts\statusline.js" "$ScriptsDir\statusline.js" -Force
Copy-Item "$ScriptRoot\scripts\agent-start.js" "$ScriptsDir\agent-start.js" -Force
Copy-Item "$ScriptRoot\scripts\agent-stop.js" "$ScriptsDir\agent-stop.js" -Force

Write-Host "[OK] Scripts copied to $ScriptsDir" -ForegroundColor Green

# Check if settings.json exists
if (Test-Path $SettingsFile) {
    Write-Host ""
    Write-Host "[!] Found existing settings.json at $SettingsFile" -ForegroundColor Yellow
    Write-Host "    You need to manually merge the hooks and statusLine config."
    Write-Host "    See settings.example.json for the required blocks."
    Write-Host ""
    Write-Host "    Or run this to open your settings:" -ForegroundColor Yellow
    Write-Host "    claude config" -ForegroundColor White
} else {
    Copy-Item "$ScriptRoot\settings.example.json" $SettingsFile
    Write-Host "[OK] Created $SettingsFile with statusline and hooks config" -ForegroundColor Green
}

Write-Host ""
Write-Host "[DONE] Restart Claude Code to see the new status line!" -ForegroundColor Cyan
