import { Navigate } from 'react-router-dom'
import { getSession } from '../lib/auth.js'

export default function ProtectedRoute({ allowRoles, children }) {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />

  if (session.forcePasswordChange && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  const role = String(session.role || '').toUpperCase()
  if (allowRoles && allowRoles.length > 0 && !allowRoles.includes(role)) {
    return <Navigate to="/login" replace />
  }

  return children
}
