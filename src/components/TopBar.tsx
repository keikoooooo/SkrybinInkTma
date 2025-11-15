type TopBarVariant = 'light' | 'dark'

type TopBarProps = {
  title?: string
  subtitle?: string
  variant?: TopBarVariant
}

const TopBar = ({ title = 'SKRYABIN INK', subtitle = 'bot', variant = 'light' }: TopBarProps) => {
  return (
    <header className={`top-bar top-bar--${variant}`}>
      <button type="button" className="top-bar__action" aria-label="Go back">
        <span className="top-bar__icon" aria-hidden="true">
          ‹
        </span>
        <span className="top-bar__action-text">Back</span>
      </button>
      <div className="top-bar__title">
        <span className="top-bar__name">{title}</span>
        {subtitle && <span className="top-bar__subtitle">{subtitle}</span>}
      </div>
      <button type="button" className="top-bar__action top-bar__action--end" aria-label="More options">
        <span className="top-bar__menu">•••</span>
      </button>
    </header>
  )
}

export default TopBar
