import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useUserProfile } from '../context/UserContext'

type BottomNavProps = {
  activeKey: string
}

type NavItem = {
  key: string
  label: string
  to: string
  renderIcon: (active: boolean) => ReactNode
  adminOnly?: boolean
  clientOnly?: boolean
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

const adminIcon = (active: boolean) => (
  <svg {...iconProps}>
    <path
      d="M12 4L14.5 9H19L15.5 12.5L17 18L12 15L7 18L8.5 12.5L5 9H9.5L12 4Z"
      stroke={createStroke(active)}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
)

const ordersIcon = (active: boolean) => (
  <svg {...iconProps}>
    <rect x="5" y="4" width="14" height="16" rx="2" stroke={createStroke(active)} strokeWidth="1.6" />
    <line x1="8" y1="9" x2="16" y2="9" stroke={createStroke(active)} strokeWidth="1.6" strokeLinecap="round" />
    <line x1="8" y1="13" x2="14" y2="13" stroke={createStroke(active)} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const navItems: NavItem[] = [
  { key: 'home', label: 'Главная', to: '/home', renderIcon: homeIcon },
  { key: 'catalog', label: 'Ассортимент', to: '/catalog', renderIcon: gridIcon },
  { key: 'orders', label: 'Мои заказы', to: '/orders', renderIcon: ordersIcon, clientOnly: true },
  { key: 'requests', label: 'Заявки', to: '/requests', renderIcon: searchIcon, adminOnly: true },
  { key: 'profile', label: 'Профиль', to: '/profile', renderIcon: profileIcon },
  { key: 'admin', label: 'Админ', to: '/profile/admin', renderIcon: adminIcon, adminOnly: true },
]

const BottomNav = ({ activeKey }: BottomNavProps) => {
  const { role } = useUserProfile()
  const isAdmin = role === 'admin'

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.clientOnly && isAdmin) return false
    return true
  })

  return (
    <nav className="bottom-nav" style={{ gridTemplateColumns: `repeat(${visibleItems.length}, 1fr)` }}>
      {visibleItems.map((item) => {
        const isActive = activeKey === item.key
        return (
          <NavLink key={item.key} to={item.to} className={`bottom-nav__item ${isActive ? 'is-active' : ''}`}>
            <span className="bottom-nav__icon">
              {item.renderIcon(isActive)}
            </span>
            <span className="bottom-nav__label">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default BottomNav
