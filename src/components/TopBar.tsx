import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

type TopBarVariant = 'light' | 'dark'

type TopBarProps = {
  title?: string
  subtitle?: string
  variant?: TopBarVariant
}

const TopBar = ({ title = 'SKRYABIN INK', subtitle = 'bot', variant = 'light' }: TopBarProps) => {
  const navigate = useNavigate()

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/home')
    }
  }, [navigate])

  const handleMenu = useCallback(() => {
    navigate('/orders')
  }, [navigate])

  return (
    <header className={`top-bar top-bar--${variant}`}>
      <button type="button" className="top-bar__action" aria-label="Назад" onClick={handleBack}>
        <span className="top-bar__icon" aria-hidden="true">
          ‹
        </span>
        <span className="top-bar__action-text">Назад</span>
      </button>
      <div className="top-bar__title">
        <span className="top-bar__name">{title}</span>
        {subtitle && <span className="top-bar__subtitle">{subtitle}</span>}
      </div>
      <button
        type="button"
        className="top-bar__action top-bar__action--end"
        aria-label="Открыть заказы"
        onClick={handleMenu}
      >
        <span className="top-bar__menu">•••</span>
      </button>
    </header>
  )
}

export default TopBar
