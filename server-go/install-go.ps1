# Скрипт для установки Go через Chocolatey
# Запустите этот скрипт от имени администратора: правой кнопкой -> "Запуск от имени администратора"

Write-Host "Установка Go через Chocolatey..." -ForegroundColor Green

# Проверка прав администратора
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ОШИБКА: Этот скрипт нужно запустить от имени администратора!" -ForegroundColor Red
    Write-Host "Правой кнопкой мыши на файле -> 'Запуск от имени администратора'" -ForegroundColor Yellow
    pause
    exit 1
}

# Установка Go
Write-Host "Устанавливаю Go..." -ForegroundColor Yellow
choco install golang -y

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nGo успешно установлен!" -ForegroundColor Green
    Write-Host "`nВАЖНО: Перезапустите терминал/PowerShell, чтобы изменения вступили в силу." -ForegroundColor Yellow
    Write-Host "После перезапуска выполните: go version" -ForegroundColor Cyan
} else {
    Write-Host "`nОшибка при установке Go. Попробуйте установить вручную:" -ForegroundColor Red
    Write-Host "1. Скачайте с https://go.dev/dl/" -ForegroundColor Yellow
    Write-Host "2. Запустите установщик .msi" -ForegroundColor Yellow
    Write-Host "3. Перезапустите терминал" -ForegroundColor Yellow
}

pause

