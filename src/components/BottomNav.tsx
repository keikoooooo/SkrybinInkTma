import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

type BottomNavProps = {
  activeKey: string
  isAdmin?: boolean
}

type NavItem = {
  key: string
  label: string
  to: string
  renderIcon: (active: boolean) => ReactNode
  adminOnly?: boolean
}

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
}

const createStroke = (active: boolean) => (active ? '#111111' : '#5E5E5E')

const profileIcon = (active: boolean) => (
  <svg {...iconProps}>
    <circle cx="12" cy="8" r="3.5" stroke={createStroke(active)} strokeWidth="1.6" />
    <path
      d="M5 19.5C5.3 15.8 8.3 14 12 14C15.7 14 18.7 15.8 19 19.5"
      stroke={createStroke(active)}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)

const gridIcon = (active: boolean) => (
  <svg {...iconProps}>
    {[0, 1, 2, 3].map((index) => {
      const x = (index % 2) * 10 + 4
      const y = Math.floor(index / 2) * 10 + 4
      return <rect key={index} x={x} y={y} width="6" height="6" rx="1.5" stroke={createStroke(active)} strokeWidth="1.6" />
    })}
  </svg>
)

const ordersIcon = (active: boolean) => (
  <svg {...iconProps}>
    <path
      d="M6 7H18M6 7L5 19H19L18 7M6 7L7.5 4H16.5L18 7"
      stroke={createStroke(active)}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="11.5" r="1" fill={createStroke(active)} />
    <circle cx="14" cy="11.5" r="1" fill={createStroke(active)} />
  </svg>
)

const searchIcon = (active: boolean) => (
  <svg {...iconProps}>
    <circle cx="11" cy="11" r="6" stroke={createStroke(active)} strokeWidth="1.6" />
    <line x1="15.5" y1="15.5" x2="19.5" y2="19.5" stroke={createStroke(active)} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const homeIcon = (active: boolean) => (
  <svg {...iconProps}>
    <path
      d="M4.5 10.7L12 4.5L19.5 10.7V19.5H13.8V15.3H10.2V19.5H4.5V10.7Z"
      stroke={createStroke(active)}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
)

const navItems: NavItem[] = [
  { key: 'profile', label: 'Профиль', to: '/profile', renderIcon: profileIcon },
  { key: 'catalog', label: 'Ассортимент', to: '/catalog', renderIcon: gridIcon },
  { key: 'orders', label: 'Заказы', to: '/orders', renderIcon: ordersIcon },
  { key: 'search', label: 'Заявки', to: '/requests', renderIcon: searchIcon, adminOnly: true },
  { key: 'home', label: 'Главная', to: '/home', renderIcon: homeIcon },
]

const BottomNav = ({ activeKey, isAdmin = false }: BottomNavProps) => {
  const visibleItems = navItems.filter((item) => (item.adminOnly ? isAdmin : true))

  return (
    <nav className="bottom-nav">
      {visibleItems.map((item) => {
        const isActive = activeKey === item.key
        return (
          <NavLink key={item.key} to={item.to} className={`bottom-nav__item ${isActive ? 'is-active' : ''}`}>
            <span className="bottom-nav__icon">{item.renderIcon(isActive)}</span>
            <span className="bottom-nav__label">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default BottomNav
