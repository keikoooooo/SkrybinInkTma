type TopBarVariant = 'light' | 'dark'

type TopBarProps = {
  title?: string
  subtitle?: string
  variant?: TopBarVariant
}

const TopBar = ({ title = 'SKRYABIN INK', subtitle = 'bot', variant = 'light' }: TopBarProps) => {
  return (
    <header className={`top-bar top-bar--${variant}`}>
      <div className="top-bar__title">
        <span className="top-bar__name">{title}</span>
        {subtitle && <span className="top-bar__subtitle">{subtitle}</span>}
      </div>
    </header>
  )
}

export default TopBar
