# Полное объяснение кода приложения Skryabin Ink

## 📋 Содержание

1. [Архитектура приложения](#архитектура)
2. [База данных](#база-данных)
3. [Бэкенд (Go)](#бэкенд-go)
4. [Фронтенд (React/TypeScript)](#фронтенд-reacttypescript)
5. [Интеграция](#интеграция)

---

## 🏗️ Архитектура

Приложение состоит из трех основных частей:

```
┌─────────────────┐
│  Telegram Mini  │
│      App        │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐      ┌──────────────┐
│   Frontend      │◄────►│   Backend    │
│  (React/Vite)   │ HTTP │   (Go/Gin)   │
└─────────────────┘      └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │  PostgreSQL  │
                          │   Database   │
                          └──────────────┘
```

---

## 🗄️ База данных

### Схема (database/schema.sql)

База данных состоит из следующих таблиц:

#### 1. **users** - Пользователи Telegram
```sql
- id (BIGINT) - ID пользователя из Telegram (PRIMARY KEY)
- username, first_name, last_name - данные из Telegram
- role - роль пользователя ('client' или 'admin')
- balance_cents - баланс в копейках
- bonus_points - бонусные баллы
- personal_discount - персональная скидка в процентах
```

#### 2. **artists** - Тату-мастера
```sql
- id (SERIAL) - автоинкремент
- display_name - имя мастера
- bio - биография
- avatar_url - фото мастера
- is_active - активен ли мастер
```

#### 3. **styles** - Стили татуировок
```sql
- id (SERIAL)
- code - уникальный код стиля ('sleeve', 'back', 'leg', etc.)
- title - название стиля
- description - описание
```

#### 4. **works** - Работы (портфолио)
```sql
- id (SERIAL)
- artist_id - ссылка на мастера
- style_id - ссылка на стиль
- image_url - URL изображения работы
- caption - подпись к работе
```

#### 5. **products** - Товары/Услуги
```sql
- id (SERIAL)
- style_id - стиль татуировки
- title - название товара
- description - описание
- price_cents - цена в копейках
- product_type - тип ('session', 'certificate', 'merch')
- is_active - активен ли товар
```

#### 6. **orders** - Заказы
```sql
- id (SERIAL)
- user_id - пользователь (BIGINT, ссылка на Telegram ID)
- status - статус ('draft', 'pending', 'paid', 'scheduled', 'cancelled')
- total_cents - общая сумма в копейках
- promo_code - промокод
- comment - комментарий пользователя
- scheduled_at - дата сеанса
```

#### 7. **order_items** - Элементы заказа
```sql
- id (SERIAL)
- order_id - ссылка на заказ
- product_id - товар
- quantity - количество
- price_cents - цена на момент заказа
- body_zone - зона тела для тату
- notes - заметки
```

#### 8. **appointments** - Записи на сеансы
```sql
- id (SERIAL)
- order_id - ссылка на заказ
- artist_id - мастер
- scheduled_at - дата и время сеанса
- status - статус записи
- comment - комментарий
```

#### 9. **favorites** - Избранное
```sql
- id (SERIAL)
- user_id - пользователь
- work_id - работа
- UNIQUE (user_id, work_id) - один пользователь не может добавить работу дважды
```

#### 10. **reviews** - Отзывы
```sql
- id (SERIAL)
- user_id - автор отзыва
- artist_id - мастер (опционально)
- work_id - работа (опционально)
- rating - оценка (1-5)
- content - текст отзыва
- is_published - опубликован ли
```

#### 11. **deposits** - Депозиты/Сертификаты
```sql
- id (SERIAL)
- user_id - пользователь
- amount_cents - сумма в копейках
- certificate_code - код сертификата
- expires_at - срок действия
```

#### 12. **notifications** - Уведомления
```sql
- id (SERIAL)
- user_id - получатель
- type - тип уведомления
- payload - данные в JSON
- sent_at - время отправки
```

### Триггеры

Автоматическое обновление `updated_at` при изменении записей в таблицах:
- `users`
- `products`
- `orders`

---

## 🔧 Бэкенд (Go)

### Структура проекта

```
server-go/
├── main.go                 # Точка входа, настройка сервера
├── go.mod                  # Зависимости
├── internal/
│   ├── database/          # Подключение к БД
│   ├── handlers/          # HTTP обработчики (бизнес-логика)
│   ├── middleware/        # Middleware (аутентификация, CORS)
│   ├── models/            # Модели данных (структуры)
│   └── utils/             # Утилиты (валидация Telegram)
```

### main.go - Точка входа

```go
1. Загружает переменные окружения из .env
2. Подключается к PostgreSQL
3. Создает экземпляр handlers (обработчиков)
4. Настраивает Gin роутер
5. Добавляет middleware:
   - CORS (разрешает запросы с фронтенда)
   - Database в контекст (для доступа к БД)
6. Регистрирует все API маршруты
7. Запускает HTTP сервер на порту 3000
```

**Ключевые моменты:**
- Использует Gin для HTTP сервера
- CORS настроен для работы с фронтендом
- Все маршруты под `/api`
- Middleware для аутентификации на защищенных маршрутах

### internal/database/database.go

```go
// Инициализирует подключение к PostgreSQL
func InitDB() (*sql.DB, error)
```

- Читает `DATABASE_URL` из переменных окружения
- Создает пул соединений (макс. 25 открытых, 5 простаивающих)
- Возвращает объект `*sql.DB` для работы с БД

### internal/models/models.go

Содержит все структуры данных Go, соответствующие таблицам БД:

```go
type User struct {
    ID int64
    Username *string
    FirstName *string
    // ... и т.д.
}

type Product struct {
    ID int
    Title string
    PriceCents int
    // ...
}
```

Также содержит DTO (Data Transfer Objects) для запросов:
- `CreateOrderRequest` - данные для создания заказа
- `CreateReviewRequest` - данные для создания отзыва
- и т.д.

### internal/utils/telegram.go

**ValidateTelegramInitData** - валидирует данные от Telegram WebApp:

```go
1. Парсит initData (query string от Telegram)
2. Извлекает hash
3. Создает dataCheckString из всех параметров (кроме hash)
4. Вычисляет секретный ключ: HMAC-SHA256("WebAppData", BOT_TOKEN)
5. Вычисляет hash: HMAC-SHA256(secret, dataCheckString)
6. Сравнивает с полученным hash
7. Если совпадает - данные валидны
```

Это защита от подделки данных пользователя.

### internal/middleware/auth.go

#### RequireAuth()

Проверяет, что пользователь аутентифицирован:
1. Ищет `userID` в заголовке `X-User-ID`, query параметре или path параметре
2. Парсит в `int64`
3. Сохраняет в контекст Gin
4. Если не найден - возвращает 401

#### RequireAdmin()

Проверяет, что пользователь - администратор:
1. Получает `userID` из контекста (или из запроса)
2. Получает БД из контекста
3. Проверяет роль пользователя в БД
4. Если не admin - возвращает 403
5. Если admin - пропускает дальше

### internal/handlers/

Обработчики HTTP запросов. Каждый файл отвечает за свою область:

#### handlers.go - Основные эндпоинты

**CreateSession** (`POST /api/session`):
```go
1. Получает initData от клиента
2. Валидирует через ValidateTelegramInitData
3. Извлекает данные пользователя из initData
4. Создает или обновляет пользователя в БД (UPSERT)
5. Возвращает данные пользователя
```

**GetCatalog** (`GET /api/catalog`):
```go
1. Делает SQL запрос: SELECT products + styles
2. Фильтрует только активные товары (is_active = TRUE)
3. Возвращает список товаров с ценами
```

**CreateOrder** (`POST /api/orders`):
```go
1. Получает userID из контекста (middleware)
2. Валидирует данные заказа
3. Вычисляет общую сумму
4. Начинает транзакцию БД
5. Создает заказ в таблице orders
6. Создает элементы заказа в order_items
7. Коммитит транзакцию
8. Возвращает созданный заказ
```

**GetUserOrders** (`GET /api/orders/:userId`):
```go
1. Получает все заказы пользователя
2. Для каждого заказа загружает order_items
3. Возвращает массив заказов с элементами
```

#### profile.go - Профиль пользователя

**GetProfile** - получает данные профиля из БД
**UpdateProfile** - обновляет данные профиля (имя, фото и т.д.)

#### works.go - Работы и художники

**GetWorks** - список работ (можно фильтровать по artist_id, style_id)
**GetArtists** - список активных художников
**GetStyles** - список стилей

#### favorites.go - Избранное

**GetFavorites** - список избранных работ пользователя
**AddFavorite** - добавляет работу в избранное
**RemoveFavorite** - удаляет из избранного

#### reviews.go - Отзывы

**GetReviews** - список отзывов (можно фильтровать)
**CreateReview** - создает отзыв (требует авторизации)
**UpdateReview** - обновляет свой отзыв
**DeleteReview** - удаляет свой отзыв

#### deposits.go - Депозиты и записи

**GetDeposits** - список депозитов пользователя
**CreateDeposit** - создает депозит и обновляет баланс пользователя
**GetAppointments** - список записей на сеансы
**CreateAppointment** - создает запись
**UpdateAppointment** - обновляет запись

#### admin.go - Админские функции

**GetAdminRequests** - все заявки (заказы со статусом draft/pending)
**GetAllOrders** - все заказы (можно фильтровать по статусу)
**UpdateOrderStatus** - изменение статуса заказа
**GetAllUsers** - список всех пользователей
**UpdateUserRole** - изменение роли пользователя
**CreateProduct/UpdateProduct/DeleteProduct** - управление товарами
**CreateWork/UpdateWork/DeleteWork** - управление работами
**CreateArtist/UpdateArtist/DeleteArtist** - управление художниками

---

## 🎨 Фронтенд (React/TypeScript)

### Структура проекта

```
src/
├── main.tsx              # Точка входа React
├── App.tsx                # Главный компонент с роутингом
├── components/            # Переиспользуемые компоненты
│   ├── AppLayout.tsx     # Обертка с навигацией
│   ├── TopBar.tsx        # Верхняя панель
│   ├── BottomNav.tsx     # Нижняя навигация
│   └── AddToCartButton.tsx
├── pages/                 # Страницы приложения
│   ├── HomePage.tsx
│   ├── CatalogPage.tsx
│   ├── CartPage.tsx
│   ├── ProfilePage.tsx
│   ├── OrderPage.tsx
│   ├── OrdersPage.tsx
│   ├── AdminProfilePage.tsx
│   └── RequestsPage.tsx
├── hooks/                 # React хуки
│   └── useTelegram.ts    # Работа с Telegram WebApp
├── context/               # React Context
│   └── CartContext.tsx   # Состояние корзины
└── utils/                 # Утилиты
    └── api.ts            # API клиент
```

### main.tsx - Точка входа

```tsx
1. Создает React root
2. Оборачивает в BrowserRouter (роутинг)
3. Оборачивает в CartProvider (контекст корзины)
4. Рендерит App компонент
```

### App.tsx - Роутинг

Определяет все маршруты приложения:
- `/profile` - профиль
- `/catalog` - каталог товаров
- `/cart` - корзина
- `/order/:id` - страница заказа
- `/orders` - список заказов
- `/home` - главная
- `/profile/admin` - админка

### hooks/useTelegram.ts

**useTelegram** - хук для работы с Telegram WebApp:

```tsx
1. Получает объект Telegram.WebApp из window.Telegram
2. Вызывает tg.ready() и tg.expand()
3. Извлекает данные пользователя из tg.initDataUnsafe.user
4. Отправляет initData на бэкенд для валидации и создания сессии
5. Возвращает:
   - webApp - объект Telegram WebApp
   - user - данные пользователя
   - themeParams - тема Telegram
   - isSyncing - идет ли синхронизация
   - syncError - ошибка синхронизации
```

### context/CartContext.tsx

**CartProvider** - контекст для управления корзиной:

```tsx
Состояние:
- items: CartItem[] - товары в корзине
- total - общая сумма
- itemCount - количество товаров

Методы:
- addItem() - добавить товар
- removeItem() - удалить товар
- updateQuantity() - изменить количество
- clearCart() - очистить корзину

Хранение:
- Сохраняет корзину в localStorage для каждого пользователя
- Ключ: `cart_${userId}`
```

### utils/api.ts

**API клиент** - централизованная работа с бэкендом:

```tsx
getApiBaseUrl():
- В dev режиме: возвращает '' (использует прокси Vite)
- В production: возвращает VITE_API_BASE_URL

apiRequest<T>():
- Базовый fetch с обработкой ошибок
- Автоматически добавляет Content-Type: application/json
- Парсит JSON ответ
- Бросает ошибку если response.ok === false

API объект:
- Содержит методы для всех эндпоинтов
- Типизированные методы (apiGet<T>, apiPost<T>, etc.)
- Автоматически добавляет заголовки аутентификации
```

### components/AppLayout.tsx

Обертка для всех страниц:
- Определяет активный пункт навигации по URL
- Показывает TopBar и BottomNav
- Рендерит дочерние страницы через `<Outlet />`

### components/BottomNav.tsx

Нижняя навигация:
- 5 пунктов: Профиль, Ассортимент, Заявки, Главная, Корзина
- Показывает badge с количеством товаров в корзине
- Подсвечивает активный пункт

### pages/CatalogPage.tsx

Каталог товаров:

```tsx
1. При загрузке вызывает API.catalog.get()
2. Показывает loading состояние
3. Отображает список товаров из БД
4. Для каждого товара показывает:
   - Название
   - Описание
   - Цену
   - Кнопку "Добавить" (AddToCartButton)
5. Обрабатывает ошибки
```

### pages/CartPage.tsx

Корзина:

```tsx
1. Получает товары из CartContext
2. Показывает каждый товар с:
   - Кнопками +/- для изменения количества
   - Ценой
   - Кнопкой удаления
3. Показывает общую сумму
4. Поле для промокода/комментария
5. Кнопка "Оформить заказ":
   - Создает заказ через API.orders.create()
   - Перенаправляет на страницу заказа
   - Очищает корзину
```

### pages/ProfilePage.tsx

Профиль пользователя:

```tsx
1. Загружает данные профиля из БД через API.profile.get()
2. Показывает:
   - Аватар (из Telegram или БД)
   - Имя, username, ID
   - Баланс, бонусы, скидку (из БД)
3. Меню с ссылками:
   - Избранное
   - Отзывы
   - Мои заказы
   - Депозиты
4. Если пользователь admin - показывает ссылку на админку
```

### pages/OrderPage.tsx

Страница заказа:

```tsx
1. Получает ID заказа из URL параметров
2. Загружает данные заказа через API.orders.getOrder()
3. Показывает:
   - Номер заказа
   - Статус
   - Список товаров
   - Общую сумму
   - Комментарий
   - Дату создания/сеанса
4. Кнопка "Оплатить" (если статус draft/pending):
   - Обновляет статус на 'paid'
   - Перенаправляет на список заказов
```

### pages/AdminProfilePage.tsx

Админка:

```tsx
1. Загружает заявки через API.admin.requests()
2. Показывает список заявок с:
   - Именем пользователя
   - Контактом
   - Описанием
   - Суммой
   - Статусом
   - Датой сеанса
3. Кнопка для копирования информации о заявке
```

### pages/HomePage.tsx

Главная страница:

```tsx
1. Загружает работы через API.works.getAll()
2. Показывает:
   - Hero секцию с названием студии
   - Информацию об основателе
   - Галерею работ (первые 3)
3. Ссылка на каталог
```

### vite.config.ts

Конфигурация Vite:

```ts
1. Настраивает React plugin
2. Прокси для API:
   - Все запросы к /api/* проксируются на http://localhost:3000
   - Это решает проблему CORS в dev режиме
3. Алиасы для импортов (@ → src/)
```

---

## 🔗 Интеграция

### Как работает поток данных

1. **Пользователь открывает приложение в Telegram**
   - Telegram загружает HTML страницу
   - React приложение инициализируется
   - `useTelegram` получает данные пользователя

2. **Синхронизация сессии**
   - `useTelegram` отправляет `initData` на `/api/session`
   - Бэкенд валидирует через `ValidateTelegramInitData`
   - Создает/обновляет пользователя в БД
   - Возвращает данные пользователя

3. **Загрузка данных**
   - Фронтенд делает запросы к API через `api.ts`
   - В dev режиме: запросы идут через прокси Vite
   - В production: запросы идут напрямую на бэкенд
   - Бэкенд делает SQL запросы к PostgreSQL
   - Возвращает JSON данные

4. **Создание заказа**
   - Пользователь добавляет товары в корзину (localStorage)
   - Нажимает "Оформить заказ"
   - Фронтенд отправляет данные на `/api/orders`
   - Бэкенд создает заказ в БД (транзакция)
   - Возвращает созданный заказ
   - Фронтенд перенаправляет на страницу заказа

### Безопасность

1. **Валидация Telegram initData**
   - Защищает от подделки данных пользователя
   - Использует HMAC-SHA256 с секретным ключом

2. **Middleware аутентификации**
   - Проверяет наличие userID в запросе
   - Проверяет права доступа (admin)

3. **CORS**
   - Разрешает запросы только с указанных доменов
   - Защищает от CSRF атак

4. **SQL Injection защита**
   - Все запросы используют параметризованные запросы ($1, $2, etc.)
   - Никогда не используется конкатенация строк в SQL

---

## 📝 Ключевые паттерны

### 1. Repository Pattern (подразумевается)
- Handlers работают напрямую с БД
- Можно вынести в отдельный слой для лучшей архитектуры

### 2. Context API (React)
- CartContext для глобального состояния корзины
- Избегает prop drilling

### 3. Custom Hooks
- `useTelegram` - инкапсулирует логику работы с Telegram
- `useCart` - доступ к корзине из любого компонента

### 4. API Client Pattern
- Централизованный клиент API
- Единая обработка ошибок
- Типизация TypeScript

### 5. Middleware Pattern (Go)
- RequireAuth - проверка аутентификации
- RequireAdmin - проверка прав
- CORS - обработка CORS заголовков

---

## 🔄 Типичный flow запроса

### Пример: Создание заказа

```
┌─────────────┐
│  Пользователь│
│  нажимает   │
│ "Оформить"  │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  CartPage.tsx    │
│  handleCheckout()│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  API.orders.     │
│  create()        │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  api.ts          │
│  apiPost()       │
│  POST /api/orders│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Vite Proxy      │
│  /api → :3000    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  main.go         │
│  Gin Router      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  RequireAuth()   │
│  middleware      │
│  Проверка userID │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  CreateOrder()   │
│  handler         │
│  1. Валидация    │
│  2. Транзакция   │
│  3. INSERT orders│
│  4. INSERT items │
│  5. COMMIT       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  PostgreSQL      │
│  Сохранение      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  JSON Response   │
│  {ok: true, ...} │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Frontend        │
│  navigate()      │
│  /order/:id      │
└──────────────────┘
```

### Пример: Загрузка каталога

```
1. CatalogPage монтируется (useEffect)
   ↓
2. Вызывает API.catalog.get()
   ↓
3. GET /api/catalog
   ↓
4. Handler GetCatalog()
   ↓
5. SQL: SELECT products + styles WHERE is_active
   ↓
6. Возвращает JSON: {ok: true, items: [...]}
   ↓
7. CatalogPage обновляет state
   ↓
8. Рендерит список товаров
```

---

## 🎯 Основные концепции

### Go (бэкенд)
- **Goroutines** - не используются (можно добавить для параллельной обработки)
- **Channels** - не используются
- **Interfaces** - не используются (можно добавить для тестирования)
- **Error handling** - явная проверка всех ошибок
- **SQL** - параметризованные запросы для безопасности

### React (фронтенд)
- **Hooks** - useState, useEffect, useContext
- **Context API** - для глобального состояния
- **React Router** - для навигации
- **TypeScript** - для типобезопасности
- **Vite** - для сборки и dev сервера

### База данных
- **PostgreSQL** - реляционная БД
- **Foreign Keys** - связи между таблицами
- **Triggers** - автоматическое обновление updated_at
- **Transactions** - для атомарности операций

---

Это полная архитектура и объяснение всего кода приложения! 🚀

