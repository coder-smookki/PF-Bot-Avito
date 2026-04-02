<#
.SYNOPSIS
    Сброс пароля postgres, пересоздание роли/БД приложения, запуск службы PostgreSQL (Windows).

.DESCRIPTION
    Требуются права администратора. Временно добавляет trust для 127.0.0.1 в pg_hba.conf,
    задаёт новый пароль суперпользователю postgres, удаляет и заново создаёт БД и пользователя
    из корневого .env проекта (DB_USERNAME, DB_PASSWORD, DB_DATABASE), затем восстанавливает pg_hba.conf.

.PARAMETER ProjectRoot
    Корень репозитория с файлом .env (по умолчанию: родительская папка scripts).

.PARAMETER PostgresAdminPassword
    Новый пароль для роли postgres. Если не указан - генерируется (буквы и цифры), выводится в консоль и лог.

.EXAMPLE
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
    .\reset-postgres-windows.ps1
#>

[CmdletBinding()]
param(
    [string] $ProjectRoot = '',
    [string] $PostgresAdminPassword = ''
)

$ErrorActionPreference = 'Stop'

$TrustBegin = '# --- PF_AVITO_PG_TRUST_BEGIN ---'
$TrustEnd = '# --- PF_AVITO_PG_TRUST_END ---'

function Test-IsAdministrator {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $p = New-Object Security.Principal.WindowsPrincipal($id)
    return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdministrator)) {
    Write-Host "Нужны права администратора. Подтвердите UAC." -ForegroundColor Yellow
    $argList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $PSCommandPath)
    if ($ProjectRoot) {
        $argList += '-ProjectRoot'
        $argList += $ProjectRoot
    }
    if ($PostgresAdminPassword) {
        $argList += '-PostgresAdminPassword'
        $argList += $PostgresAdminPassword
    }
    try {
        $proc = Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList $argList -Wait -PassThru
        exit $(if ($null -ne $proc.ExitCode) { $proc.ExitCode } else { 0 })
    } catch {
        Write-Host "Запуск с повышением отменён: $_" -ForegroundColor Red
        exit 1
    }
}

$LogPath = Join-Path $PSScriptRoot "reset-postgres-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

function Write-Log {
    param([string] $Message)
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Add-Content -Path $LogPath -Value $line -Encoding UTF8
    Write-Host $line
}

function Escape-SqlString {
    param([string] $s)
    if ($null -eq $s) { return '' }
    return $s.Replace("'", "''")
}

function Assert-PgIdentifier {
    param([string] $Name, [string] $Label)
    if ($Name -notmatch '^[a-zA-Z_][a-zA-Z0-9_]*$') {
        throw "$Label must be a simple PostgreSQL identifier (letters, digits, underscore): '$Name'"
    }
}

function Read-DotEnv {
    param([string] $Path)
    $map = @{}
    if (-not (Test-Path -LiteralPath $Path)) { return $map }
    Get-Content -LiteralPath $Path -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if ($line -match '^\s*#' -or $line -eq '') { return }
        if ($line -match '^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
            $val = $matches[2].Trim()
            if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Substring(1, $val.Length - 2) }
            $map[$matches[1]] = $val
        }
    }
    $map
}

function Get-PostgreSQLServiceInfo {
    $services = Get-CimInstance Win32_Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^postgresql' }
    if (-not $services) {
        throw "Служба PostgreSQL не найдена. Установите: choco install postgresql -y"
    }
    $svc = $services | Select-Object -First 1
    $pathName = $svc.PathName
    $mm = [regex]::Match($pathName, '-D\s+"([^"]+)"')
    if (-not $mm.Success) {
        $mm2 = [regex]::Match($pathName, "-D\s+'([^']+)'")
        if (-not $mm2.Success) {
            throw "Не удалось извлечь каталог данных из: $pathName"
        }
        $dataDir = $mm2.Groups[1].Value
    } else {
        $dataDir = $mm.Groups[1].Value
    }
    $pgHome = Split-Path -Parent $dataDir
    $psql = Join-Path $pgHome 'bin\psql.exe'
    if (-not (Test-Path -LiteralPath $psql)) {
        throw "Не найден psql: $psql"
    }
    $hba = Join-Path $dataDir 'pg_hba.conf'
    if (-not (Test-Path -LiteralPath $hba)) {
        throw "Не найден pg_hba.conf: $hba"
    }
    [pscustomobject]@{
        ServiceName = $svc.Name
        DataDir     = $dataDir
        PsqlExe     = $psql
        HbaPath     = $hba
    }
}

function Add-TrustBlock {
    param([string] $HbaPath)
    $raw = Get-Content -LiteralPath $HbaPath -Raw -Encoding UTF8
    if ($raw -match [regex]::Escape($TrustBegin)) {
        Write-Log "В pg_hba.conf уже есть блок trust скрипта - пропуск добавления."
        return
    }
    $block = @"
$TrustBegin
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
$TrustEnd

"@
    $utf8Bom = New-Object System.Text.UTF8Encoding $true
    [System.IO.File]::WriteAllText($HbaPath, $block + $raw, $utf8Bom)
    Write-Log "В начало pg_hba.conf добавлен временный trust для localhost."
}

function Remove-TrustBlock {
    param([string] $HbaPath)
    $lines = Get-Content -LiteralPath $HbaPath -Encoding UTF8
    $out = New-Object System.Collections.Generic.List[string]
    $skip = $false
    foreach ($line in $lines) {
        if ($line -eq $TrustBegin) { $skip = $true; continue }
        if ($line -eq $TrustEnd) { $skip = $false; continue }
        if (-not $skip) { $out.Add($line) | Out-Null }
    }
    $utf8Bom = New-Object System.Text.UTF8Encoding $true
    [System.IO.File]::WriteAllLines($HbaPath, $out, $utf8Bom)
    Write-Log "Блок временного trust удалён из pg_hba.conf."
}

function Invoke-Psql {
    param(
        [string] $PsqlExe,
        [string] $Sql,
        [string] $Database = 'postgres'
    )
    $sqlPath = Join-Path $env:TEMP "pfavito-pg-$(Get-Random).sql"
    try {
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($sqlPath, $Sql, $utf8NoBom)
        & $PsqlExe -U postgres -h 127.0.0.1 -d $Database -v ON_ERROR_STOP=1 -f $sqlPath 2>&1 | ForEach-Object { Write-Log "psql: $_" }
        if ($LASTEXITCODE -ne 0) { throw "psql завершился с кодом $LASTEXITCODE" }
    } finally {
        Remove-Item -LiteralPath $sqlPath -Force -ErrorAction SilentlyContinue
    }
}

# --- main ---
Write-Log "Лог: $LogPath"

if (-not $ProjectRoot) {
    $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}
$envPath = Join-Path $ProjectRoot '.env'
Write-Log "ProjectRoot: $ProjectRoot"

$envMap = Read-DotEnv -Path $envPath
$dbUser = if ($envMap['DB_USERNAME']) { $envMap['DB_USERNAME'] } else { 'pfavito' }
$dbPass = if ($envMap['DB_PASSWORD']) { $envMap['DB_PASSWORD'] } else { 'pfavito_secret' }
$dbName = if ($envMap['DB_DATABASE']) { $envMap['DB_DATABASE'] } else { 'pfavito' }

Write-Log "БД приложения: user=$dbUser database=$dbName (пароль из .env, длина $($dbPass.Length) симв.)"

if (-not $PostgresAdminPassword) {
    $PostgresAdminPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
    Write-Host ""
    Write-Host "Сгенерирован НОВЫЙ пароль суперпользователя postgres (сохраните):" -ForegroundColor Yellow
    Write-Host $PostgresAdminPassword -ForegroundColor Cyan
    Write-Host ""
    Write-Log "Сгенерирован новый пароль postgres (только в консоли выше, в лог пароль не пишется)."
}

Assert-PgIdentifier -Name $dbUser -Label 'DB_USERNAME'
Assert-PgIdentifier -Name $dbName -Label 'DB_DATABASE'

$pgAdminEsc = Escape-SqlString $PostgresAdminPassword
$passEsc = Escape-SqlString $dbPass
$dbNameStrEsc = Escape-SqlString $dbName

$info = $null
$hbaBackup = $null

$info = Get-PostgreSQLServiceInfo
Write-Log "Служба: $($info.ServiceName), data: $($info.DataDir)"

try {
    Write-Log "Остановка службы..."
    Stop-Service -Name $info.ServiceName -Force -ErrorAction Stop
    Start-Sleep -Seconds 2

    $hbaBackup = "$($info.HbaPath).bak-$(Get-Date -Format 'yyyyMMddHHmmss')"
    Copy-Item -LiteralPath $info.HbaPath -Destination $hbaBackup -Force
    Write-Log "Резервная копия pg_hba: $hbaBackup"

    Add-TrustBlock -HbaPath $info.HbaPath

    Write-Log "Запуск службы..."
    Start-Service -Name $info.ServiceName -ErrorAction Stop
    Start-Sleep -Seconds 3

    $sqlReset = @"
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$dbNameStrEsc' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS $dbName;
DROP ROLE IF EXISTS $dbUser;
ALTER USER postgres WITH PASSWORD '$pgAdminEsc';
CREATE USER $dbUser WITH PASSWORD '$passEsc';
CREATE DATABASE $dbName OWNER $dbUser;
GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;
"@

    Write-Log "Сброс БД приложения и пароля postgres..."
    Invoke-Psql -PsqlExe $info.PsqlExe -Sql $sqlReset -Database 'postgres'

    $sqlGrants = @"
GRANT ALL ON SCHEMA public TO $dbUser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $dbUser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $dbUser;
"@
    Write-Log "Права в схеме public..."
    Invoke-Psql -PsqlExe $info.PsqlExe -Sql $sqlGrants -Database $dbName

    Write-Log "Остановка службы для восстановления pg_hba..."
    Stop-Service -Name $info.ServiceName -Force
    Start-Sleep -Seconds 2

    Remove-TrustBlock -HbaPath $info.HbaPath

    Write-Log "Запуск службы (обычная проверка паролей)..."
    Start-Service -Name $info.ServiceName
    Start-Sleep -Seconds 2

    $env:PGPASSWORD = $PostgresAdminPassword
    & $info.PsqlExe -U postgres -h 127.0.0.1 -d postgres -c "SELECT 1 AS ok;" 2>&1 | ForEach-Object { Write-Log "check: $_" }
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

    Write-Log "Готово. Подключение приложения: host=localhost port=5432 user=$dbUser database=$dbName"
    Write-Log "Админ psql: psql -U postgres -h 127.0.0.1 -d postgres (пароль - см. выше / лог)"
    Write-Host "Успешно. Лог: $LogPath" -ForegroundColor Green
    exit 0
} catch {
    Write-Log "ОШИБКА: $_"
    Write-Host $_ -ForegroundColor Red
    try {
        if ($null -ne $info -and $info.ServiceName) {
            Stop-Service -Name $info.ServiceName -Force -ErrorAction SilentlyContinue
            if ($hbaBackup -and (Test-Path -LiteralPath $hbaBackup) -and $info.HbaPath) {
                Copy-Item -LiteralPath $hbaBackup -Destination $info.HbaPath -Force
                Write-Log "Восстановлен pg_hba из резервной копии."
            }
            Start-Service -Name $info.ServiceName -ErrorAction SilentlyContinue
        }
    } catch {}
    exit 1
}
