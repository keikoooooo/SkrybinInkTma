const RequestsPage = () => {
  return (
    <div className="page page--requests">
      <div className="requests-banner">
        <h1>ЗАЯВКА “ИМЯ”</h1>
      </div>
      <section className="request-card">
        <div className="request-card__icon">👤</div>
        <div className="request-card__content">
          <p>имя</p>
          <p>дата сеанса: 00.00.00</p>
          <p>контакт: @username</p>
          <p>описание: желаемый сюжет и зона нанесения</p>
        </div>
      </section>

      <div className="request-actions">
        <button type="button" className="ghost-button">
          Отменить
        </button>
        <button type="button" className="ghost-button ghost-button--icon" aria-label="Назад">
          ←
        </button>
      </div>

      <section className="order-card order-card--compact">
        <div className="order-card__details">
          <span className="order-card__title">ВАШ ЗАКАЗ</span>
          <span className="order-card__price">30000 ₽</span>
        </div>
        <button type="button" className="primary-button">
          Оплатить
        </button>
      </section>
    </div>
  )
}

export default RequestsPage
