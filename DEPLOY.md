# Деплой приложения

## Вариант 1: Railway (рекомендуется)

### Бэкенд (Go)

1. Зарегистрируйтесь на https://railway.app
2. Создайте новый проект
3. Добавьте PostgreSQL базу данных
4. Добавьте сервис из GitHub репозитория (папка `server-go`)
5. Настройте переменные окружения:
   - `BOT_TOKEN` - токен вашего Telegram бота
   - `DATABASE_URL` - автоматически из Railway PostgreSQL
   - `PORT` - Railway установит автоматически
   - `CORS_ORIGIN` - URL вашего фронтенда
6. Railway автоматически соберет и запустит приложение

### Фронтенд (Vite)

1. В том же проекте Railway добавьте новый сервис
2. Выберите папку с фронтендом (корень проекта)
3. Railway определит Node.js и установит зависимости
4. Настройте переменные окружения:
   - `VITE_API_BASE_URL` - URL вашего бэкенда (Railway даст домен)
5. Railway автоматически соберет и задеплоит фронтенд

### Получение HTTPS URL

После деплоя Railway даст вам домен типа `your-app.railway.app`. Используйте его в BotFather.

## Вариант 2: Render

### Бэкенд

1. Зарегистрируйтесь на https://render.com
2. Создайте новый Web Service
3. Подключите GitHub репозиторий
4. Укажите:
   - Build Command: `cd server-go && go build -o main .`
   - Start Command: `cd server-go && ./main`
5. Добавьте PostgreSQL базу данных
6. Настройте переменные окружения

### Фронтенд

1. Создайте Static Site
2. Подключите репозиторий
3. Build Command: `npm run build`
4. Publish Directory: `dist`

## Вариант 3: Fly.io

1. Установите flyctl: `iwr https://fly.io/install.ps1 -useb | iex`
2. Войдите: `fly auth login`
3. Инициализируйте: `fly launch` в папке `server-go`
4. Деплой: `fly deploy`

## Настройка BotFather

1. Откройте @BotFather в Telegram
2. Выберите вашего бота
3. `/newapp` или `/editapp`
4. Укажите HTTPS URL вашего фронтенда
5. Сохраните

## Важно

- Убедитесь, что CORS настроен правильно
- Проверьте, что все переменные окружения установлены
- База данных должна быть доступна из интернета
- Используйте HTTPS для Telegram Mini App





