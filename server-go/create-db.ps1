# Скрипт для создания базы данных
# Находит psql и создает базу данных skryabin_ink

Write-Host "Поиск PostgreSQL..." -ForegroundColor Cyan

# Ищем psql в стандартных местах
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\*\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe",
    "$env:ProgramFiles\PostgreSQL\*\bin\psql.exe"
)

$psql = $null
foreach ($path in $psqlPaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $psql = $found.FullName
        break
    }
}

if (-not $psql) {
    Write-Host "❌ psql не найден!" -ForegroundColor Red
    Write-Host "`nСоздайте базу данных вручную:" -ForegroundColor Yellow
    Write-Host "1. Откройте pgAdmin" -ForegroundColor White
    Write-Host "2. Подключитесь к серверу PostgreSQL" -ForegroundColor White
    Write-Host "3. Создайте базу данных 'skryabin_ink'" -ForegroundColor White
    Write-Host "`nИли найдите psql.exe и выполните:" -ForegroundColor Yellow
    Write-Host "psql -U postgres -c 'CREATE DATABASE skryabin_ink;'" -ForegroundColor White
    exit 1
}

Write-Host "✅ Найден: $psql" -ForegroundColor Green

# Запрашиваем пароль
$password = Read-Host "Введите пароль для пользователя postgres" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
$env:PGPASSWORD = $plainPassword

Write-Host "`nСоздаю базу данных skryabin_ink..." -ForegroundColor Yellow

# Создаем базу данных
& $psql -U postgres -c "CREATE DATABASE skryabin_ink;" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ База данных создана!" -ForegroundColor Green
} else {
    # Возможно база уже существует
    $check = & $psql -U postgres -lqt 2>&1 | Select-String "skryabin_ink"
    if ($check) {
        Write-Host "ℹ️ База данных уже существует" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Ошибка при создании базы данных" -ForegroundColor Red
        Write-Host "Проверьте пароль и права доступа" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "`nВыполняю миграции..." -ForegroundColor Yellow
$schemaPath = Resolve-Path "..\database\schema.sql"
& $psql -U postgres -d skryabin_ink -f $schemaPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Миграции выполнены!" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при выполнении миграций" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 База данных готова к использованию!" -ForegroundColor Green
Write-Host "Теперь можно запустить: go run main.go" -ForegroundColor Cyan

# Очищаем пароль из переменной окружения
Remove-Item Env:\PGPASSWORD







