# Решение ошибки "failed to fetch"

## 🔍 Диагностика

Ошибка "failed to fetch" означает, что браузер не смог выполнить HTTP запрос. Возможные причины:

### 1. Бэкенд не запущен

**Симптом:** Ошибка в консоли браузера, запрос не доходит до сервера

**Решение:**
```powershell
cd server-go
go run main.go
```

Должно появиться: `Server starting on port 8080`

**Проверка:**
Откройте в браузере: `http://localhost:8080/health`
Должен вернуть: `{"status":"ok"}`

### 2. Неправильный порт

**Симптом:** Запрос идет на другой порт

**Проверьте:**
- `vite.config.ts` - прокси должен быть на `http://localhost:8080`
- `.env` бэкенда - `PORT=8080`
- Бэкенд действительно запущен на 8080

### 3. CORS ошибка

**Симптом:** В консоли браузера ошибка типа "CORS policy"

**Решение:**
Проверьте `CORS_ORIGIN` в `.env` бэкенда:
```env
CORS_ORIGIN=http://localhost:5173
```

Или оставьте пустым для разрешения всех источников в dev режиме.

### 4. База данных не подключена

**Симптом:** Бэкенд запускается, но падает с ошибкой БД

**Решение:**
1. Проверьте `DATABASE_URL` в `.env`
2. Убедитесь, что PostgreSQL запущен
3. Выполните миграции: `psql -U postgres -d skryabin_ink -f ../database/schema.sql`

### 5. Прокси не работает

**Симптом:** Запросы идут напрямую, а не через прокси

**Решение:**
1. Убедитесь, что используете `npm run dev` (не `npm run build`)
2. Проверьте `vite.config.ts` - прокси должен быть настроен
3. Перезапустите dev сервер

## 🔧 Пошаговая проверка

### Шаг 1: Проверьте бэкенд

```powershell
# В терминале 1
cd server-go
go run main.go
```

Должно быть:
```
Server starting on port 8080
```

### Шаг 2: Проверьте доступность

Откройте в браузере: `http://localhost:8080/health`

Должен вернуть JSON: `{"status":"ok"}`

Если не открывается:
- Проверьте, что порт 8080 не занят другим приложением
- Проверьте файрвол
- Попробуйте другой порт

### Шаг 3: Проверьте фронтенд

```powershell
# В терминале 2
npm run dev
```

Откройте: `http://localhost:5173`

### Шаг 4: Проверьте консоль браузера

Нажмите F12 → Console tab

Ищите:
- Ошибки сети (Network tab)
- CORS ошибки
- Детали запроса

### Шаг 5: Проверьте Network tab

F12 → Network tab → перезагрузите страницу

Найдите запрос к `/api/catalog`:
- Status должен быть 200 (не CORS, не failed)
- Response должен содержать JSON

## 🐛 Типичные ошибки

### "NetworkError when attempting to fetch resource"
- Бэкенд не запущен
- Неправильный URL
- Проблемы с сетью

### "CORS policy: No 'Access-Control-Allow-Origin'"
- Неправильный `CORS_ORIGIN` в бэкенде
- Прокси не работает

### "Failed to connect to database"
- PostgreSQL не запущен
- Неправильный `DATABASE_URL`
- База данных не создана

## ✅ Быстрая проверка

Выполните все команды по порядку:

```powershell
# 1. Проверьте бэкенд
cd server-go
go run main.go
# Должно быть: Server starting on port 8080

# 2. В другом терминале проверьте доступность
curl http://localhost:8080/health
# Должно вернуть: {"status":"ok"}

# 3. Проверьте фронтенд
cd ..
npm run dev
# Откройте http://localhost:5173
```

## 📝 Логи для отладки

Добавьте в начало `apiRequest`:

```typescript
console.log('API Request:', {
  endpoint,
  baseUrl: getApiBaseUrl(),
  fullUrl: url,
  isDev: import.meta.env.DEV
})
```

Это покажет, куда именно идут запросы.

