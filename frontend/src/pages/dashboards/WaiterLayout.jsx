import { Link, Outlet, useLocation } from 'react-router-dom'
import { clearSession, getSession } from '../../lib/auth.js'

function NavItem({ to, label, active }) {
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
    </Link>
  )
}

export default function WaiterLayout() {
  const session = getSession()
  const loc = useLocation()

  const path = loc.pathname
  const isActive = (p) => path === p

  return (
    <div className="min-h-screen bg-[#EDE4DA] text-slate-900">
      <div className="w-full px-4 py-6 md:px-6">
        <div className="flex h-[calc(100vh-48px)] min-h-0 gap-4 overflow-hidden">
        <aside className="min-h-0 w-72 shrink-0 sticky top-6 h-[calc(100vh-48px)] overflow-y-auto">
          <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
            <div>
              <div className="text-xs text-slate-500">Waiter</div>
              <div className="mt-1 text-xl font-extrabold">{session?.username || 'Waiter'}</div>
            </div>

            <div className="mt-4 grid gap-2">
              <NavItem to="/dashboard/waiter" label="Ready Orders" active={isActive('/dashboard/waiter')} />
              <NavItem to="/dashboard/waiter/profile" label="Profile Management" active={isActive('/dashboard/waiter/profile')} />
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

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">
          <Outlet />
        </main>
        </div>
      </div>
    </div>
  )
}
