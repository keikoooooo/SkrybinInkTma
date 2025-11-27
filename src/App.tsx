import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AppLayout from './components/AppLayout'
import CatalogPage from './pages/CatalogPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import AdminProfilePage from './pages/AdminProfilePage'
import OrderPage from './pages/OrderPage'
import CreateOrderPage from './pages/CreateOrderPage'
import OrdersPage from './pages/OrdersPage'
import RequestsPage from './pages/RequestsPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/admin" element={<AdminProfilePage />} />
        <Route path="order/create/:productId" element={<CreateOrderPage />} />
        <Route path="order/:id" element={<OrderPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  )
}

export default App
