import { Outlet } from 'react-router-dom'
import { clearSession, getSession } from '../../lib/auth.js'
import AppShell from '../../components/AppShell.jsx'

export default function WaiterLayout() {
  const session = getSession()

  const navItems = [
    { to: '/dashboard/waiter', label: 'Orders' },
    { to: '/dashboard/waiter/profile', label: 'Profile' }
  ]

  return (
    <AppShell
      roleLabel="Waiter"
      username={session?.username}
      navItems={navItems}
      onLogout={() => {
        clearSession()
        window.location.href = '/login'
      }}
    >
      <Outlet />
    </AppShell>
  )
}
