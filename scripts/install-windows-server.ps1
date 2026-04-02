<#
.SYNOPSIS
    Установка Nginx, Node.js (LTS) и PM2 на Windows Server / Windows 10/11.
    Без Docker и без включения WSL — перезагрузка не требуется.

.DESCRIPTION
    Запускайте из обычного PowerShell: при необходимости откроется UAC и скрипт продолжит с правами администратора.
    Сначала пробует winget; при отсутствии — Chocolatey.
    Опционально: локальные PostgreSQL и Redis (Chocolatey), без перезагрузки.

.PARAMETER SkipPm2
    Не устанавливать PM2 глобально (npm install -g pm2).

.PARAMETER SkipNginx
    Не устанавливать Nginx.

.PARAMETER SkipNode
    Не устанавливать Node.js.

.PARAMETER UseChocolateyOnly
    Не использовать winget, только Chocolatey.

.PARAMETER WithLocalDatabase
    Установить PostgreSQL и Redis для Windows (Chocolatey). Задайте пароль в .env и при необходимости создайте БД вручную.

.EXAMPLE
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
    .\install-windows-server.ps1

.EXAMPLE
    .\install-windows-server.ps1 -WithLocalDatabase
#>

[CmdletBinding()]
param(
    [switch] $SkipPm2,
    [switch] $SkipNginx,
    [switch] $SkipNode,
    [switch] $UseChocolateyOnly,
    [switch] $WithLocalDatabase
)

$ErrorActionPreference = 'Stop'

function Test-IsAdministrator {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $p = New-Object Security.Principal.WindowsPrincipal($id)
    return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdministrator)) {
    Write-Host "Нужны права администратора. Подтвердите запрос UAC (Контроль учётных записей)." -ForegroundColor Yellow
    $argList = @(
        '-NoProfile'
        '-ExecutionPolicy'
        'Bypass'
        '-File'
        $PSCommandPath
    )
    if ($SkipPm2) { $argList += '-SkipPm2' }
    if ($SkipNginx) { $argList += '-SkipNginx' }
    if ($SkipNode) { $argList += '-SkipNode' }
    if ($UseChocolateyOnly) { $argList += '-UseChocolateyOnly' }
    if ($WithLocalDatabase) { $argList += '-WithLocalDatabase' }
    try {
        $proc = Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList $argList -Wait -PassThru
        exit $(if ($proc.ExitCode -ne $null) { $proc.ExitCode } else { 0 })
    } catch {
        Write-Host "Запуск с повышением отменён или недоступен: $_" -ForegroundColor Red
        exit 1
    }
}

$LogPath = Join-Path $PSScriptRoot "install-windows-server-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

function Write-Log {
    param([string] $Message, [ValidateSet('INFO','WARN','ERROR')] [string] $Level = 'INFO')
    $line = "[{0}] [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    Add-Content -Path $LogPath -Value $Line -Encoding UTF8
    switch ($Level) {
        'ERROR' { Write-Host $line -ForegroundColor Red }
        'WARN'  { Write-Host $line -ForegroundColor Yellow }
        default { Write-Host $line }
    }
}

function Test-Command {
    param([string] $Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Ensure-Chocolatey {
    if (Test-Command choco) {
        Write-Log "Chocolatey уже установлен."
        return
    }
    Write-Log "Установка Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor [System.Net.SecurityProtocolType]::Tls12
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Sync-PathFromMachine
    Write-Log "Chocolatey установлен."
}

function Sync-PathFromMachine {
    $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
}

function Update-ChocolateySessionEnv {
    if (-not $env:ChocolateyInstall) { return }
    $mod = Join-Path $env:ChocolateyInstall 'helpers\chocolateyProfile.psm1'
    if (Test-Path $mod) {
        Import-Module $mod -Force -ErrorAction SilentlyContinue
        if (Get-Command Update-SessionEnvironment -ErrorAction SilentlyContinue) {
            Update-SessionEnvironment -ErrorAction SilentlyContinue
        }
    }
    Sync-PathFromMachine
}

function Invoke-WingetInstall {
    param(
        [string] $Id,
        [string] $Label
    )
    if (-not (Test-Command winget)) {
        return $false
    }
    Write-Log "winget: установка $Label ($Id)..."
    & winget install -e --id $Id --accept-package-agreements --accept-source-agreements --silent
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        Write-Log "winget завершился с кодом $LASTEXITCODE для $Id" 'WARN'
        return $false
    }
    return $true
}

function Ensure-Pm2Global {
    if (Test-Command pm2) {
        Write-Log "PM2 уже в PATH: $(pm2 -v)"
        return
    }
    if (-not (Test-Command npm)) {
        Write-Log "npm не найден — установите Node.js и повторите запуск для PM2." 'WARN'
        return
    }
    Write-Log "Глобальная установка PM2 (npm install -g pm2)..."
    & npm install -g pm2
    Sync-PathFromMachine
    if (Test-Command pm2) {
        Write-Log "PM2: $(pm2 -v)"
    } else {
        Write-Log "PM2 установлен; при необходимости обновите PATH или откройте новое окно PowerShell." 'WARN'
    }
}

# --- main ---
Write-Log "Лог: $LogPath"
Write-Log "ОС: $([System.Environment]::OSVersion.VersionString)"

$hasWinget = (-not $UseChocolateyOnly) -and (Test-Command winget)
if ($hasWinget) {
    Write-Log "Будет использован winget (при сбое — Chocolatey)."
} else {
    if ($UseChocolateyOnly) {
        Write-Log "Режим только Chocolatey."
    } else {
        Write-Log "winget не найден — будет использован Chocolatey." 'WARN'
    }
    Ensure-Chocolatey
}

# Node.js LTS
if (-not $SkipNode) {
    $nodeOk = $false
    if (-not $UseChocolateyOnly -and $hasWinget) {
        $nodeOk = Invoke-WingetInstall -Id 'OpenJS.NodeJS.LTS' -Label 'Node.js LTS'
    }
    if (-not $nodeOk) {
        Ensure-Chocolatey
        Write-Log "choco: установка nodejs-lts..."
        choco install nodejs-lts -y
        Update-ChocolateySessionEnv
    }
    Sync-PathFromMachine
    if (Test-Command node) {
        Write-Log "Node.js: $(node -v), npm: $(npm -v)"
    } else {
        Write-Log "Node.js установлен; откройте новое окно PowerShell, если команда node не найдена." 'WARN'
    }
}

# PM2 (глобально — удобно для `pm2 startup` на сервере)
if (-not $SkipPm2) {
    Ensure-Pm2Global
}

# Nginx
if (-not $SkipNginx) {
    $ngxOk = $false
    if (-not $UseChocolateyOnly -and $hasWinget) {
        $ngxOk = Invoke-WingetInstall -Id 'nginxinc.nginx' -Label 'Nginx'
    }
    if (-not $ngxOk) {
        Ensure-Chocolatey
        Write-Log "choco: установка nginx..."
        choco install nginx -y
        Update-ChocolateySessionEnv
    }
    Write-Log "Nginx: конфиг обычно в C:\tools\nginx (Chocolatey) или каталог установки winget." 'INFO'
}

# Локальные PostgreSQL + Redis (опционально, без перезагрузки)
if ($WithLocalDatabase) {
    Ensure-Chocolatey
    Write-Log "choco: установка PostgreSQL (служба Windows, без перезагрузки)..."
    choco install postgresql -y
    Write-Log "choco: установка Redis (пакет redis-64)..."
    choco install redis-64 -y
    Update-ChocolateySessionEnv
    Write-Log "Укажите в .env: DB_HOST=localhost, REDIS_HOST=localhost. Создайте роль/БД под DB_USERNAME/DB_DATABASE из .env (например через pgAdmin или psql)." 'WARN'
}

Write-Log "Готово. Перезагрузка не требуется для Node, PM2 и Nginx."
Write-Log "Проверка: node -v ; pm2 -v ; nginx -v"
Write-Log "Проект: скопируйте репозиторий, npm install в server/client/admin, npm run build в корне, затем npm run pm2:start (из корня с установленным pm2 локально: npm install и npx pm2)."
