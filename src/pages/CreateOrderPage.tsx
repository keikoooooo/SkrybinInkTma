import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import useTelegram from '../hooks/useTelegram'
import { API } from '../utils/api'

const CreateOrderPage = () => {
  const { productId } = useParams<{ productId: string }>()
  const [searchParams] = useSearchParams()
  const { user } = useTelegram()
  const navigate = useNavigate()
  const [product, setProduct] = useState<{ id: number; title: string; price_cents: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bodyZone, setBodyZone] = useState('')
  const [notes, setNotes] = useState('')
  const [comment, setComment] = useState('')
  const [quantity, setQuantity] = useState(1)

  // Получаем данные продукта из URL параметров
  useEffect(() => {
    setLoading(true)
    setError(null)

    const title = searchParams.get('title')
    const priceCents = searchParams.get('priceCents')

    if (productId && title && priceCents) {
      setProduct({
        id: parseInt(productId),
        title: decodeURIComponent(title),
        price_cents: parseInt(priceCents),
      })
    } else {
      setError('Не указан товар для заказа')
    }

    setLoading(false)
  }, [productId, searchParams])

  const handleCreateOrder = async () => {
    if (!user?.id || !product) {
      setError('Необходима авторизация')
      return
    }

    try {
      setCreating(true)
      setError(null)

      const orderData = {
        items: [
          {
            product_id: product.id,
            quantity,
            body_zone: bodyZone || undefined,
            notes: notes || undefined,
          },
        ],
        comment: comment || undefined,
      }

      const response = await API.orders.create(orderData, user.id)
      if (response.ok && response.order) {
        navigate(`/order/${response.order.id}`)
      } else {
        setError('Не удалось создать заказ')
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="page page--order">
        <div className="info-banner">Загружаем информацию...</div>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="page page--order">
        <div className="info-banner info-banner--error">{error}</div>
      </div>
    )
  }

  const totalPrice = product ? (product.price_cents * quantity) / 100 : 0

  return (
    <div className="page page--order">
      <h1 className="page__title">ОФОРМЛЕНИЕ ЗАКАЗА</h1>

      {product && (
        <section className="order-card">
          <div className="order-card__details">
            <span className="order-card__title">{product.title}</span>
            <div className="order-card__price">{((product.price_cents * quantity) / 100).toLocaleString('ru-RU')} ₽</div>
          </div>
        </section>
      )}

      <section className="order-info">
        <div className="order-info__row">
          <span>Количество:</span>
          <div className="cart-card__controls">
            <button
              type="button"
              className="counter"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </button>
            <span className="counter counter--value">{quantity}</span>
            <button
              type="button"
              className="counter"
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </button>
          </div>
        </div>

        <label className="input input--flat">
          <span className="input__label">Зона нанесения</span>
          <input
            type="text"
            placeholder="Например: рука, спина, нога (необязательно)"
            value={bodyZone}
            onChange={(e) => setBodyZone(e.target.value)}
          />
        </label>

        <label className="input input--flat">
          <span className="input__label">Дополнительные пожелания к товару</span>
          <textarea
            placeholder="Например: размер, цвет, особенности (необязательно)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </label>

        <label className="input input--flat">
          <span className="input__label">Комментарий к заказу</span>
          <textarea
            placeholder="Опишите желаемый сюжет тату, зону нанесения и другие детали (необязательно)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </label>
      </section>

      <div className="cart-summary order-summary">
        <div className="cart-summary__row">
          <span>Итого</span>
          <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
        </div>
        {error && <div className="info-banner info-banner--error">{error}</div>}
        <button
          type="button"
          className="primary-button"
          onClick={handleCreateOrder}
          disabled={creating || !product}
        >
          {creating ? 'Создание заказа...' : 'Оформить заказ'}
        </button>
      </div>
    </div>
  )
}

export default CreateOrderPage
