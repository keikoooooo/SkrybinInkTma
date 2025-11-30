# Как использовать изображения из Cloudinary

## После загрузки изображения

Когда вы загружаете изображение через API `/api/upload/image`, вы получаете ответ:

```json
{
  "ok": true,
  "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/skryabin-ink/works/1234567890_abcdef1234567890.jpg"
}
```

## Способы использования URL

### 1. Автоматически через админ-панель (рекомендуется)

**В админ-панели "Управление работами":**

1. Нажмите "+ Добавить работу"
2. Нажмите "Загрузить фото дизайна"
3. Выберите файл
4. Изображение автоматически загрузится в Cloudinary
5. URL автоматически сохранится при создании работы

**Код делает это автоматически:**
- `ImageUploader` загружает файл и получает URL
- URL передается в `onUploadComplete`
- При нажатии "Добавить" URL сохраняется в базу данных

### 2. Использование URL напрямую в коде

Если у вас уже есть URL из Cloudinary, вы можете использовать его напрямую:

#### В React компонентах:

```tsx
// Просто используйте URL в теге img
<img src="https://res.cloudinary.com/your-cloud/image/upload/..." alt="Работа" />

// Или в стилях
<div style={{ 
  backgroundImage: `url(https://res.cloudinary.com/your-cloud/image/upload/...)` 
}} />
```

#### В базе данных:

```sql
-- Вставка работы с URL из Cloudinary
INSERT INTO works (image_url, caption) 
VALUES (
  'https://res.cloudinary.com/your-cloud/image/upload/...',
  'Описание работы'
);
```

#### Через API:

```typescript
// Создание работы с URL из Cloudinary
await API.admin.works.create({
  image_url: 'https://res.cloudinary.com/your-cloud/image/upload/...',
  caption: 'Описание',
}, telegramUserId)
```

### 3. Просмотр изображения в браузере

Просто откройте URL в браузере:
```
https://res.cloudinary.com/your-cloud/image/upload/v1234567890/skryabin-ink/works/1234567890_abcdef1234567890.jpg
```

Изображение отобразится напрямую!

### 4. Использование в HTML/CSS

```html
<!-- В HTML -->
<img src="https://res.cloudinary.com/your-cloud/image/upload/..." alt="Работа" />

<!-- В CSS -->
.work-image {
  background-image: url('https://res.cloudinary.com/your-cloud/image/upload/...');
}
```

## Преимущества Cloudinary URL

✅ **Автоматическая оптимизация:**
- Автоматическое преобразование в WebP
- Автоматическое сжатие
- Оптимизация качества

✅ **CDN:**
- Быстрая загрузка по всему миру
- Кэширование
- Масштабируемость

✅ **Трансформации на лету:**
Вы можете изменять изображение прямо в URL:

```
# Оригинал
https://res.cloudinary.com/your-cloud/image/upload/works/image.jpg

# Ресайз до 500px
https://res.cloudinary.com/your-cloud/image/upload/w_500/works/image.jpg

# Квадрат 300x300
https://res.cloudinary.com/your-cloud/image/upload/w_300,h_300,c_fill/works/image.jpg

# Обрезка по центру
https://res.cloudinary.com/your-cloud/image/upload/w_400,h_400,c_crop/works/image.jpg

# Автоматический формат и качество
https://res.cloudinary.com/your-cloud/image/upload/q_auto,f_auto/works/image.jpg
```

## Где используются изображения в проекте

### 1. Главная страница (`HomePage.tsx`)
```tsx
<img src={work.image_url} alt={work.caption || 'Работа'} />
```

### 2. Админ-панель работ (`AdminWorksPage.tsx`)
```tsx
<img src={work.image_url} alt={work.caption || 'Работа'} className="admin-work-card__image" />
```

### 3. API возвращает URL
```json
{
  "ok": true,
  "works": [
    {
      "id": 1,
      "image_url": "https://res.cloudinary.com/...",
      "caption": "Описание"
    }
  ]
}
```

## Примеры использования

### Пример 1: Загрузка и создание работы

```typescript
// 1. Загрузить изображение
const formData = new FormData()
formData.append('file', imageFile)
formData.append('type', 'work')

const uploadResponse = await fetch('/api/upload/image', {
  method: 'POST',
  headers: { 'X-User-ID': userId },
  body: formData
})

const { url } = await uploadResponse.json()
// url = "https://res.cloudinary.com/..."

// 2. Создать работу с этим URL
await API.admin.works.create({
  image_url: url,
  caption: 'Моя работа'
}, userId)
```

### Пример 2: Использование в компоненте

```tsx
const WorkCard = ({ work }: { work: Work }) => {
  return (
    <div className="work-card">
      <img 
        src={work.image_url} 
        alt={work.caption || 'Работа'}
        loading="lazy"
      />
      {work.caption && <p>{work.caption}</p>}
    </div>
  )
}
```

## Важные моменты

1. **URL всегда доступен** - Cloudinary URL работает напрямую, не требует дополнительной настройки
2. **HTTPS по умолчанию** - Все URL используют HTTPS (безопасно)
3. **Автоматическая оптимизация** - Изображения уже оптимизированы
4. **Кэширование** - Браузеры кэшируют изображения для быстрой загрузки

## Проверка работы

1. Загрузите изображение через админ-панель
2. Скопируйте URL из ответа API или из базы данных
3. Откройте URL в браузере - изображение должно отобразиться
4. Используйте этот URL в вашем коде

## Устранение проблем

**Изображение не отображается:**
- Проверьте, что URL начинается с `https://res.cloudinary.com/`
- Убедитесь, что изображение действительно загружено в Cloudinary
- Проверьте права доступа в Cloudinary Dashboard

**CORS ошибки:**
- Cloudinary автоматически настроен для CORS
- Если проблемы, проверьте настройки в Cloudinary Dashboard → Settings → Security

**Медленная загрузка:**
- Используйте трансформации для уменьшения размера
- Добавьте `q_auto,f_auto` для автоматической оптимизации

