import { useMemo } from 'react'
import { useUserProfile } from '../context/UserContext'
import { useAdminRequests } from '../hooks/useAdminRequests'

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'не указана'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

const statusLabels: Record<string, string> = {
  pending: 'в обработке',
  confirmed: 'подтверждена',
  cancelled: 'отменена',
  completed: 'выполнена',
}

const RequestsPage = () => {
  const { role, telegramUserId } = useUserProfile()
  const isAdmin = role === 'admin'
  const { requests, loading, error } = useAdminRequests({ userId: telegramUserId, enabled: isAdmin })

  const totalAmount = useMemo(() => {
    if (!requests.length) return 0
    return requests.reduce((sum, request) => sum + (request.total_cents || 0), 0)
  }, [requests])

  if (!isAdmin) {
    return (
      <div className="page page--requests">
        <div className="requests-banner">
          <h1>ЗАЯВКИ</h1>
        </div>
        <div className="info-banner">
          Список заявок доступен только администратору. Оставьте заявку через чат или обратитесь в студию.
        </div>
      </div>
    )
  }

  return (
    <div className="page page--requests">
      <div className="requests-banner">
        <h1>ЗАЯВКИ СТУДИИ</h1>
      </div>
      {loading && <div className="info-banner">Загружаем заявки...</div>}
      {error && <div className="info-banner info-banner--error">{error}</div>}
      {!loading && requests.length === 0 && <div className="info-banner">Заявок пока нет</div>}

      {requests.map((request) => {
        const statusKey = request.status.toLowerCase()
        const statusLabel = statusLabels[statusKey] || request.status

        return (
          <section key={request.id} className="request-card">
            <div className="request-card__icon">👤</div>
            <div className="request-card__content">
              <p>{request.user_name || `Пользователь #${request.user_id}`}</p>
              <p>дата сеанса: {formatDate(request.scheduled_at)}</p>
              <p>контакт: {request.user_contact || 'не указан'}</p>
              <p>описание: {request.comment || 'без описания'}</p>
              <p>создана: {formatDate(request.created_at)}</p>
            </div>
            <div className="request-card__meta">
              <span className="request-status" data-status={statusKey}>
                {statusLabel}
              </span>
              <span className="order-card__price">{(request.total_cents / 100).toLocaleString('ru-RU')} ₽</span>
            </div>
          </section>
        )
      })}

      {requests.length > 0 && (
        <section className="order-card order-card--compact">
          <div className="order-card__details">
            <span className="order-card__title">Всего заявок: {requests.length}</span>
            <span className="order-card__price">{(totalAmount / 100).toLocaleString('ru-RU')} ₽</span>
          </div>
        </section>
      )}
    </div>
  )
}

export default RequestsPage
