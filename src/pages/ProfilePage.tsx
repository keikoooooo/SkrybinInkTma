import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useTelegram from '../hooks/useTelegram'
import { API } from '../utils/api'

const fallbackAvatar =
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=400&q=80'

interface ProfileData {
  id: number
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
  role: string
  balance_cents: number
  bonus_points: number
  personal_discount: number
}

const ProfilePage = () => {
  const { user: telegramUser } = useTelegram()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!telegramUser?.id) return

    const loadProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await API.profile.get(telegramUser.id)
        if (data && typeof data === 'object' && 'user' in data) {
          setProfile((data as any).user)
        } else if (data && typeof data === 'object' && 'id' in data) {
          setProfile(data as ProfileData)
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [telegramUser?.id])

  const displayName =
    profile?.first_name || profile?.last_name
      ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
      : profile?.username || telegramUser?.username || 'гость'
  const usernameLabel = profile?.username || telegramUser?.username
    ? `@${profile?.username || telegramUser?.username}`
    : 'username не указан'
  const avatarSrc = profile?.photo_url || telegramUser?.photo_url || fallbackAvatar
  const userRole = profile?.role || 'client'
  const balance = profile?.balance_cents || 0
  const bonuses = profile?.bonus_points || 0
  const discount = profile?.personal_discount || 0

  const menuItems = [
    { label: 'избранное', link: '/favorites' },
    { label: 'отзывы', link: '/reviews' },
    { label: 'мои заказы', link: '/orders' },
    { label: 'депозиты', link: '/deposits' },
  ]

  return (
    <div className="page page--profile">
      <h1 className="page__title">ПРОФИЛЬ</h1>
      {loading && <div className="info-banner">Загружаем профиль...</div>}
      {error && <div className="info-banner info-banner--error">{error}</div>}
      <div className="profile-card">
        <img className="profile-card__avatar" src={avatarSrc} alt={displayName} />
        <div className="profile-card__info">
          <span className="profile-card__name">{displayName}</span>
          <span className="profile-card__meta">{usernameLabel}</span>
          <span className="profile-card__meta">ID: {telegramUser?.id ?? '—'}</span>
          <span className="profile-card__meta">Баланс: {(balance / 100).toLocaleString('ru-RU')} ₽</span>
          <span className="profile-card__meta">Бонусы: {bonuses}</span>
          <span className="profile-card__meta">Персональная скидка: {discount}%</span>
        </div>
      </div>

      <ul className="profile-menu">
        {menuItems.map((item) => (
          <li key={item.label} className="profile-menu__item">
            <Link to={item.link} style={{ textDecoration: 'none', color: 'inherit', width: '100%', display: 'block' }}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="profile-links">
        {userRole === 'admin' && (
          <Link className="link-button" to="/profile/admin">
            Перейти в админку
          </Link>
        )}
        <Link className="link-button" to="/orders">
          Мои заказы
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
