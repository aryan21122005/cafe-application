import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import ChangePassword from './pages/ChangePassword.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { getSession, roleToDashboardPath } from './lib/auth.js'
import AdminDashboard from './pages/dashboards/AdminDashboard.jsx'
import CustomerDashboard from './pages/dashboards/CustomerDashboard.jsx'
import CustomerCafePage from './pages/dashboards/CustomerCafePage.jsx'
import CustomerLayout from './pages/dashboards/CustomerLayout.jsx'
import CustomerCartPage from './pages/dashboards/CustomerCartPage.jsx'
import CustomerProfilePage from './pages/dashboards/CustomerProfilePage.jsx'
import CustomerPaymentsPage from './pages/dashboards/CustomerPaymentsPage.jsx'
import CustomerCouponsPage from './pages/dashboards/CustomerCouponsPage.jsx'
import CustomerOrdersPage from './pages/dashboards/CustomerOrdersPage.jsx'
import OwnerDashboard from './pages/dashboards/OwnerDashboard.jsx'
import ChefDashboard from './pages/dashboards/ChefDashboard.jsx'
import WaiterDashboard from './pages/dashboards/WaiterDashboard.jsx'
import { CustomerCartProvider } from './lib/customerCart.jsx'

export default function App() {
  const session = getSession()

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={<Navigate to={roleToDashboardPath(session?.role)} replace />}
      />
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute allowRoles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/customer"
        element={
          <ProtectedRoute allowRoles={["CUSTOMER"]}>
            <CustomerCartProvider>
              <CustomerLayout />
            </CustomerCartProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<CustomerDashboard />} />
        <Route path="cafes/:id" element={<CustomerCafePage />} />
        <Route path="cart" element={<CustomerCartPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
        <Route path="payments" element={<CustomerPaymentsPage />} />
        <Route path="coupons" element={<CustomerCouponsPage />} />
        <Route path="orders" element={<CustomerOrdersPage />} />
      </Route>
      <Route
        path="/dashboard/owner"
        element={
          <ProtectedRoute allowRoles={["OWNER"]}>
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/chef"
        element={
          <ProtectedRoute allowRoles={["CHEF"]}>
            <ChefDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/waiter"
        element={
          <ProtectedRoute allowRoles={["WAITER"]}>
            <WaiterDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}