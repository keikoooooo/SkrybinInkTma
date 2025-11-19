# Настройка базы данных PostgreSQL

## Проблема: "lookup postgres: no such host"

Ошибка возникает, когда в `DATABASE_URL` указан неправильный хост.

## Решение

### 1. Создайте/отредактируйте файл `.env` в `server-go`

```powershell
cd D:\С\work\skryabin-ink\server-go
```

### 2. Правильный формат DATABASE_URL

Для локальной установки PostgreSQL:

```env
DATABASE_URL=postgres://postgres:password@localhost:5432/skryabin_ink?sslmode=disable
```

**Замените:**
- `postgres` - имя пользователя (обычно `postgres` или ваше имя пользователя)
- `password` - ваш пароль PostgreSQL
- `5432` - порт (обычно 5432)
- `skryabin_ink` - имя базы данных

### 3. Создайте базу данных

```powershell
# Подключитесь к PostgreSQL
psql -U postgres

# Создайте базу данных
CREATE DATABASE skryabin_ink;

# Выйдите
\q
```

Или одной командой:

```powershell
psql -U postgres -c "CREATE DATABASE skryabin_ink;"
```

### 4. Выполните миграции

```powershell
psql -U postgres -d skryabin_ink -f ..\database\schema.sql
```

Или с паролем:

```powershell
$env:PGPASSWORD="your_password"
psql -U postgres -d skryabin_ink -f ..\database\schema.sql
```

### 5. Примеры DATABASE_URL

**С паролем:**
```env
DATABASE_URL=postgres://postgres:mypassword@localhost:5432/skryabin_ink?sslmode=disable
```

**Без пароля (если настроено):**
```env
DATABASE_URL=postgres://postgres@localhost:5432/skryabin_ink?sslmode=disable
```

**С другим пользователем:**
```env
DATABASE_URL=postgres://myuser:mypassword@localhost:5432/skryabin_ink?sslmode=disable
```

**Для Windows Authentication (если настроено):**
```env
DATABASE_URL=postgres://localhost:5432/skryabin_ink?sslmode=disable
```

### 6. Проверка подключения

```powershell
# Проверьте подключение
psql -U postgres -d skryabin_ink -c "SELECT version();"
```

### 7. Запустите бэкенд

```powershell
cd D:\С\work\skryabin-ink\server-go
go run main.go
```

## Типичные проблемы

### "password authentication failed"
- Проверьте правильность пароля
- Проверьте файл `pg_hba.conf` в PostgreSQL

### "database does not exist"
- Создайте базу данных (см. шаг 3)

### "connection refused"
- Убедитесь, что PostgreSQL запущен
- Проверьте порт (обычно 5432)

### "lookup postgres: no such host"
- Используйте `localhost` вместо `postgres` в DATABASE_URL
- Или добавьте запись в `/etc/hosts` (Linux/Mac) или `C:\Windows\System32\drivers\etc\hosts` (Windows)

## Быстрая настройка

1. Создайте `.env` файл:
```powershell
Copy-Item env.example .env
notepad .env
```

2. Отредактируйте `DATABASE_URL` с правильными данными

3. Создайте БД и выполните миграции:
```powershell
psql -U postgres -c "CREATE DATABASE skryabin_ink;"
psql -U postgres -d skryabin_ink -f ..\database\schema.sql
```

4. Запустите сервер:
```powershell
go run main.go
```





