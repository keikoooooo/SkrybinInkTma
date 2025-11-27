# Объяснение переменных окружения

## VITE_API_BASE_URL

### Что это?

`VITE_API_BASE_URL` - это базовый URL для API запросов фронтенда к бэкенду.

### Когда используется?

**В режиме разработки (dev):**
- НЕ используется! Вместо этого работает прокси из `vite.config.ts`
- Все запросы к `/api/*` автоматически проксируются на `http://localhost:3000`

**В production (после сборки):**
- Используется для указания URL бэкенда
- Фронтенд делает запросы напрямую на этот URL

### Как работает?

```typescript
// src/utils/api.ts

const getApiBaseUrl = (): string => {
  // В dev режиме (npm run dev)
  if (import.meta.env.DEV) {
    return '' // Пустая строка = используем прокси
  }
  
  // В production (npm run build)
  // Используем переменную окружения или дефолт
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
}
```

### Примеры использования

#### Режим разработки
```env
# .env (не обязательно, т.к. используется прокси)
VITE_API_BASE_URL=http://localhost:3000
```

**Что происходит:**
1. Фронтенд запущен на `http://localhost:5173`
2. Делается запрос к `/api/catalog`
3. Vite прокси перехватывает и отправляет на `http://localhost:3000/api/catalog`
4. Бэкенд обрабатывает и возвращает данные

#### Production (после деплоя)
```env
# .env для production
VITE_API_BASE_URL=https://your-backend.railway.app
```

**Что происходит:**
1. Фронтенд задеплоен на `https://your-frontend.railway.app`
2. Делается запрос к `/api/catalog`
3. Функция `getApiBaseUrl()` возвращает `https://your-backend.railway.app`
4. Формируется полный URL: `https://your-backend.railway.app/api/catalog`
5. Запрос идет напрямую на бэкенд

### Почему в примере указан порт 8080?

В вашем примере:
```env
VITE_API_BASE_URL=http://localhost:8080
```

Это **неправильно** для вашего проекта! Должно быть:

```env
VITE_API_BASE_URL=http://localhost:3000
```

**Почему?**
- Ваш Go бэкенд запущен на порту **3000** (см. `main.go`)
- Порт 8080 - это стандартный порт для Java приложений или других сервисов
- Если указать 8080, запросы пойдут не туда, и будут ошибки подключения

### Правильная настройка

#### Для локальной разработки

**Вариант 1: Использовать прокси (рекомендуется)**
```env
# .env можно не создавать или оставить пустым
# Прокси из vite.config.ts будет работать автоматически
```

**Вариант 2: Указать напрямую**
```env
VITE_API_BASE_URL=http://localhost:3000
```

#### Для production (Railway/Render/etc)

```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

### Важные замечания

1. **Префикс VITE_**
   - Vite читает только переменные с префиксом `VITE_`
   - Без префикса переменная не будет доступна в коде

2. **Встраивается в код при сборке**
   - При `npm run build` значение встраивается в JavaScript
   - После сборки изменить нельзя без пересборки

3. **HTTPS в production**
   - Telegram Mini App требует HTTPS
   - Используйте `https://` в production

### Проверка

Чтобы проверить, какой URL используется:

```typescript
// В консоли браузера (F12)
console.log(import.meta.env.VITE_API_BASE_URL)
console.log(import.meta.env.DEV) // true в dev, false в production
```

### Исправление

Измените в `.env`:
```env
# Было (неправильно):
VITE_API_BASE_URL=http://localhost:8080

# Должно быть:
VITE_API_BASE_URL=http://localhost:3000
```

Или удалите строку совсем - прокси будет работать автоматически в dev режиме.








