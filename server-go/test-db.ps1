# Скрипт для проверки подключения к базе данных и наличия таблиц

Write-Host "Проверка подключения к базе данных..." -ForegroundColor Cyan

# Загружаем .env
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "❌ Файл .env не найден!" -ForegroundColor Red
    exit 1
}

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) {
    Write-Host "❌ DATABASE_URL не установлен в .env" -ForegroundColor Red
    exit 1
}

Write-Host "DATABASE_URL: $($dbUrl -replace ':[^:@]+@', ':****@')" -ForegroundColor Gray

# Парсим DATABASE_URL
if ($dbUrl -match 'postgres://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)') {
    $user = $matches[1]
    $pass = $matches[2]
    $dbHost = $matches[3]
    $port = $matches[4]
    $dbname = $matches[5]
    
    Write-Host "`nПараметры подключения:" -ForegroundColor Yellow
    Write-Host "  Host: $dbHost" -ForegroundColor White
    Write-Host "  Port: $port" -ForegroundColor White
    Write-Host "  Database: $dbname" -ForegroundColor White
    Write-Host "  User: $user" -ForegroundColor White
    
    # Ищем psql
    $psqlPaths = @(
        "C:\Program Files\PostgreSQL\*\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe"
    )
    
    $psql = $null
    foreach ($path in $psqlPaths) {
        $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $psql = $found.FullName
            break
        }
    }
    
    if ($psql) {
        Write-Host "`nПроверяю подключение..." -ForegroundColor Yellow
        $env:PGPASSWORD = $pass
        
        # Проверяем подключение
        $result = & $psql -h $dbHost -p $port -U $user -d $dbname -c "SELECT version();" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Подключение успешно!" -ForegroundColor Green
            
            # Проверяем таблицы
            Write-Host "`nПроверяю наличие таблиц..." -ForegroundColor Yellow
            $tables = & $psql -h $dbHost -p $port -U $user -d $dbname -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                $tableList = $tables | Where-Object { $_.Trim() -ne '' } | ForEach-Object { $_.Trim() }
                if ($tableList.Count -gt 0) {
                    Write-Host "✅ Найдено таблиц: $($tableList.Count)" -ForegroundColor Green
                    Write-Host "`nТаблицы:" -ForegroundColor Cyan
                    $tableList | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
                    
                    # Проверяем таблицу products
                    if ($tableList -contains "products") {
                        $count = & $psql -h $dbHost -p $port -U $user -d $dbname -t -c "SELECT COUNT(*) FROM products WHERE is_active = TRUE;" 2>&1
                        Write-Host "`nАктивных продуктов: $($count.Trim())" -ForegroundColor Cyan
                    } else {
                        Write-Host "`n⚠️ Таблица 'products' не найдена!" -ForegroundColor Yellow
                        Write-Host "Выполните миграции: psql -U $user -d $dbname -f ..\database\schema.sql" -ForegroundColor White
                    }
                } else {
                    Write-Host "⚠️ Таблицы не найдены!" -ForegroundColor Yellow
                    Write-Host "Выполните миграции: psql -U $user -d $dbname -f ..\database\schema.sql" -ForegroundColor White
                }
            } else {
                Write-Host "❌ Ошибка при проверке таблиц" -ForegroundColor Red
                Write-Host $tables -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Ошибка подключения!" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
        }
        
        Remove-Item Env:\PGPASSWORD
    } else {
        Write-Host "⚠️ psql не найден. Установите PostgreSQL или добавьте psql в PATH" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Не удалось распарсить DATABASE_URL" -ForegroundColor Red
    Write-Host "Формат должен быть: postgres://user:password@host:port/database" -ForegroundColor Yellow
}

