import { Link } from 'react-router-dom'
import useTelegram from '../hooks/useTelegram'
import { useUserProfile } from '../context/UserContext'
import { useAdminRequests, type RequestRecord } from '../hooks/useAdminRequests'

const AdminProfilePage = () => {
  const { user } = useTelegram()
  const { role, telegramUserId } = useUserProfile()
  const isAdmin = role === 'admin'
  const { requests, loading, error } = useAdminRequests({ userId: telegramUserId, enabled: isAdmin })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'не указана'
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  return (
    <div className="page page--admin">
      <div className="admin-banner">
        <h1>ПРОФИЛЬ АДМИНА</h1>
      </div>
      {loading && <div className="info-banner">Загружаем заявки...</div>}
      {error && <div className="info-banner info-banner--error">{error}</div>}
      <section className="admin-card">
        <header className="admin-card__header">
          <div>
            <span className="admin-card__name">{user?.username || user?.first_name || 'Админ'}</span>
            <span className="admin-card__role">админ</span>
          </div>
        </header>

        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/admin/works"
            className="link-button"
            style={{ display: 'inline-block', marginBottom: '1rem' }}
          >
            Управление работами
          </Link>
        </div>

        <div className="admin-card__list">
          {requests.length === 0 && !loading && (
            <div className="info-banner">Заявок пока нет</div>
          )}
          {requests.map((request: RequestRecord) => (
            <div key={request.id} className="admin-request">
              <div className="admin-request__icon">👤</div>
              <div className="admin-request__content">
                <span className="admin-request__name">{request.user_name || `Пользователь #${request.user_id}`}</span>
                <span className="admin-request__meta">
                  дата сеанса: {formatDate(request.scheduled_at)}
                </span>
                <span className="admin-request__meta">
                  контакт: {request.user_contact || 'не указан'}
                </span>
                <span className="admin-request__description">
                  описание: {request.comment || 'без описания'}
                </span>
                <span className="admin-request__meta">
                  сумма: {(request.total_cents / 100).toLocaleString('ru-RU')} ₽
                </span>
                <span className="admin-request__meta">
                  статус: {request.status}
                </span>
              </div>
              <button
                type="button"
                className="admin-request__download"
                aria-label="Скачать заявку"
                onClick={() => {
                  const text = `Заявка #${request.id}\nПользователь: ${request.user_name}\nКонтакт: ${request.user_contact}\nОписание: ${request.comment}\nСумма: ${request.total_cents / 100} ₽`
                  navigator.clipboard.writeText(text)
                }}
              >
                ↓
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AdminProfilePage
