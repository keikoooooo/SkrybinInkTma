# Примеры кода с объяснениями

## 🔧 Бэкенд (Go)

### Пример 1: Создание заказа

```go
// internal/handlers/handlers.go

func (h *Handlers) CreateOrder(c *gin.Context) {
    // 1. Получаем userID из контекста (добавлен middleware RequireAuth)
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
        return
    }

    // 2. Парсим JSON тело запроса в структуру
    var req models.CreateOrderRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
        return
    }

    // 3. Вычисляем общую сумму заказа
    totalCents := 0
    for _, item := range req.Items {
        // Получаем актуальную цену товара из БД
        var priceCents int
        err := h.db.QueryRow("SELECT price_cents FROM products WHERE id = $1", item.ProductID).Scan(&priceCents)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "product not found"})
            return
        }
        totalCents += priceCents * item.Quantity
    }

    // 4. Начинаем транзакцию БД
    // Транзакция гарантирует, что либо все операции выполнятся, либо ничего
    tx, err := h.db.Begin()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to start transaction"})
        return
    }
    defer tx.Rollback() // Откатит изменения если что-то пойдет не так

    // 5. Создаем заказ
    var orderID int
    orderQuery := `INSERT INTO orders (user_id, status, total_cents, promo_code, comment)
                   VALUES ($1, 'draft', $2, $3, $4)
                   RETURNING id`
    err = tx.QueryRow(orderQuery, userID, totalCents, req.PromoCode, req.Comment).Scan(&orderID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to create order"})
        return
    }

    // 6. Создаем элементы заказа
    for _, item := range req.Items {
        var priceCents int
        err := tx.QueryRow("SELECT price_cents FROM products WHERE id = $1", item.ProductID).Scan(&priceCents)
        if err != nil {
            return // Ошибка уже обработана выше
        }

        // Вставляем элемент заказа
        _, err = tx.Exec(
            `INSERT INTO order_items (order_id, product_id, quantity, price_cents, body_zone, notes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            orderID, item.ProductID, item.Quantity, priceCents, item.BodyZone, item.Notes,
        )
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to create order item"})
            return
        }
    }

    // 7. Коммитим транзакцию (сохраняем все изменения)
    if err := tx.Commit(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to commit transaction"})
        return
    }

    // 8. Загружаем созданный заказ и возвращаем клиенту
    // ... (код загрузки заказа)
    c.JSON(http.StatusCreated, gin.H{"ok": true, "order": order})
}
```

**Почему транзакция?**
- Если создание заказа успешно, но создание элементов заказа провалилось - заказ не должен остаться в БД
- Транзакция гарантирует атомарность: либо все, либо ничего

### Пример 2: Валидация Telegram initData

```go
// internal/utils/telegram.go

func ValidateTelegramInitData(initData string) (map[string]string, error) {
    // 1. Получаем BOT_TOKEN из переменных окружения
    botToken := os.Getenv("BOT_TOKEN")
    
    // 2. Парсим query string от Telegram
    // Формат: "user={...}&hash=abc123&auth_date=1234567890"
    params, err := url.ParseQuery(initData)
    
    // 3. Извлекаем hash (Telegram подпись)
    hash := params.Get("hash")
    params.Del("hash") // Удаляем hash из параметров для проверки
    
    // 4. Создаем строку для проверки
    // Формат: "auth_date=1234567890\nuser={...}" (отсортировано)
    var pairs []string
    for key, values := range params {
        pairs = append(pairs, fmt.Sprintf("%s=%s", key, values[0]))
    }
    sort.Strings(pairs) // Важно: сортировка по алфавиту
    dataCheckString := strings.Join(pairs, "\n")
    
    // 5. Вычисляем секретный ключ
    // HMAC-SHA256("WebAppData", BOT_TOKEN)
    secretKey := hmac.New(sha256.New, []byte("WebAppData"))
    secretKey.Write([]byte(botToken))
    secret := secretKey.Sum(nil)
    
    // 6. Вычисляем hash
    // HMAC-SHA256(secret, dataCheckString)
    hashKey := hmac.New(sha256.New, secret)
    hashKey.Write([]byte(dataCheckString))
    calculatedHash := hex.EncodeToString(hashKey.Sum(nil))
    
    // 7. Сравниваем с полученным hash
    if calculatedHash != hash {
        return nil, fmt.Errorf("invalid hash")
    }
    
    return params, nil
}
```

**Зачем это нужно?**
- Telegram отправляет данные пользователя в открытом виде
- Hash - это подпись, которая доказывает, что данные пришли от Telegram
- Без проверки злоумышленник мог бы подделать данные пользователя

---

## 🎨 Фронтенд (React/TypeScript)

### Пример 1: Работа с корзиной

```tsx
// src/context/CartContext.tsx

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([])
    const { user } = useTelegram()

    // Загружаем корзину из localStorage при монтировании
    useEffect(() => {
        if (user?.id) {
            const saved = localStorage.getItem(`cart_${user.id}`)
            if (saved) {
                try {
                    setItems(JSON.parse(saved))
                } catch (e) {
                    console.error('Failed to load cart:', e)
                }
            }
        }
    }, [user?.id])

    // Сохраняем корзину в localStorage при изменении
    useEffect(() => {
        if (user?.id && items.length >= 0) {
            localStorage.setItem(`cart_${user.id}`, JSON.stringify(items))
        }
    }, [items, user?.id])

    // Добавление товара
    const addItem = (item: Omit<CartItem, 'quantity'>) => {
        setItems((prev) => {
            // Проверяем, есть ли уже такой товар
            const existing = prev.find((i) => i.product_id === item.product_id)
            if (existing) {
                // Если есть - увеличиваем количество
                return prev.map((i) =>
                    i.product_id === item.product_id 
                        ? { ...i, quantity: i.quantity + 1 } 
                        : i
                )
            }
            // Если нет - добавляем новый с quantity = 1
            return [...prev, { ...item, quantity: 1 }]
        })
    }

    // Вычисляем общую сумму
    const total = items.reduce(
        (sum, item) => sum + item.price_cents * item.quantity, 
        0
    )

    return (
        <CartContext.Provider value={{ items, addItem, total, ... }}>
            {children}
        </CartContext.Provider>
    )
}
```

**Почему Context API?**
- Корзина нужна в разных компонентах (CatalogPage, CartPage, BottomNav)
- Context позволяет избежать prop drilling (передачи через все компоненты)
- localStorage сохраняет корзину между сессиями

### Пример 2: API запрос с обработкой ошибок

```tsx
// src/utils/api.ts

export const apiRequest = async <T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> => {
    // 1. Определяем базовый URL
    const baseUrl = getApiBaseUrl() // '' в dev (прокси), или полный URL в production
    
    // 2. Формируем полный URL
    const url = baseUrl ? new URL(endpoint, baseUrl).toString() : endpoint

    // 3. Делаем fetch запрос
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers, // Позволяет добавить X-User-ID и т.д.
        },
    })

    // 4. Проверяем статус ответа
    if (!response.ok) {
        // Пытаемся получить JSON с ошибкой
        const error = await response.json().catch(() => ({
            error: `HTTP ${response.status}: ${response.statusText}`,
        }))
        // Бросаем ошибку (будет поймана в try/catch)
        throw new Error(error.error || error.message || 'Request failed')
    }

    // 5. Парсим и возвращаем JSON
    return response.json()
}
```

**Почему отдельная функция?**
- Единая обработка ошибок
- Автоматическое добавление заголовков
- Типизация TypeScript
- Переиспользование кода

### Пример 3: Загрузка данных с состоянием

```tsx
// src/pages/CatalogPage.tsx

const CatalogPage = () => {
    // Состояние компонента
    const [items, setItems] = useState<CatalogItem[]>([]) // Товары
    const [isLoading, setIsLoading] = useState(false)     // Загрузка
    const [error, setError] = useState<string | null>(null) // Ошибка

    // Эффект выполняется при монтировании компонента
    useEffect(() => {
        let mounted = true // Флаг для проверки, не размонтирован ли компонент

        const loadCatalog = async () => {
            setIsLoading(true)
            setError(null)
            try {
                // Делаем запрос к API
                const data = await API.catalog.get()
                
                // Проверяем, что компонент еще смонтирован
                if (mounted && data.ok && Array.isArray(data.items)) {
                    setItems(data.items) // Обновляем состояние
                }
            } catch (err) {
                // Обрабатываем ошибку
                if (mounted && err instanceof Error) {
                    setError(err.message)
                }
            } finally {
                // Всегда сбрасываем loading
                if (mounted) {
                    setIsLoading(false)
                }
            }
        }

        loadCatalog()

        // Cleanup функция - выполняется при размонтировании
        return () => {
            mounted = false // Предотвращает обновление состояния размонтированного компонента
        }
    }, []) // Пустой массив = выполняется только при монтировании

    // Рендер с условной логикой
    return (
        <div>
            {isLoading && <div>Загружаем...</div>}
            {error && <div>Ошибка: {error}</div>}
            {!isLoading && !error && items.length === 0 && (
                <div>Товаров нет</div>
            )}
            {items.map((item) => (
                <div key={item.id}>{item.title}</div>
            ))}
        </div>
    )
}
```

**Почему `mounted` флаг?**
- Если пользователь быстро переходит между страницами, старый запрос может завершиться после размонтирования
- Попытка обновить состояние размонтированного компонента вызывает warning в React
- Флаг предотвращает это

---

## 🔐 Безопасность

### Пример: Параметризованные SQL запросы

```go
// ✅ ПРАВИЛЬНО - защищено от SQL injection
query := "SELECT * FROM users WHERE id = $1"
row := db.QueryRow(query, userID)

// ❌ НЕПРАВИЛЬНО - уязвимо к SQL injection
query := fmt.Sprintf("SELECT * FROM users WHERE id = %d", userID)
row := db.QueryRow(query)
```

**Почему?**
- Если userID = `1; DROP TABLE users;--`, то:
  - ✅ Параметризованный запрос: `$1` будет заменен на значение, SQL injection невозможен
  - ❌ Конкатенация: выполнится `DROP TABLE users`, база удалится!

### Пример: Проверка прав доступа

```go
// internal/handlers/handlers.go

func (h *Handlers) UpdateOrder(c *gin.Context) {
    orderID, _ := strconv.Atoi(c.Param("id"))
    userID, _ := c.Get("userID")

    // Проверяем, что заказ принадлежит пользователю
    var ownerID int64
    err := h.db.QueryRow("SELECT user_id FROM orders WHERE id = $1", orderID).Scan(&ownerID)
    
    if ownerID != userID {
        c.JSON(http.StatusForbidden, gin.H{"ok": false, "error": "access denied"})
        return // Пользователь не может изменить чужой заказ
    }
    
    // Только если заказ принадлежит пользователю - обновляем
    // ...
}
```

---

## 📊 Работа с данными

### Пример: JOIN запрос

```go
// internal/handlers/handlers.go

func (h *Handlers) GetCatalog(c *gin.Context) {
    // JOIN объединяет данные из двух таблиц
    query := `SELECT p.id, p.title, p.description, p.price_cents, p.product_type, 
                     s.title AS style
              FROM products p
              LEFT JOIN styles s ON p.style_id = s.id
              WHERE p.is_active = TRUE
              ORDER BY p.id`

    rows, err := h.db.Query(query)
    // ...
}
```

**Что происходит:**
- `FROM products p` - основная таблица (алиас `p`)
- `LEFT JOIN styles s` - присоединяем таблицу styles (алиас `s`)
- `ON p.style_id = s.id` - условие соединения
- `LEFT JOIN` означает: даже если у продукта нет стиля, он все равно вернется (style будет NULL)

### Пример: Обработка NULL значений

```go
// В PostgreSQL NULL != NULL, поэтому используем sql.NullString

var description sql.NullString
err := rows.Scan(&description)

// Проверяем, есть ли значение
if description.Valid {
    item["description"] = description.String
} else {
    item["description"] = nil // или ""
}
```

---

## 🎯 React паттерны

### Пример: Custom Hook

```tsx
// src/hooks/useTelegram.ts

export const useTelegram = () => {
    const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
    const [user, setUser] = useState<TelegramUser | null>(null)

    useEffect(() => {
        // Получаем объект Telegram из window
        const tg = window.Telegram?.WebApp
        if (!tg) return

        tg.ready()  // Говорим Telegram, что мы готовы
        tg.expand() // Разворачиваем приложение на весь экран

        setWebApp(tg)
        setUser(tg.initDataUnsafe?.user ?? null)
    }, [])

    return { webApp, user }
}

// Использование в компоненте:
const ProfilePage = () => {
    const { user } = useTelegram() // Просто и понятно!
    return <div>{user?.first_name}</div>
}
```

**Преимущества:**
- Инкапсуляция логики
- Переиспользование
- Читаемость кода

---

Это основные примеры и паттерны, используемые в приложении! 🚀





