# Установка Go в пользовательскую директорию (без прав администратора)
# Этот скрипт скачает и установит Go локально для текущего пользователя

$ErrorActionPreference = "Stop"

Write-Host "Установка Go в пользовательскую директорию..." -ForegroundColor Green

# Директория для установки
$installDir = "$env:USERPROFILE\go"
$goVersion = "1.21.5"
$goUrl = "https://go.dev/dl/go${goVersion}.windows-amd64.zip"
$zipPath = "$env:TEMP\go.zip"

Write-Host "Версия Go: $goVersion" -ForegroundColor Cyan
Write-Host "Директория установки: $installDir" -ForegroundColor Cyan

# Создаем директорию
if (Test-Path $installDir) {
    Write-Host "Директория $installDir уже существует. Удаляю..." -ForegroundColor Yellow
    Remove-Item -Path $installDir -Recurse -Force
}

New-Item -ItemType Directory -Path $installDir -Force | Out-Null

# Скачиваем Go
Write-Host "`nСкачиваю Go..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $goUrl -OutFile $zipPath -UseBasicParsing
    Write-Host "Скачивание завершено!" -ForegroundColor Green
} catch {
    Write-Host "Ошибка при скачивании: $_" -ForegroundColor Red
    Write-Host "Попробуйте скачать вручную с https://go.dev/dl/" -ForegroundColor Yellow
    exit 1
}

# Распаковываем
Write-Host "`nРаспаковываю..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $zipPath -DestinationPath $installDir -Force
    Write-Host "Распаковка завершена!" -ForegroundColor Green
} catch {
    Write-Host "Ошибка при распаковке: $_" -ForegroundColor Red
    exit 1
}

# Удаляем архив
Remove-Item -Path $zipPath -Force

# Добавляем в PATH для текущей сессии
$goBinPath = "$installDir\go\bin"
$env:PATH = "$goBinPath;$env:PATH"

# Добавляем в PATH пользователя постоянно
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$goBinPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$goBinPath", "User")
    Write-Host "`nGo добавлен в PATH пользователя!" -ForegroundColor Green
} else {
    Write-Host "`nGo уже в PATH пользователя!" -ForegroundColor Green
}

# Проверяем установку
Write-Host "`nПроверяю установку..." -ForegroundColor Yellow
& "$goBinPath\go.exe" version

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Go успешно установлен!" -ForegroundColor Green
    Write-Host "`nВАЖНО:" -ForegroundColor Yellow
    Write-Host "1. Перезапустите терминал, чтобы изменения PATH вступили в силу" -ForegroundColor Cyan
    Write-Host "2. После перезапуска выполните: go version" -ForegroundColor Cyan
    Write-Host "3. Затем: cd D:\С\work\skryabin-ink\server-go && go mod download" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Ошибка при проверке установки" -ForegroundColor Red
}

Write-Host "`nНажмите любую клавишу для выхода..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


