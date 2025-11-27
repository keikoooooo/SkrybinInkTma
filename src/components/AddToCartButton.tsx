import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface AddToCartButtonProps {
  productId: number
  title: string
  priceCents: number
}

const AddToCartButton = ({ productId, title, priceCents }: AddToCartButtonProps) => {
  const navigate = useNavigate()
  const [selectedPrice, setSelectedPrice] = useState(priceCents)
  const [showPriceSelector, setShowPriceSelector] = useState(false)

  // Варианты цен (базовая цена и варианты)
  const priceOptions = [
    { label: 'Базовая', value: priceCents },
    { label: 'Средняя', value: Math.round(priceCents * 1.3) },
    { label: 'Премиум', value: Math.round(priceCents * 1.6) },
  ]

  const handleClick = () => {
    if (showPriceSelector) {
      navigate(`/order/create/${productId}?title=${encodeURIComponent(title)}&priceCents=${selectedPrice}`)
    } else {
      setShowPriceSelector(true)
    }
  }

  if (showPriceSelector) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {priceOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={selectedPrice === option.value ? 'primary-button' : 'ghost-button'}
              onClick={() => setSelectedPrice(option.value)}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', textAlign: 'left' }}
            >
              {option.label}: {(option.value / 100).toLocaleString('ru-RU')} ₽
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="primary-button" onClick={handleClick} style={{ flex: 1, padding: '0.5rem' }}>
            Заказать
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => setShowPriceSelector(false)}
            style={{ padding: '0.5rem' }}
          >
            Отмена
          </button>
        </div>
      </div>
    )
  }

  return (
    <button type="button" className="ghost-button ghost-button--small" onClick={handleClick}>
      Заказать
    </button>
  )
}

export default AddToCartButton







