export type PaymentMethod = 'card' | 'installment'

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null
  onSelect: (method: PaymentMethod) => void
  totalPrice: number
}

const PaymentMethodSelector = ({ selected, onSelect, totalPrice }: PaymentMethodSelectorProps) => {
  return (
    <div className="payment-methods">
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Способ оплаты
      </h3>
      <div className="payment-methods__list">
        <button
          type="button"
          className={`payment-method ${selected === 'card' ? 'payment-method--active' : ''}`}
          onClick={() => onSelect('card')}
        >
          <div className="payment-method__icon">💳</div>
          <div className="payment-method__info">
            <span className="payment-method__title">Банковская карта</span>
            <span className="payment-method__description">Оплата сразу</span>
          </div>
          {selected === 'card' && <div className="payment-method__check">✓</div>}
        </button>

        <button
          type="button"
          className={`payment-method ${selected === 'installment' ? 'payment-method--active' : ''}`}
          onClick={() => onSelect('installment')}
        >
          <div className="payment-method__icon">📅</div>
          <div className="payment-method__info">
            <span className="payment-method__title">Рассрочка</span>
            <span className="payment-method__description">
              {totalPrice >= 10000 
                ? `От ${Math.round(totalPrice / 4).toLocaleString('ru-RU')} ₽/мес на 4 месяца`
                : 'Недоступна (мин. сумма 10 000 ₽)'
              }
            </span>
          </div>
          {selected === 'installment' && <div className="payment-method__check">✓</div>}
          {totalPrice < 10000 && (
            <div className="payment-method__disabled" onClick={(e) => e.stopPropagation()}>
              Недоступно
            </div>
          )}
        </button>
      </div>
    </div>
  )
}

export default PaymentMethodSelector

