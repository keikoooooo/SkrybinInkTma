import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../utils/api'
import { useUserProfile } from '../context/UserContext'

const heroImage = 'https://res.cloudinary.com/dzzogivxg/image/upload/v1764495562/back_image_tllo0v.png'
const founderImage = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80'

interface Work {
  id: number
  image_url: string
  caption: string | null
}

const HomePage = () => {
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const { telegramUserId } = useUserProfile()

  useEffect(() => {
    const loadWorks = async () => {
      try {
        setLoading(true)
        const data = await API.works.getAll()
        if (data.ok && Array.isArray(data.works)) {
          // Берем первые 3 работы
          setWorks(data.works.slice(0, 3))
        }
      } catch (err) {
        console.error('Failed to load works:', err)
      } finally {
        setLoading(false)
      }
    }

    loadWorks()
  }, [])

  useEffect(() => {
    if (telegramUserId) {
      const loadFavorites = async () => {
        try {
          const data = await API.favorites.getAll(telegramUserId)
          const favorites = Array.isArray(data) ? data : (data as any).favorites || []
          setFavoriteIds(new Set(favorites.map((f: any) => f.work_id || f.work?.id)))
        } catch (err) {
          console.error('Failed to load favorites:', err)
        }
      }
      loadFavorites()
    }
  }, [telegramUserId])

  const handleToggleFavorite = async (workId: number) => {
    if (!telegramUserId) return

    const isFavorite = favoriteIds.has(workId)
    try {
      if (isFavorite) {
        // Найти ID избранного для удаления
        const data = await API.favorites.getAll(telegramUserId)
        const favorites = Array.isArray(data) ? data : (data as any).favorites || []
        const favorite = favorites.find((f: any) => (f.work_id || f.work?.id) === workId)
        if (favorite) {
          await API.favorites.remove(favorite.id, telegramUserId)
          setFavoriteIds((prev) => {
            const next = new Set(prev)
            next.delete(workId)
            return next
          })
        }
      } else {
        await API.favorites.add(workId, telegramUserId)
        setFavoriteIds((prev) => new Set(prev).add(workId))
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  return (
    <div className="page page--home">
      <section className="hero-card" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="hero-card__overlay" />
        <div className="hero-card__content">
          <p className="hero-card__tagline">Тату студия в Ростове</p>
          <h1 className="hero-card__title">SKRYABIN STUDIO</h1>
        </div>
      </section>

      <section className="card founder-card">
        <span className="card__tag">ОСНОВАТЕЛЬ</span>
        <div className="founder-card__body">
          <img className="founder-card__image" src={founderImage} alt="Основатель студии" />
          <div>
            <h2 className="founder-card__name">Владислав</h2>
            <p className="card__text">
              Работаю тату мастером более 6-ти лет, и за это время зарекомендовал себя как крутого профи в этом деле.
            </p>
            <p className="card__text">Если ты мечтаешь о тату - хватит это терпеть!</p>
          </div>
        </div>
        <p className="card__note">
          Реализую самые смелые и дерзкие фантазии. Причём сделаю это качественно, стерильно и как для себя.
        </p>
      </section>

      <section className="card works-card">
        <span className="card__tag">МОИ РАБОТЫ</span>
        {loading ? (
          <div className="info-banner">Загружаем работы...</div>
        ) : works.length > 0 ? (
          <div className="works-grid">
            {works.map((work) => (
              <div key={work.id} style={{ position: 'relative' }}>
                <img
                  className="works-card__image"
                  src={work.image_url}
                  alt={work.caption || 'Работа'}
                />
                {telegramUserId && (
                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(work.id)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }}
                    aria-label={favoriteIds.has(work.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
                  >
                    {favoriteIds.has(work.id) ? '❤️' : '🤍'}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="info-banner">Работы скоро появятся</div>
        )}
      </section>

      <footer className="page-footer">
        <Link className="link-button" to="/catalog">
          Смотреть ассортимент
        </Link>
      </footer>
    </div>
  )
}

export default HomePage
