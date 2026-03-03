import { getSession } from '../../lib/auth.js'
import { useEffect, useMemo, useState } from 'react'
import { listStaffOrders, updateStaffOrderStatus } from '../../lib/api.js'

export default function ChefDashboard() {
  const session = getSession()
  const username = session?.username

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  async function refresh() {
    if (!username) return
    setErr('')
    setMsg('')
    setLoading(true)
    try {
      const res = await listStaffOrders(username)
      setOrders(Array.isArray(res) ? res : [])
    } catch (e) {
      const m = e?.response?.data
      setErr(typeof m === 'string' ? m : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [username])

  const incoming = useMemo(() => {
    const list = Array.isArray(orders) ? orders : []
    return list.filter((o) => {
      const s = String(o?.status || 'PLACED').toUpperCase()
      return s === 'PLACED' || s === 'PREPARING'
    })
  }, [orders])

  const totalPages = useMemo(() => {
    const size = Number(pageSize) || 10
    return Math.max(1, Math.ceil(incoming.length / size))
  }, [incoming.length, pageSize])

  const pagedIncoming = useMemo(() => {
    const size = Number(pageSize) || 10
    const safePage = Math.min(Math.max(1, page), totalPages)
    const start = (safePage - 1) * size
    return incoming.slice(start, start + size)
  }, [incoming, page, pageSize, totalPages])

  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">Chef / Orders</div>
          <div className="mt-1 text-2xl font-extrabold">Incoming Orders</div>
          <div className="mt-1 text-xs text-slate-600">Update status: PLACED → PREPARING → READY</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
        <div className="mt-4 grid gap-3">
          {incoming.length > 0 ? (
            pagedIncoming.map((o) => {
              const st = String(o?.status || 'PLACED').toUpperCase()
              return (
                <div key={o.id} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">Order #{o.id}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {o.customerName || '-'} • {o.customerPhone || '-'} • {st}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">Allocated: {o.allocatedTable || '-'}</div>
                    </div>
                    <div className="text-sm font-extrabold">₹{o.totalAmount ?? 0}</div>
                  </div>

                  {Array.isArray(o.items) && o.items.length > 0 ? (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[560px] text-left text-sm">
                        <thead className="text-xs font-semibold uppercase text-slate-500">
                          <tr>
                            <th className="px-3 py-2">Item</th>
                            <th className="px-3 py-2">Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {o.items.map((it, idx) => (
                            <tr key={`${o.id}-${idx}`} className="bg-white/60">
                              <td className="px-3 py-2 font-semibold text-slate-900">{it.itemName || '-'}</td>
                              <td className="px-3 py-2 text-slate-700">{it.qty ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
                      disabled={loading || !(st === 'PLACED' || st === 'PREPARING')}
                      onClick={async () => {
                        setErr('')
                        setMsg('')
                        setLoading(true)
                        try {
                          await updateStaffOrderStatus(username, o.id, 'PREPARING')
                          setMsg('Updated')
                          await refresh()
                        } catch (e) {
                          const m = e?.response?.data
                          setErr(typeof m === 'string' ? m : 'Failed to update status')
                        } finally {
                          setLoading(false)
                        }
                      }}
                    >
                      Mark Preparing
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                      disabled={loading || !(st === 'PREPARING' || st === 'READY')}
                      onClick={async () => {
                        setErr('')
                        setMsg('')
                        setLoading(true)
                        try {
                          await updateStaffOrderStatus(username, o.id, 'READY')
                          setMsg('Updated')
                          await refresh()
                        } catch (e) {
                          const m = e?.response?.data
                          setErr(typeof m === 'string' ? m : 'Failed to update status')
                        } finally {
                          setLoading(false)
                        }
                      }}
                    >
                      Mark Ready
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-sm text-slate-600">No incoming orders.</div>
          )}

          {incoming.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
              <div>
                Showing {(Math.min(Math.max(1, page), totalPages) - 1) * (Number(pageSize) || 10) + 1} to{' '}
                {Math.min(Math.min(Math.max(1, page), totalPages) * (Number(pageSize) || 10), incoming.length)} of {incoming.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </button>
                <div className="text-xs">
                  Page {Math.min(Math.max(1, page), totalPages)} of {totalPages}
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
