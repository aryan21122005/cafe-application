import { Outlet } from 'react-router-dom'
import { clearSession, getSession } from '../../lib/auth.js'
import AppShell from '../../components/AppShell.jsx'

export default function ChefLayout() {
  const session = getSession()

  const navItems = [
    { to: '/dashboard/chef', label: 'Orders' },
    { to: '/dashboard/chef/menu', label: 'Menu' },
    { to: '/dashboard/chef/profile', label: 'Profile' }
  ]

  return (
    <AppShell
      roleLabel="Chef"
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
