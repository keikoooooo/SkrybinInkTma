import { Link } from 'react-router-dom'

import heroImage from '@/assets/images/backimage.png'
import founderImage from '@/assets/images/vlad.png'
const featureWorkImage =
  'https://images.unsplash.com/photo-1604908177522-4023ac76b00d?auto=format&fit=crop&w=900&q=80'

const HomePage = () => {
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
        <img className="works-card__image" src={featureWorkImage} alt="Пример работы" />
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
