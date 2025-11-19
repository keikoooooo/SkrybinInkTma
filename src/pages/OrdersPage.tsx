import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useTelegram from '../hooks/useTelegram'
import { API } from '../utils/api'

interface OrderItem {
  id: number
  product_id: number | null
  quantity: number
  price_cents: number
}

interface Order {
  id: number
  user_id: number
  status: string
  total_cents: number
  comment: string | null
  scheduled_at: string | null
  created_at: string
  items: OrderItem[]
}

const OrdersPage = () => {
  const { user } = useTelegram()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const loadOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await API.orders.getUserOrders(user.id)
        if (data && typeof data === 'object') {
          if ('orders' in data && Array.isArray((data as any).orders)) {
            setOrders((data as any).orders)
          } else if (Array.isArray(data)) {
            setOrders(data as Order[])
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

    loadOrders()
  }, [user?.id])

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Черновик',
      pending: 'Ожидает оплаты',
      paid: 'Оплачен',
      scheduled: 'Запланирован',
      cancelled: 'Отменен',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="page">
        <h1 className="page__title">МОИ ЗАКАЗЫ</h1>
        <div className="info-banner">Загружаем заказы...</div>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page__title">МОИ ЗАКАЗЫ</h1>
      {error && <div className="info-banner info-banner--error">{error}</div>}
      {orders.length === 0 && !error && (
        <div className="info-banner">У вас пока нет заказов</div>
      )}
      {orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/order/${order.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="order-card">
                <div className="order-card__details">
                  <span className="order-card__title">Заказ #{order.id}</span>
                  <div className="order-card__price">{(order.total_cents / 100).toLocaleString('ru-RU')} ₽</div>
                  <div className="order-card__status">{getStatusLabel(order.status)}</div>
                  <div className="order-card__date">
                    {new Date(order.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrdersPage

