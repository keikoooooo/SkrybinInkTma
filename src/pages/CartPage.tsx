const certificateImage =
  'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=400&q=80'

const CartPage = () => {
  return (
    <div className="page page--cart">
      <h1 className="page__title">КОРЗИНА</h1>
      <label className="input input--search">
        <span className="input__label">Найти</span>
        <input type="search" placeholder="Поиск по корзине" />
      </label>

      <div className="cart-card">
        <img className="cart-card__image" src={certificateImage} alt="Сертификат" />
        <div className="cart-card__info">
          <span className="cart-card__title">сертификат</span>
          <div className="cart-card__controls">
            <span className="counter">-</span>
            <span className="counter counter--value">1</span>
            <span className="counter">+</span>
          </div>
          <span className="cart-card__price">30000 ₽</span>
        </div>
      </div>

      <div className="cart-summary">
        <div className="cart-summary__row">
          <span>Итого</span>
          <span>30000 ₽</span>
        </div>
        <label className="input input--flat">
          <input type="text" placeholder="Промокод или комментарий" />
        </label>
        <button type="button" className="primary-button">
          Оплатить
        </button>
      </div>
    </div>
  )
}

export default CartPage
