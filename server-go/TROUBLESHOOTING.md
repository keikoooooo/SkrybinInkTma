# Решение ошибки HTTP 500 при запросе каталога

## Проблема
При запросе `/api/catalog` возвращается ошибка 500 (Internal Server Error).

## Диагностика

### 1. Проверьте логи бэкенда

При запуске `go run main.go` вы должны видеть детальные ошибки. Теперь в ответе API будет поле `details` с текстом ошибки.

### 2. Наиболее частые причины

#### A. Таблицы не созданы

**Симптом:** Ошибка типа `relation "products" does not exist`

**Решение:**
```powershell
# Найдите psql (обычно в C:\Program Files\PostgreSQL\18\bin\)
# Или используйте pgAdmin

# Выполните миграции
psql -U postgres -d skryabin_ink -f ..\database\schema.sql
```

#### B. База данных не создана

**Симптом:** Ошибка типа `database "skryabin_ink" does not exist`

**Решение:**
```sql
-- В pgAdmin или через psql
CREATE DATABASE skryabin_ink;
```

Затем выполните миграции (см. выше).

#### C. Неправильные права доступа

**Симптом:** Ошибка типа `permission denied`

**Решение:**
Убедитесь, что пользователь из DATABASE_URL имеет права на базу данных:
```sql
GRANT ALL PRIVILEGES ON DATABASE skryabin_ink TO postgres;
```

#### D. Таблица products пустая

**Симптом:** Запрос выполняется, но возвращает пустой массив

**Решение:**
Это нормально, если в базе нет активных продуктов. Добавьте тестовые данные:
```sql
INSERT INTO products (title, description, price_cents, product_type, is_active)
VALUES 
  ('Тестовый продукт', 'Описание', 500000, 'session', TRUE);
```

## Быстрая проверка

### Вариант 1: Через скрипт (если psql доступен)
```powershell
.\test-db.ps1
```

### Вариант 2: Через pgAdmin

1. Откройте pgAdmin
2. Подключитесь к серверу
3. Выберите базу `skryabin_ink`
4. Выполните запрос:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Должны быть таблицы: `users`, `products`, `styles`, `orders`, и т.д.

5. Проверьте таблицу products:
```sql
SELECT * FROM products WHERE is_active = TRUE;
```

## Проверка через API

После исправления, проверьте ответ API:

```powershell
# Должен вернуть JSON с данными или пустым массивом items
curl http://localhost:3000/api/catalog
```

Если ошибка 500, проверьте поле `details` в ответе - там будет точная ошибка.

## Пример правильного ответа

```json
{
  "ok": true,
  "items": [
    {
      "id": 1,
      "title": "Тестовый продукт",
      "description": "Описание",
      "price_cents": 500000,
      "product_type": "session",
      "style": null
    }
  ]
}
```

## Если проблема осталась

1. Проверьте логи бэкенда - там будет детальная ошибка
2. Проверьте ответ API - поле `details` содержит текст ошибки
3. Убедитесь, что PostgreSQL запущен
4. Проверьте DATABASE_URL в `.env`





