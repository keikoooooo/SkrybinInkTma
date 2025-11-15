import { Link } from 'react-router-dom'

const orderImage =
  'https://images.unsplash.com/photo-1581847511319-9639a34a69f5?auto=format&fit=crop&w=500&q=80'

const OrderPage = () => {
  return (
    <div className="page page--order">
      <div className="order-banner">
        <h1>ВАШ ЗАКАЗ</h1>
      </div>

      <section className="order-card">
        <div className="order-card__media">
          <img src={orderImage} alt="сертификат" />
        </div>
        <div className="order-card__details">
          <span className="order-card__title">сертификат</span>
          <div className="order-card__price">5000 ₽</div>
          <button type="button" className="ghost-button">
            Изменить сумму
          </button>
        </div>
      </section>

      <section className="order-info">
        <div className="order-info__row">
          <span>описание:</span>
          <span>персональный сертификат на авторскую работу</span>
        </div>
        <div className="order-info__row">
          <span>дата:</span>
          <button type="button" className="ghost-button ghost-button--small">
            выбрать
          </button>
        </div>
        <label className="input input--flat">
          <span className="input__label">добавить комментарий:</span>
          <textarea rows={3} placeholder="Опишите пожелания или идеи" />
        </label>
      </section>

      <div className="cart-summary order-summary">
        <div className="cart-summary__row">
          <span>Итого</span>
          <span>30000 ₽</span>
        </div>
        <button type="button" className="primary-button">
          Оплатить
        </button>
        <Link className="link-button" to="/cart">
          Вернуться в корзину
        </Link>
      </div>
    </div>
  )
}

export default OrderPage
