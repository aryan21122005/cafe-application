import { Link } from 'react-router-dom'
import { clearSession, getSession } from '../../lib/auth.js'

export default function CustomerDashboard() {
  const session = getSession()

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Customer Dashboard</div>
            <h1 className="mt-1 text-3xl font-extrabold">Hi, {session?.username || 'Customer'}</h1>
          </div>
          <div className="flex gap-3">
            <Link className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm" to="/">Home</Link>
            <button
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              onClick={() => {
                clearSession()
                window.location.href = '/login'
              }}
              type="button"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold">Order faster</div>
            <div className="mt-2 text-sm text-slate-600">Browse menu, customize items, and place orders.</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold">Track your order</div>
            <div className="mt-2 text-sm text-slate-600">Live status updates and pickup/delivery options.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
