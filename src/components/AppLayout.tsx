import { Outlet, useLocation } from 'react-router-dom'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

const navMatch = [
  { key: 'profile', pattern: /^\/?$/ },
  { key: 'profile', pattern: /^\/profile/ },
  { key: 'home', pattern: /^\/home/ },
  { key: 'catalog', pattern: /^\/catalog/ },
  { key: 'cart', pattern: /^\/(cart|order)/ },
  { key: 'search', pattern: /^\/(requests|search)/ },
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
