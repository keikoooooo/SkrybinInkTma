import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useTelegram from '../hooks/useTelegram'
import { API } from '../utils/api'

interface OrderItem {
  id: number
  product_id: number | null
  quantity: number
  price_cents: number
  body_zone: string | null
  notes: string | null
}

interface Order {
  id: number
  user_id: number
  status: string
  total_cents: number
  promo_code: string | null
  comment: string | null
  scheduled_at: string | null
  created_at: string
  items: OrderItem[]
}

const OrderPage = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useTelegram()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPaying, setIsPaying] = useState(false)

  useEffect(() => {
    if (!id || !user?.id) return

    const loadOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        const orderId = parseInt(id)
        const data = await API.orders.getOrder(user.id, orderId)
        if (data && typeof data === 'object') {
          if ('order' in data) {
            setOrder((data as any).order)
          } else if ('id' in data) {
            setOrder(data as Order)
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [id, user?.id])

  const handlePayment = async () => {
    if (!order || !user?.id) return

    try {
      setIsPaying(true)
      setError(null)
      
      // Здесь должна быть интеграция с платежной системой
      // Пока просто обновляем статус заказа
      await API.orders.update(order.id, { status: 'paid' }, user.id)
      
      // После успешной оплаты перенаправляем
      navigate('/orders')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setIsPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="page page--order">
        <div className="info-banner">Загружаем заказ...</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="page page--order">
        <div className="info-banner info-banner--error">{error || 'Заказ не найден'}</div>
        <Link className="link-button" to="/orders">
          Вернуться к заказам
        </Link>
      </div>
    )
  }

  return (
    <div className="page page--order">
      <div className="order-banner">
        <h1>ВАШ ЗАКАЗ #{order.id}</h1>
      </div>

      <section className="order-card">
        <div className="order-card__details">
          <span className="order-card__title">Заказ #{order.id}</span>
          <div className="order-card__price">{(order.total_cents / 100).toLocaleString('ru-RU')} ₽</div>
          <div className="order-card__status">Статус: {order.status}</div>
        </div>
      </section>

      <section className="order-info">
        <div className="order-info__row">
          <span>Дата создания:</span>
          <span>{new Date(order.created_at).toLocaleDateString('ru-RU')}</span>
        </div>
        {order.scheduled_at && (
          <div className="order-info__row">
            <span>Дата сеанса:</span>
            <span>{new Date(order.scheduled_at).toLocaleDateString('ru-RU')}</span>
          </div>
        )}
        {order.comment && (
          <div className="order-info__row">
            <span>Комментарий:</span>
            <span>{order.comment}</span>
          </div>
        )}
        {order.items.length > 0 && (
          <div className="order-info__row">
            <span>Товары:</span>
            <div>
              {order.items.map((item) => (
                <div key={item.id}>
                  {item.quantity}x - {item.price_cents / 100} ₽
                  {item.notes && ` (${item.notes})`}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="cart-summary order-summary">
        <div className="cart-summary__row">
          <span>Итого</span>
          <span>{(order.total_cents / 100).toLocaleString('ru-RU')} ₽</span>
        </div>
        {order.status === 'draft' || order.status === 'pending' ? (
          <>
            {error && <div className="info-banner info-banner--error">{error}</div>}
            <button
              type="button"
              className="primary-button"
              onClick={handlePayment}
              disabled={isPaying}
            >
              {isPaying ? 'Обработка...' : 'Оплатить'}
            </button>
          </>
        ) : (
          <div className="info-banner">Заказ {order.status === 'paid' ? 'оплачен' : order.status}</div>
        )}
        <Link className="link-button" to="/orders">
          Вернуться к заказам
        </Link>
      </div>
    </div>
  )
}

export default OrderPage
