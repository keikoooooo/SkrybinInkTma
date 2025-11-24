import { Outlet, useLocation } from 'react-router-dom'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import { useUserProfile } from '../context/UserContext'

const navMatch = [
  { key: 'profile', pattern: /^\/?$/ },
  { key: 'profile', pattern: /^\/profile/ },
  { key: 'home', pattern: /^\/home/ },
  { key: 'catalog', pattern: /^\/catalog/ },
  { key: 'orders', pattern: /^\/orders/ },
  { key: 'orders', pattern: /^\/order/ },
  { key: 'search', pattern: /^\/(requests|search)/ },
]

const resolveActiveKey = (pathname: string) => {
  const found = navMatch.find(({ pattern }) => pattern.test(pathname))
  return found?.key ?? 'home'
}

const AppLayout = () => {
  const { pathname } = useLocation()
  const activeKey = resolveActiveKey(pathname)
  const { role } = useUserProfile()
  const isAdmin = role === 'admin'

  return (
    <div className="app-shell">
      <TopBar variant={pathname.startsWith('/profile/admin') ? 'dark' : 'light'} />
      <main className="app-content">
        <Outlet />
      </main>
      <BottomNav activeKey={activeKey} isAdmin={isAdmin} />
    </div>
  )
}

export default AppLayout
