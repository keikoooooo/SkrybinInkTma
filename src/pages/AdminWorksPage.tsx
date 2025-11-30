import { useEffect, useState } from 'react'
import { useUserProfile } from '../context/UserContext'
import { API } from '../utils/api'
import ImageUploader from '../components/ImageUploader'

interface Work {
  id: number
  artist_id: number | null
  style_id: number | null
  image_url: string
  caption: string | null
  created_at: string
}

const AdminWorksPage = () => {
  const { telegramUserId, role } = useUserProfile()
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newWork, setNewWork] = useState({
    image_url: '',
    caption: '',
    artist_id: null as number | null,
    style_id: null as number | null,
  })

  useEffect(() => {
    if (role === 'admin') {
      loadWorks()
    }
  }, [role])

  const loadWorks = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await API.works.getAll()
      if (data.ok && Array.isArray(data.works)) {
        setWorks(data.works)
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddWork = async () => {
    if (!telegramUserId || !newWork.image_url) {
      setError('Загрузите изображение')
      return
    }

    try {
      setError(null)
      await API.admin.works.create(
        {
          image_url: newWork.image_url,
          caption: newWork.caption || null,
          artist_id: newWork.artist_id,
          style_id: newWork.style_id,
        },
        telegramUserId
      )
      setShowAddForm(false)
      setNewWork({ image_url: '', caption: '', artist_id: null, style_id: null })
      loadWorks()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  const handleDelete = async (id: number) => {
    if (!telegramUserId || !confirm('Удалить эту работу?')) return

    try {
      await API.admin.works.delete(id, telegramUserId)
      setWorks(works.filter((w) => w.id !== id))
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  if (role !== 'admin') {
    return (
      <div className="page">
        <h1 className="page__title">РАБОТЫ</h1>
        <div className="info-banner">Доступно только администратору</div>
      </div>
    )
  }

  return (
    <div className="page page--admin-works">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className="page__title">РАБОТЫ</h1>
        <button
          type="button"
          className="primary-button"
          onClick={() => setShowAddForm(true)}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          + Добавить работу
        </button>
      </div>

      {loading && <div className="info-banner">Загружаем работы...</div>}
      {error && <div className="info-banner info-banner--error">{error}</div>}

      {showAddForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem',
          }}
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <h2 style={{ marginTop: 0 }}>Добавить работу</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ImageUploader
                onUploadComplete={(url) => setNewWork({ ...newWork, image_url: url })}
                type="work"
                label="Загрузить фото дизайна"
              />
              {newWork.image_url && (
                <img
                  src={newWork.image_url}
                  alt="Превью"
                  style={{ width: '100%', borderRadius: '12px', maxHeight: '300px', objectFit: 'cover' }}
                />
              )}
              <label className="input input--flat">
                <span className="input__label">Описание (необязательно)</span>
                <textarea
                  placeholder="Описание работы"
                  value={newWork.caption}
                  onChange={(e) => setNewWork({ ...newWork, caption: e.target.value })}
                  rows={3}
                />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="primary-button" onClick={handleAddWork} style={{ flex: 1 }}>
                  Добавить
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewWork({ image_url: '', caption: '', artist_id: null, style_id: null })
                  }}
                  style={{ flex: 1 }}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {works.length === 0 && !loading && (
        <div className="info-banner">Работ пока нет. Добавьте первую работу!</div>
      )}

      {works.length > 0 && (
        <div className="admin-works-grid">
          {works.map((work) => (
            <div key={work.id} className="admin-work-card">
              <img src={work.image_url} alt={work.caption || 'Работа'} className="admin-work-card__image" />
              {work.caption && <p className="admin-work-card__caption">{work.caption}</p>}
              <button
                type="button"
                className="ghost-button ghost-button--small"
                onClick={() => handleDelete(work.id)}
                style={{
                  marginTop: '0.5rem',
                  border: '1px solid #a31621',
                  color: '#a31621',
                }}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminWorksPage

