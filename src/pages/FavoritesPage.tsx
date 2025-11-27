import { useEffect, useState } from 'react'
import { useUserProfile } from '../context/UserContext'
import { API } from '../utils/api'

interface Favorite {
  id: number
  work_id: number
  work?: {
    id: number
    image_url: string
    caption: string | null
    artist_id: number | null
    style_id: number | null
  }
}

const FavoritesPage = () => {
  const { telegramUserId } = useUserProfile()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (telegramUserId) {
      loadFavorites()
    }
  }, [telegramUserId])

  const loadFavorites = async () => {
    if (!telegramUserId) return

    try {
      setLoading(true)
      setError(null)
      const data = await API.favorites.getAll(telegramUserId)
      if (data && Array.isArray(data)) {
        setFavorites(data)
      } else if (data && 'favorites' in data && Array.isArray((data as any).favorites)) {
        setFavorites((data as any).favorites)
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (favoriteId: number) => {
    if (!telegramUserId || !confirm('Удалить из избранного?')) return

    try {
      await API.favorites.remove(favoriteId, telegramUserId)
      setFavorites(favorites.filter((f) => f.id !== favoriteId))
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  if (!telegramUserId) {
    return (
      <div className="page">
        <h1 className="page__title">ИЗБРАННОЕ</h1>
        <div className="info-banner">Необходима авторизация</div>
      </div>
    )
  }

  return (
    <div className="page page--favorites">
      <h1 className="page__title">ИЗБРАННОЕ</h1>

      {loading && <div className="info-banner">Загружаем избранное...</div>}
      {error && <div className="info-banner info-banner--error">{error}</div>}

      {favorites.length === 0 && !loading && (
        <div className="info-banner">У вас пока нет избранных работ</div>
      )}

      {favorites.length > 0 && (
        <div className="favorites-grid">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="favorite-item">
              {favorite.work && (
                <>
                  <img
                    src={favorite.work.image_url}
                    alt={favorite.work.caption || 'Работа'}
                    className="favorite-item__image"
                  />
                  {favorite.work.caption && (
                    <p className="favorite-item__caption">{favorite.work.caption}</p>
                  )}
                  <button
                    type="button"
                    className="ghost-button ghost-button--small"
                    onClick={() => handleRemove(favorite.id)}
                    style={{ 
                      marginTop: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      border: '1px solid #a31621',
                      color: '#a31621'
                    }}
                  >
                    Удалить из избранного
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FavoritesPage

