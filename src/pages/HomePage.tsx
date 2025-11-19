import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../utils/api'

const heroImage = 'https://images.unsplash.com/photo-1504257365157-1496a50d48f2?auto=format&fit=crop&w=900&q=80'
const founderImage = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80'

interface Work {
  id: number
  image_url: string
  caption: string | null
}

const HomePage = () => {
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)

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
              <img
                key={work.id}
                className="works-card__image"
                src={work.image_url}
                alt={work.caption || 'Работа'}
              />
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
