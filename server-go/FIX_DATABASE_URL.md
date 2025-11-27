# Исправление ошибки подключения к базе данных

## Проблема

Ошибка:
```
pq: unsupported sslmode "disable, postgresql://..."
```

Это означает, что в `DATABASE_URL` неправильный формат.

## Решение

### Для облачной базы данных (Railway, Neon, Supabase и т.д.)

Откройте файл `server-go/.env` и исправьте `DATABASE_URL`:

**Неправильно:**
```env
DATABASE_URL=sslmode=disable, postgresql://user:pass@host/db
```

**Правильно:**
```env
DATABASE_URL=postgresql://keiko:IqkDZJ34KeOSul5WqYIPbXxahh1S6dxS@dpg-d4etctogjchc73foeakg-a/skryabin_ink?sslmode=disable
```

**Важно:**
- Если сервер не поддерживает SSL, используйте `sslmode=disable`
- Если сервер требует SSL, используйте `sslmode=require`
- Параметры должны быть после `?` в URL
- Не должно быть запятых перед URL

### Для локальной базы данных

Если используете локальный PostgreSQL:

```env
DATABASE_URL=postgres://postgres:password@localhost:5432/skryabin_ink?sslmode=disable
```

## Быстрое исправление

1. Откройте `server-go/.env`
2. Найдите строку `DATABASE_URL`
3. Убедитесь, что формат правильный:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   ```
4. Для облачных БД: `sslmode=require`
5. Для локальных БД: `sslmode=disable`
6. Сохраните файл
7. Перезапустите сервер

## Проверка

После исправления запустите:
```bash
cd server-go
go run main.go
```

Если все правильно, вы увидите:
```
Server starting on port 8080
```

## Примеры правильных форматов

### Railway/Neon/Supabase (облачные)
```env
# Попробуйте сначала disable, если не работает - используйте require
DATABASE_URL=postgresql://user:password@host/database?sslmode=disable
# или
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### Локальный PostgreSQL
```env
DATABASE_URL=postgres://postgres:password@localhost:5432/skryabin_ink?sslmode=disable
```

### Если получаете ошибку "SSL is not enabled"
Используйте `sslmode=disable`:
```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=disable
```

### С портом
```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

