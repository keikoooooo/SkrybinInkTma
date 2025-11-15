const requests = [
  {
    id: 'req-1',
    name: 'Алексей',
    date: '15.12.25',
    contact: '+7 900 123-45-67',
    description: 'рукав, блэкворк, первая сессия',
  },
  {
    id: 'req-2',
    name: 'Мария',
    date: '22.12.25',
    contact: '@maryink',
    description: 'маленькое тату, надпись на запястье',
  },
]

const AdminProfilePage = () => {
  return (
    <div className="page page--admin">
      <div className="admin-banner">
        <h1>ПРОФИЛЬ</h1>
      </div>
      <section className="admin-card">
        <header className="admin-card__header">
          <div>
            <span className="admin-card__name">keiko</span>
            <span className="admin-card__role">админ</span>
          </div>
          <div className="admin-card__stats">
            <span>Баланс: 0 ₽</span>
            <span>Бонусы: 0</span>
            <span>Персональная скидка: 0%</span>
          </div>
        </header>

        <div className="admin-card__list">
          {requests.map((request) => (
            <div key={request.id} className="admin-request">
              <div className="admin-request__icon">👤</div>
              <div className="admin-request__content">
                <span className="admin-request__name">{request.name}</span>
                <span className="admin-request__meta">дата сеанса: {request.date}</span>
                <span className="admin-request__meta">контакт: {request.contact}</span>
                <span className="admin-request__description">описание: {request.description}</span>
              </div>
              <button type="button" className="admin-request__download" aria-label="Скачать заявку">
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
