# Skryabin Ink Backend (Go)

Backend API для Telegram Mini App тату-студии Skryabin Ink, написанный на Go.

## Требования

- Go 1.21 или выше
- PostgreSQL 12 или выше
- Telegram Bot Token

## Установка

1. Клонируйте репозиторий и перейдите в директорию:
```bash
cd server-go
```

2. Установите зависимости:
```bash
go mod download
```

3. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

4. Заполните переменные окружения в `.env`:
- `BOT_TOKEN` - токен вашего Telegram бота
- `DATABASE_URL` - строка подключения к PostgreSQL
- `PORT` - порт для запуска сервера (по умолчанию 3000)
- `CORS_ORIGIN` - разрешенные источники для CORS (через запятую)

5. Создайте базу данных и выполните миграции:
```bash
psql -U postgres -d skryabin_ink -f ../database/schema.sql
```

## Запуск

### Режим разработки

```bash
go run main.go
```

### Production

Соберите бинарный файл:
```bash
go build -o skryabin-ink-server main.go
```

Запустите:
```bash
./skryabin-ink-server
```

## API Endpoints

### Аутентификация
- `POST /api/session` - Создание/обновление сессии пользователя через Telegram initData

### Каталог и продукты
- `GET /api/catalog` - Получить каталог продуктов
- `GET /api/products` - Получить все продукты
- `GET /api/products/:id` - Получить продукт по ID

### Заказы
- `GET /api/orders/:userId` - Получить заказы пользователя
- `POST /api/orders` - Создать заказ (требует аутентификации)
- `GET /api/orders/:userId/:orderId` - Получить заказ по ID
- `PUT /api/orders/:id` - Обновить заказ (требует аутентификации)
- `DELETE /api/orders/:id` - Отменить заказ (требует аутентификации)

### Профиль
- `GET /api/profile/:userId` - Получить профиль пользователя (требует аутентификации)
- `PUT /api/profile/:userId` - Обновить профиль (требует аутентификации)

### Работы и художники
- `GET /api/works` - Получить работы (опционально: `?artist_id=`, `?style_id=`)
- `GET /api/works/:id` - Получить работу по ID
- `GET /api/artists` - Получить всех художников
- `GET /api/artists/:id` - Получить художника по ID
- `GET /api/styles` - Получить все стили

### Избранное
- `GET /api/favorites/:userId` - Получить избранное пользователя (требует аутентификации)
- `POST /api/favorites` - Добавить в избранное (требует аутентификации)
- `DELETE /api/favorites/:id` - Удалить из избранного (требует аутентификации)

### Отзывы
- `GET /api/reviews` - Получить отзывы (опционально: `?artist_id=`, `?work_id=`, `?published=true`)
- `GET /api/reviews/:id` - Получить отзыв по ID
- `POST /api/reviews` - Создать отзыв (требует аутентификации)
- `PUT /api/reviews/:id` - Обновить отзыв (требует аутентификации)
- `DELETE /api/reviews/:id` - Удалить отзыв (требует аутентификации)

### Депозиты
- `GET /api/deposits/:userId` - Получить депозиты пользователя (требует аутентификации)
- `POST /api/deposits` - Создать депозит (требует аутентификации)

### Записи
- `GET /api/appointments/:userId` - Получить записи пользователя (требует аутентификации)
- `POST /api/appointments` - Создать запись (требует аутентификации)
- `PUT /api/appointments/:id` - Обновить запись (требует аутентификации)

### Админские endpoints (требуют роль admin)
- `GET /api/admin/requests` - Получить все заявки
- `GET /api/admin/orders` - Получить все заказы (опционально: `?status=`)
- `PUT /api/admin/orders/:id/status` - Обновить статус заказа
- `GET /api/admin/users` - Получить всех пользователей
- `PUT /api/admin/users/:id/role` - Обновить роль пользователя
- `POST /api/admin/products` - Создать продукт
- `PUT /api/admin/products/:id` - Обновить продукт
- `DELETE /api/admin/products/:id` - Удалить продукт
- `POST /api/admin/works` - Создать работу
- `PUT /api/admin/works/:id` - Обновить работу
- `DELETE /api/admin/works/:id` - Удалить работу
- `POST /api/admin/artists` - Создать художника
- `PUT /api/admin/artists/:id` - Обновить художника
- `DELETE /api/admin/artists/:id` - Удалить художника

## Аутентификация

API использует валидацию Telegram WebApp initData для аутентификации. После успешной валидации, user ID передается через:
- Заголовок `X-User-ID`
- Параметр URL `userId`
- Параметр пути `:userId`

## Структура проекта

```
server-go/
├── main.go                 # Точка входа
├── go.mod                  # Зависимости
├── internal/
│   ├── database/          # Подключение к БД
│   ├── handlers/          # HTTP обработчики
│   ├── middleware/        # Middleware (аутентификация, CORS)
│   ├── models/            # Модели данных
│   └── utils/             # Утилиты (валидация Telegram)
└── README.md
```

## Лицензия

MIT

