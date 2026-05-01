import { Link, useLocation } from 'react-router-dom'

export default function AppShell({
  roleLabel,
  username,
  navItems,
  onLogout,
  children
}) {
  const loc = useLocation()
  const path = loc.pathname

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur md:hidden">
        <div className="app-container flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-wide text-slate-500">{roleLabel}</div>
            <div className="truncate text-base font-extrabold">{username || roleLabel}</div>
          </div>
          <button type="button" className="btn-ghost" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="app-container flex gap-6 py-6">
        <aside className="hidden w-72 shrink-0 md:block">
          <div className="sticky top-6">
            <div className="card p-5">
              <div>
                <div className="text-xs text-slate-500">{roleLabel}</div>
                <div className="mt-1 text-xl font-extrabold">{username || roleLabel}</div>
              </div>

              <nav className="mt-4 grid gap-2">
                {(navItems || []).map((it) => {
                  const active = path === it.to
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      className={
                        active
                          ? 'flex items-center justify-between rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white'
                          : 'flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50'
                      }
                    >
                      <span className="truncate">{it.label}</span>
                      {it.badge != null ? (
                        <span className={active ? 'text-white/90' : 'text-slate-600'}>{it.badge}</span>
                      ) : null}
                    </Link>
                  )
                })}
              </nav>

              <div className="mt-5">
                <button type="button" className="btn-primary w-full" onClick={onLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="app-container grid grid-cols-4 gap-2 py-2">
          {(navItems || []).slice(0, 4).map((it) => {
            const active = path === it.to
            return (
              <Link
                key={it.to}
                to={it.to}
                className={
                  active
                    ? 'flex flex-col items-center justify-center rounded-xl bg-orange-50 px-2 py-2 text-xs font-semibold text-orange-700'
                    : 'flex flex-col items-center justify-center rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50'
                }
              >
                <span className="truncate">{it.label}</span>
                {it.badge != null ? (
                  <span className={active ? 'text-orange-700' : 'text-slate-500'}>{it.badge}</span>
                ) : null}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
