import { Link } from 'react-router-dom'
import useTelegram from '../hooks/useTelegram'

const fallbackAvatar =
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=400&q=80'

const menuItems = ['избранное', 'отзывы', 'мои заказы', 'депозиты']

const ProfilePage = () => {
  const { user } = useTelegram()

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'гость'
  const usernameLabel = user?.username ? `@${user.username}` : 'username не указан'
  const avatarSrc = user?.photo_url ?? fallbackAvatar

  return (
    <div className="page page--profile">
      <h1 className="page__title">ПРОФИЛЬ</h1>
      <div className="profile-card">
        <img className="profile-card__avatar" src={avatarSrc} alt={displayName} />
        <div className="profile-card__info">
          <span className="profile-card__name">{displayName}</span>
          <span className="profile-card__meta">{usernameLabel}</span>
          <span className="profile-card__meta">ID: {user?.id ?? '—'}</span>
          <span className="profile-card__meta">Баланс: 0 ₽</span>
          <span className="profile-card__meta">Бонусы: 0</span>
          <span className="profile-card__meta">Персональная скидка: 0%</span>
        </div>
      </div>

      <ul className="profile-menu">
        {menuItems.map((item) => (
          <li key={item} className="profile-menu__item">
            {item}
          </li>
        ))}
      </ul>

      <div className="profile-links">
        <Link className="link-button" to="/profile/admin">
          Перейти в админку
        </Link>
        <Link className="link-button" to="/order">
          Мои заявки
        </Link>
      </div>

      <div className="profile-footer">
        <span>политика конфиденциальности</span>
        <span>пользовательское соглашение</span>
      </div>
    </div>
  )
}

export default ProfilePage
