import { Link } from 'react-router-dom'
import { clearSession, getSession } from '../../lib/auth.js'

export default function WaiterDashboard() {
  const session = getSession()

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">Waiter Dashboard</div>
            <h1 className="mt-1 text-3xl font-extrabold">Welcome, {session?.username || 'Waiter'}</h1>
          </div>
          <div className="flex gap-3">
            <Link className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm" to="/">Home</Link>
            <button
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950"
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
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold">Tables & orders</div>
            <div className="mt-2 text-sm text-zinc-300">Take orders, update statuses, and request kitchen prep.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold">Payments</div>
            <div className="mt-2 text-sm text-zinc-300">Generate bills and collect payments.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
