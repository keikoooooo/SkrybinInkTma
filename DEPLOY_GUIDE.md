# Полное руководство по деплою

## 🚀 Быстрый деплой на Railway (рекомендуется)

### Шаг 1: Подготовка репозитория

1. Убедитесь, что все изменения закоммичены в Git
2. Запушьте в GitHub/GitLab

### Шаг 2: Деплой бэкенда

1. Зарегистрируйтесь на https://railway.app
2. Создайте новый проект
3. Нажмите "New" → "Database" → "Add PostgreSQL"
4. Нажмите "New" → "GitHub Repo" → выберите ваш репозиторий
5. В настройках сервиса:
   - **Root Directory**: `server-go`
   - **Build Command**: (оставьте пустым, Railway определит автоматически)
   - **Start Command**: `./main` (или `go run main.go` для разработки)

6. Добавьте переменные окружения:
   - `BOT_TOKEN` - токен вашего Telegram бота
   - `DATABASE_URL` - нажмите "Add Reference" → выберите PostgreSQL → переменная создастся автоматически
   - `PORT` - Railway установит автоматически (можно оставить пустым)
   - `CORS_ORIGIN` - URL вашего фронтенда (укажите после деплоя фронтенда)

7. Railway автоматически соберет и задеплоит бэкенд
8. Скопируйте домен бэкенда (например: `your-backend.railway.app`)

### Шаг 3: Деплой фронтенда

1. В том же проекте Railway нажмите "New" → "GitHub Repo"
2. Выберите тот же репозиторий
3. В настройках:
   - **Root Directory**: `.` (корень проекта)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview` (или используйте Static Site)

4. Добавьте переменные окружения:
   - `VITE_API_BASE_URL` - URL вашего бэкенда (например: `https://your-backend.railway.app`)

5. Railway соберет и задеплоит фронтенд
6. Скопируйте домен фронтенда (например: `your-frontend.railway.app`)

### Шаг 4: Настройка BotFather

1. Откройте @BotFather в Telegram
2. Выберите вашего бота
3. Отправьте `/newapp` или `/editapp`
4. Выберите бота
5. Введите название приложения
6. Введите описание
7. Загрузите фото (опционально)
8. **Важно**: В поле "Web App URL" введите HTTPS URL вашего фронтенда:
   ```
   https://your-frontend.railway.app
   ```
9. Сохраните

### Шаг 5: Обновление CORS

1. Вернитесь в настройки бэкенда на Railway
2. Обновите переменную `CORS_ORIGIN`:
   ```
   https://your-frontend.railway.app
   ```
3. Перезапустите сервис

### Шаг 6: Выполнение миграций

1. Подключитесь к базе данных через Railway Dashboard
2. Или используйте psql:
   ```bash
   # Получите DATABASE_URL из Railway
   psql $DATABASE_URL -f database/schema.sql
   ```

## 🔧 Альтернативные платформы

### Render.com

**Бэкенд:**
- Web Service
- Build: `cd server-go && go build -o main .`
- Start: `./main`
- Добавьте PostgreSQL

**Фронтенд:**
- Static Site
- Build: `npm run build`
- Publish: `dist`

### Fly.io

```bash
# Установите flyctl
iwr https://fly.io/install.ps1 -useb | iex

# Войдите
fly auth login

# В папке server-go
fly launch

# Деплой
fly deploy
```

## ✅ Проверка работы

1. Откройте ваш фронтенд в браузере
2. Проверьте консоль браузера (F12) на ошибки
3. Проверьте логи бэкенда на Railway
4. Протестируйте через Telegram Mini App

## 🐛 Troubleshooting

### CORS ошибки
- Убедитесь, что `CORS_ORIGIN` в бэкенде указывает на правильный URL фронтенда
- Проверьте, что используется HTTPS

### База данных не подключена
- Проверьте `DATABASE_URL` в переменных окружения
- Убедитесь, что миграции выполнены

### Фронтенд не загружается
- Проверьте `VITE_API_BASE_URL`
- Убедитесь, что бэкенд доступен по указанному URL

## 📝 Важные замечания

- Всегда используйте HTTPS для Telegram Mini App
- Храните секреты (BOT_TOKEN) в переменных окружения, не в коде
- Регулярно делайте бэкапы базы данных
- Мониторьте логи на ошибки

