import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AppLayout from './components/AppLayout'
import CatalogPage from './pages/CatalogPage'
import CartPage from './pages/CartPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import AdminProfilePage from './pages/AdminProfilePage'
import OrderPage from './pages/OrderPage'
import RequestsPage from './pages/RequestsPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/profile" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/admin" element={<AdminProfilePage />} />
        <Route path="order" element={<OrderPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="*" element={<Navigate to="/profile" replace />} />
      </Route>
    </Routes>
  )
}

export default App
