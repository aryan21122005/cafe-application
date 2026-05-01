import { Outlet } from 'react-router-dom'
import { clearSession, getSession } from '../../lib/auth.js'
import { useCustomerCart } from '../../lib/customerCart.jsx'
import AppShell from '../../components/AppShell.jsx'

export default function CustomerLayout() {
  const session = getSession()
  const { countItems } = useCustomerCart()

  const items = countItems()


  const navItems = [
    { to: '/dashboard/customer', label: 'Browse' },
    { to: '/dashboard/customer/cart', label: 'Cart', badge: items > 0 ? String(items) : null },
    { to: '/dashboard/customer/bookings', label: 'Bookings' },
    { to: '/dashboard/customer/profile', label: 'Profile' },
    { to: '/dashboard/customer/orders', label: 'Orders' },
    { to: '/dashboard/customer/coupons', label: 'Coupons' },
    { to: '/dashboard/customer/payments', label: 'Payments' }
  ]

  return (
    <AppShell
      roleLabel="Customer"
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
