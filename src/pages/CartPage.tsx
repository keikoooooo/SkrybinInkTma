import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import useTelegram from '../hooks/useTelegram'
import { API } from '../utils/api'

const CartPage = () => {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart()
  const { user } = useTelegram()
  const navigate = useNavigate()
  const [promoCode, setPromoCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    if (!user?.id) {
      setError('Необходима авторизация')
      return
    }

    if (items.length === 0) {
      setError('Корзина пуста')
      return
    }

    try {
      setIsCreating(true)
      setError(null)

      const orderData = {
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          body_zone: item.body_zone,
          notes: item.notes,
        })),
        promo_code: promoCode || undefined,
      }

      const response = await API.orders.create(orderData, user.id)
      if (response.ok && response.order) {
        clearCart()
        navigate(`/order/${response.order.id}`)
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setIsCreating(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="page page--cart">
        <h1 className="page__title">КОРЗИНА</h1>
        <div className="info-banner">Корзина пуста</div>
      </div>
    )
  }

  return (
    <div className="page page--cart">
      <h1 className="page__title">КОРЗИНА</h1>

      <div className="cart-list">
        {items.map((item) => (
          <div key={item.product_id} className="cart-card">
            <div className="cart-card__info">
              <span className="cart-card__title">{item.title}</span>
              <div className="cart-card__controls">
                <button
                  type="button"
                  className="counter"
                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                >
                  -
                </button>
                <span className="counter counter--value">{item.quantity}</span>
                <button
                  type="button"
                  className="counter"
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <span className="cart-card__price">
                {((item.price_cents * item.quantity) / 100).toLocaleString('ru-RU')} ₽
              </span>
              <button
                type="button"
                className="ghost-button ghost-button--small"
                onClick={() => removeItem(item.product_id)}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-summary__row">
          <span>Итого</span>
          <span>{(total / 100).toLocaleString('ru-RU')} ₽</span>
        </div>
        <label className="input input--flat">
          <input
            type="text"
            placeholder="Промокод или комментарий"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
        </label>
        {error && <div className="info-banner info-banner--error">{error}</div>}
        <button
          type="button"
          className="primary-button"
          onClick={handleCheckout}
          disabled={isCreating}
        >
          {isCreating ? 'Создание заказа...' : 'Оформить заказ'}
        </button>
      </div>
    </div>
  )
}

export default CartPage
