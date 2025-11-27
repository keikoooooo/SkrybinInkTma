# Быстрый старт: Загрузка изображений

## Настройка локального хранилища (для разработки)

### Шаг 1: Добавьте переменные в `.env`

Откройте `server-go/.env` и добавьте:

```env
UPLOAD_DIR=./uploads
PUBLIC_URL=http://localhost:8080
```

### Шаг 2: Перезапустите сервер

```bash
cd server-go
go run main.go
```

Сервер автоматически создаст необходимые папки:
```
server-go/
└── uploads/
    └── images/
        ├── works/      # Фото работ
        ├── artists/    # Аватары мастеров
        └── users/      # Фото пользователей
```

### Шаг 3: Используйте API для загрузки

**Пример загрузки через curl:**

```bash
curl -X POST http://localhost:8080/api/upload/image \
  -H "X-User-ID: YOUR_TELEGRAM_ID" \
  -F "file=@/path/to/image.jpg" \
  -F "type=work"
```

**Ответ:**
```json
{
  "ok": true,
  "url": "http://localhost:8080/uploads/images/works/abc123def456.jpg"
}
```

### Шаг 4: Используйте URL в приложении

После загрузки используйте полученный URL при создании работы:

```bash
curl -X POST http://localhost:8080/api/admin/works \
  -H "X-User-ID: YOUR_ADMIN_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "http://localhost:8080/uploads/images/works/abc123def456.jpg",
    "caption": "Моя работа"
  }'
```

---

## Загрузка через фронтенд

### React компонент для загрузки

```typescript
const uploadImage = async (file: File, type: 'work' | 'artist' | 'user') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)

  const response = await fetch('/api/upload/image', {
    method: 'POST',
    headers: {
      'X-User-ID': telegramUserId.toString()
    },
    body: formData
  })

  const data = await response.json()
  if (data.ok) {
    return data.url
  }
  throw new Error(data.error)
}
```

### Пример использования

```typescript
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const imageUrl = await uploadImage(file, 'work')
    // Используйте imageUrl при создании работы
    await API.admin.works.create({
      image_url: imageUrl,
      caption: 'Описание работы'
    })
  } catch (error) {
    console.error('Ошибка загрузки:', error)
  }
}
```

---

## Ограничения

- **Максимальный размер файла:** 10MB
- **Разрешенные форматы:** JPG, JPEG, PNG, GIF, WEBP
- **Требуется авторизация:** заголовок `X-User-ID`

---

## Для продакшена

Для продакшена рекомендуется использовать Cloudinary. См. `IMAGE_STORAGE_GUIDE.md` для подробностей.

