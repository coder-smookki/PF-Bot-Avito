# Find nginx.exe on Windows (run in PowerShell).
# Typical: Chocolatey C:\tools\nginx, winget Program Files, manual zip.

$ErrorActionPreference = 'SilentlyContinue'

Write-Host "=== nginx in PATH ===" -ForegroundColor Cyan
$cmd = Get-Command nginx -ErrorAction SilentlyContinue
if ($cmd) {
    Write-Host $cmd.Source
} else {
    Write-Host "(not in PATH)"
}

Write-Host "`n=== where.exe nginx ===" -ForegroundColor Cyan
& where.exe nginx 2>$null

Write-Host "`n=== common folders ===" -ForegroundColor Cyan
$candidates = @(
    'C:\tools\nginx\nginx.exe'
    'C:\Program Files\nginx\nginx.exe'
    'C:\Program Files (x86)\nginx\nginx.exe'
    'C:\nginx\nginx.exe'
    'C:\Program Files\Nginx\nginx.exe'
)
foreach ($p in $candidates) {
    if (Test-Path -LiteralPath $p) {
        Write-Host "FOUND: $p"
        $root = Split-Path $p -Parent
        Write-Host "  cd `"$root`""
        Write-Host "  .\nginx.exe -t"
    }
}

Write-Host "`n=== WinGet package folder (typical: conf next to nginx.exe) ===" -ForegroundColor Cyan
$wgPackages = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
if (Test-Path -LiteralPath $wgPackages) {
    Get-ChildItem -LiteralPath $wgPackages -Recurse -Depth 8 -Filter 'nginx.exe' -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty FullName -Unique |
        ForEach-Object {
            Write-Host "FOUND: $_"
            $root = Split-Path $_ -Parent
            Write-Host "  conf:  $root\conf\nginx.conf"
            Write-Host "  cd `"$root`""
            Write-Host "  .\nginx.exe -t"
        }
} else {
    Write-Host "(no $wgPackages)"
}

Write-Host "`n=== winget list ===" -ForegroundColor Cyan
if (Get-Command winget -ErrorAction SilentlyContinue) {
    winget list --name nginx 2>$null
}

Write-Host "`nIf nothing found, install (admin PowerShell):" -ForegroundColor Yellow
Write-Host "  choco install nginx -y"
Write-Host "  # or: winget install -e --id nginxinc.nginx"
