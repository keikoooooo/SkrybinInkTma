import { useState, useRef } from 'react'
import { API } from '../utils/api'
import { useUserProfile } from '../context/UserContext'

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void
  type?: 'work' | 'artist' | 'user'
  label?: string
}

const ImageUploader = ({ onUploadComplete, type = 'work', label = 'Загрузить изображение' }: ImageUploaderProps) => {
  const { telegramUserId } = useUserProfile()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Валидация
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('Файл слишком большой (максимум 10MB)')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Неподдерживаемый формат. Используйте JPG, PNG, GIF или WEBP')
      return
    }

    // Превью
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Загрузка
    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '')
      const url = baseUrl ? new URL('/api/upload/image', baseUrl).toString() : '/api/upload/image'
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-User-ID': telegramUserId?.toString() || '',
        },
        body: formData,
      })

      const data = await response.json()

      if (data.ok && data.url) {
        onUploadComplete(data.url)
        setError(null)
      } else {
        setError(data.error || 'Ошибка загрузки')
        setPreview(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="image-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {preview ? (
        <div className="image-uploader__preview">
          <img src={preview} alt="Превью" className="image-uploader__preview-image" />
          <div className="image-uploader__preview-actions">
            <button
              type="button"
              className="ghost-button ghost-button--small"
              onClick={() => {
                setPreview(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
            >
              Изменить
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="image-uploader__button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Загрузка...' : label}
        </button>
      )}

      {error && <div className="info-banner info-banner--error" style={{ marginTop: '0.5rem' }}>{error}</div>}
    </div>
  )
}

export default ImageUploader

