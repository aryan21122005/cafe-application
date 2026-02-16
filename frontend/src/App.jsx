import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import ChangePassword from './pages/ChangePassword.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { getSession, roleToDashboardPath } from './lib/auth.js'
import AdminDashboard from './pages/dashboards/AdminDashboard.jsx'
import CustomerDashboard from './pages/dashboards/CustomerDashboard.jsx'
import OwnerDashboard from './pages/dashboards/OwnerDashboard.jsx'
import ChefDashboard from './pages/dashboards/ChefDashboard.jsx'
import WaiterDashboard from './pages/dashboards/WaiterDashboard.jsx'

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
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
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