import { Outlet, useLocation } from 'react-router-dom'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

const navMatch = [
  { key: 'admin', pattern: /^\/profile\/admin/ },
  { key: 'home', pattern: /^\/home/ },
  { key: 'home', pattern: /^\/?$/ },
  { key: 'profile', pattern: /^\/profile/ },
  { key: 'catalog', pattern: /^\/catalog/ },
  { key: 'orders', pattern: /^\/(orders|order)/ },
  { key: 'requests', pattern: /^\/requests/ },
]

const resolveActiveKey = (pathname: string) => {
  const found = navMatch.find(({ pattern }) => pattern.test(pathname))
  return found?.key ?? 'home'
}

const AppLayout = () => {
  const { pathname } = useLocation()
  const activeKey = resolveActiveKey(pathname)

  return (
    <div className="app-shell">
      <TopBar variant={pathname.startsWith('/profile/admin') ? 'dark' : 'light'} />
      <main className="app-content">
        <Outlet />
      </main>
      <BottomNav activeKey={activeKey} />
    </div>
  )
}

export default AppLayout
