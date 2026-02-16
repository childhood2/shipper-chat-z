# Permanently fix Git permission issues (run as Administrator).
# Fixes: "Permission denied" on .git/objects, .git/index, refs/remotes/origin/main

param(
    [string]$RepoPath = $PSScriptRoot,
    [switch]$AddDefenderExclusion
)

$ErrorActionPreference = "Stop"
$gitPath = Join-Path $RepoPath ".git"

if (-not (Test-Path $gitPath)) {
    Write-Host "No .git folder at: $RepoPath" -ForegroundColor Red
    exit 1
}

$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object System.Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Run this script as Administrator (right-click PowerShell -> Run as administrator)." -ForegroundColor Red
    exit 1
}

Write-Host "Fixing Git permissions for: $RepoPath" -ForegroundColor Cyan

# 1. Remove read-only from entire .git tree
Write-Host "[1/4] Clearing read-only on .git..." -ForegroundColor Yellow
Get-ChildItem $gitPath -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        if ($_.PSIsContainer) { $_.Attributes = "Directory" }
        else { $_.Attributes = "Archive" }
    } catch { Write-Warning "Skip (in use?): $($_.FullName)" }
}

# 2. Take ownership of .git and every file/folder under it
Write-Host "[2/4] Taking ownership of .git (recursive)..." -ForegroundColor Yellow
& takeown /F $gitPath /R /D Y 2>&1 | Out-Null

# 3. Reset ACLs and grant current user full control on entire tree
#    /RESET replaces inherited ACEs so we start clean; then grant F (full) with inheritance (OI)(CI)
Write-Host "[3/4] Granting full control to $env:USERNAME on .git..." -ForegroundColor Yellow
& icacls $gitPath /RESET /T /Q 2>&1 | Out-Null
& icacls $gitPath /grant "${env:USERNAME}:(OI)(CI)F" /T /Q 2>&1 | Out-Null

# 4. Optional: add Windows Defender exclusion for this repo (stops real-time scan from locking .git)
if ($AddDefenderExclusion) {
    Write-Host "[4/4] Adding Windows Defender exclusion for repo folder..." -ForegroundColor Yellow
    $resolvedPath = (Resolve-Path $RepoPath).Path
    try {
        $exclusions = (Get-MpPreference).ExclusionPath
        if ($exclusions -and $exclusions -contains $resolvedPath) {
            Write-Host "      Exclusion already present." -ForegroundColor Gray
        } else {
            Add-MpPreference -ExclusionPath $resolvedPath
            Write-Host "      Added: $resolvedPath" -ForegroundColor Green
        }
    } catch {
        Write-Warning "Could not add Defender exclusion (Defender may be disabled or managed by policy): $_"
    }
} else {
    Write-Host "[4/4] Skipping Defender exclusion. Use -AddDefenderExclusion to add it." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host ""
Write-Host "Important: If you ran this from Cursor's terminal, close Cursor and try git from" -ForegroundColor Yellow
Write-Host "a new PowerShell (Run as Administrator) in this folder. The IDE can hold locks" -ForegroundColor Yellow
Write-Host "on .git and cause 'unable to write new index file' even with correct permissions." -ForegroundColor Yellow
Write-Host ""
Write-Host "If you still see permission errors:" -ForegroundColor Yellow
Write-Host "  - Run this script from an external Admin PowerShell (not inside Cursor)" -ForegroundColor Gray
Write-Host "  - Use: .\fix-git-permissions.ps1 -AddDefenderExclusion" -ForegroundColor Gray
Write-Host "  - Settings -> Privacy -> Controlled Folder Access: allow or disable for this folder" -ForegroundColor Gray
Write-Host ""
