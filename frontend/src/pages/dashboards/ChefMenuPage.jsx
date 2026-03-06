import { useEffect, useMemo, useState } from 'react'
import { listStaffMenu, updateStaffMenuAvailability } from '../../lib/api.js'
import { getSession } from '../../lib/auth.js'

export default function ChefMenuPage() {
  const session = getSession()
  const username = session?.username

  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const [q, setQ] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => {
    const list = Array.isArray(menu) ? menu : []
    const query = String(q || '').trim().toLowerCase()
    if (!query) return list

    return list.filter((m) => {
      const hay = [m?.id, m?.name, m?.category, m?.price, m?.available]
        .filter((v) => v !== null && v !== undefined)
        .map((v) => String(v).toLowerCase())
        .join(' | ')
      return hay.includes(query)
    })
  }, [menu, q])

  const totalPages = useMemo(() => {
    const size = Number(pageSize) || 10
    return Math.max(1, Math.ceil(filtered.length / size))
  }, [filtered.length, pageSize])

  const paged = useMemo(() => {
    const size = Number(pageSize) || 10
    const safePage = Math.min(Math.max(1, page), totalPages)
    const start = (safePage - 1) * size
    return filtered.slice(start, start + size)
  }, [filtered, page, pageSize, totalPages])

  async function refresh() {
    if (!username) return
    setErr('')
    setMsg('')
    setLoading(true)
    try {
      const m = await listStaffMenu(username)
      setMenu(Array.isArray(m) ? m : [])
    } catch (e) {
      const mm = e?.response?.data
      setErr(typeof mm === 'string' ? mm : 'Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [username])

  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
      <div className="text-xs text-slate-500">Chef / Menu</div>
      <div className="mt-1 text-2xl font-extrabold">Menu Availability</div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Manage menu availability</div>
            <div className="mt-1 text-xs text-slate-600">Toggle items on/off for customers.</div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span>Search:</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-56 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="name / category"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) || 10)
                  setPage(1)
                }}
                className="rounded-lg border border-black/10 bg-white px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
            <button type="button" className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm" onClick={refresh} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>

        {err ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}
        {msg ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{msg}</div> : null}
        {loading ? <div className="mt-4 text-sm text-slate-600">Loading...</div> : null}

        {!loading ? (
          <div className="mt-4 grid gap-2">
            {paged.length > 0 ? (
              paged.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/70 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{m.name}</div>
                    <div className="mt-1 text-xs text-slate-600">₹{m.price ?? 0} {m.category ? `• ${m.category}` : ''}</div>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={async () => {
                      setErr('')
                      setMsg('')
                      setLoading(true)
                      try {
                        await updateStaffMenuAvailability(username, m.id, !m.available)
                        setMsg('Updated')
                        await refresh()
                      } catch (e) {
                        const mm = e?.response?.data
                        setErr(typeof mm === 'string' ? mm : 'Failed to update availability')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    className={
                      m.available
                        ? 'rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-500/15 disabled:opacity-60'
                        : 'rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-900 hover:bg-red-500/15 disabled:opacity-60'
                    }
                  >
                    {m.available ? 'Available' : 'Unavailable'}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-600">No menu items.</div>
            )}

            {filtered.length > 0 ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
                <div>
                  Showing {(Math.min(Math.max(1, page), totalPages) - 1) * (Number(pageSize) || 10) + 1} to{' '}
                  {Math.min(Math.min(Math.max(1, page), totalPages) * (Number(pageSize) || 10), filtered.length)} of {filtered.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <div className="text-xs">Page {Math.min(Math.max(1, page), totalPages)} / {totalPages}</div>
                  <button
                    type="button"
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
