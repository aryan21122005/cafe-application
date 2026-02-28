import { Link, Outlet, useLocation } from 'react-router-dom'
import { clearSession, getSession } from '../../lib/auth.js'
import { useCustomerCart } from '../../lib/customerCart.jsx'

function NavItem({ to, label, right, active }) {
  return (
    <Link
      to={to}
      className={
        active
          ? 'flex items-center justify-between rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white'
          : 'flex items-center justify-between rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-white'
      }
    >
      <span>{label}</span>
      {right != null ? <span className={active ? 'text-white/90' : 'text-slate-600'}>{right}</span> : null}
    </Link>
  )
}

export default function CustomerLayout() {
  const session = getSession()
  const loc = useLocation()
  const { countItems } = useCustomerCart()

  const items = countItems()

  const path = loc.pathname
  const isActive = (p) => path === p

  return (
    <div className="min-h-screen bg-[#EDE4DA] text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-4 px-4 py-6 md:px-6">
        <aside className="w-72 shrink-0">
          <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
            <div>
              <div className="text-xs text-slate-500">Customer</div>
              <div className="mt-1 text-xl font-extrabold">{session?.username || 'Customer'}</div>
            </div>

            <div className="mt-4 grid gap-2">
              <NavItem to="/dashboard/customer" label="Browse Cafes" active={isActive('/dashboard/customer')} />
              <NavItem to="/dashboard/customer/cart" label="Cart" right={items > 0 ? String(items) : null} active={isActive('/dashboard/customer/cart')} />
              <NavItem to="/dashboard/customer/profile" label="Profile Management" active={isActive('/dashboard/customer/profile')} />
              <NavItem to="/dashboard/customer/payments" label="Payment Methods" active={isActive('/dashboard/customer/payments')} />
              <NavItem to="/dashboard/customer/coupons" label="Coupons" active={isActive('/dashboard/customer/coupons')} />
              <NavItem to="/dashboard/customer/orders" label="Past Orders" active={isActive('/dashboard/customer/orders')} />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                onClick={() => {
                  clearSession()
                  window.location.href = '/login'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
