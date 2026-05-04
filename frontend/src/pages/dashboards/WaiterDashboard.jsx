import { getSession } from '../../lib/auth.js'
import { useEffect, useMemo, useState } from 'react'
import { listStaffApprovedBookings, listStaffOrders, serveStaffOrder } from '../../lib/api.js'

export default function WaiterDashboard() {
  const session = getSession()
  const username = session?.username

  const [orders, setOrders] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const [view, setView] = useState('ready')

  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  async function refresh() {
    if (!username) return
    setErr('')
    setMsg('')
    setLoading(true)
    try {
      const [o, b] = await Promise.all([listStaffOrders(username), listStaffApprovedBookings(username)])
      setOrders(Array.isArray(o) ? o : [])
      setBookings(Array.isArray(b) ? b : [])
    } catch (e) {
      const m = e?.response?.data
      setErr(typeof m === 'string' ? m : 'Failed to load waiter queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [username])

  const readyOrders = useMemo(() => {
    const list = Array.isArray(orders) ? orders : []
    return list.filter((o) => String(o?.status || '').toUpperCase() === 'READY')
  }, [orders])

  const historyOrders = useMemo(() => {
    const list = Array.isArray(orders) ? orders : []
    return list.filter((o) => String(o?.status || '').toUpperCase() === 'SERVED')
  }, [orders])

  const listForView = view === 'history' ? historyOrders : readyOrders

  const totalPages = useMemo(() => {
    const size = Number(pageSize) || 10
    return Math.max(1, Math.ceil(listForView.length / size))
  }, [listForView.length, pageSize])

  const pagedReady = useMemo(() => {
    const size = Number(pageSize) || 10
    const safePage = Math.min(Math.max(1, page), totalPages)
    const start = (safePage - 1) * size
    return listForView.slice(start, start + size)
  }, [listForView, page, pageSize, totalPages])

  const tables = useMemo(() => {
    const list = Array.isArray(bookings) ? bookings : []
    const set = new Set()
    for (const b of list) {
      const t = String(b?.allocatedTable || '').trim()
      if (t) set.add(t)
    }
    return Array.from(set)
  }, [bookings])

  const stats = useMemo(() => {
    const list = Array.isArray(orders) ? orders : []
    let total = list.length
    let ready = 0
    let served = 0
    for (const o of list) {
      const s = String(o?.status || '').toUpperCase()
      if (s === 'READY') ready += 1
      if (s === 'SERVED') served += 1
    }
    const approvedBookings = (Array.isArray(bookings) ? bookings : []).length
    const uniqueTables = tables.length
    return { total, ready, served, approvedBookings, uniqueTables }
  }, [orders, bookings, tables.length])

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">Waiter / Orders</div>
          <div className="mt-1 text-2xl font-extrabold">{view === 'history' ? 'Order History' : 'Ready Orders'}</div>
          <div className="mt-1 text-xs text-slate-600">{view === 'history' ? 'Previously served orders.' : 'Serve to booked table'}</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={
                (view === 'ready'
                  ? 'btn-primary'
                  : 'btn-ghost')
              }
              onClick={() => {
                setView('ready')
                setPage(1)
              }}
            >
              Ready
            </button>
            <button
              type="button"
              className={
                (view === 'history'
                  ? 'btn-primary'
                  : 'btn-ghost')
              }
              onClick={() => {
                setView('history')
                setPage(1)
              }}
            >
              History
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) || 10)
                setPage(1)
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
          <button type="button" className="btn-ghost" onClick={refresh} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {err ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}
      {msg ? <div className="mt-4 rounded-xl border border-emerald-600/20 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-800">{msg}</div> : null}
      {loading ? <div className="mt-4 text-sm text-slate-600">Loading...</div> : null}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="card-muted p-4">
          <div className="text-xs font-semibold text-slate-600">Total Orders</div>
          <div className="mt-1 text-2xl font-extrabold">{stats.total}</div>
        </div>
        <div className="card-muted p-4">
          <div className="text-xs font-semibold text-slate-600">Ready</div>
          <div className="mt-1 text-2xl font-extrabold">{stats.ready}</div>
        </div>
        <div className="card-muted p-4">
          <div className="text-xs font-semibold text-slate-600">Served</div>
          <div className="mt-1 text-2xl font-extrabold">{stats.served}</div>
        </div>
        <div className="card-muted p-4">
          <div className="text-xs font-semibold text-slate-600">Approved Bookings</div>
          <div className="mt-1 text-2xl font-extrabold">{stats.approvedBookings}</div>
        </div>
        <div className="card-muted p-4">
          <div className="text-xs font-semibold text-slate-600">Active Tables</div>
          <div className="mt-1 text-2xl font-extrabold">{stats.uniqueTables}</div>
        </div>
      </div>

      {!loading ? (
        <div className="mt-4 grid gap-3">
          {listForView.length > 0 ? (
            pagedReady.map((o) => (
              <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">Order #{o.orderNumber ?? o.id}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      {o.customerName || '-'} • {o.customerPhone || '-'} • {String(o?.status || '').toUpperCase() || '-'}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">Preference: {o.amenityPreference || '-'}</div>
                  </div>
                  <div className="text-sm font-extrabold">₹{o.totalAmount ?? 0}</div>
                </div>

                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div className="text-sm font-semibold text-slate-700">Table: {o.allocatedTable || '-'}</div>

                  <button
                    type="button"
                    className="btn-primary"
                    disabled={loading || view === 'history'}
                    onClick={async () => {
                      setErr('')
                      setMsg('')
                      setLoading(true)
                      try {
                        await serveStaffOrder(username, o.id)
                        setMsg('Served')
                        await refresh()
                      } catch (e) {
                        const m = e?.response?.data
                        setErr(typeof m === 'string' ? m : 'Failed to serve order')
                      } finally {
                        setLoading(false)
                      }
                    }}
                  >
                    Serve
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-600">{view === 'history' ? 'No order history yet.' : 'No ready orders.'}</div>
          )}

          {listForView.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
              <div>
                Showing {(Math.min(Math.max(1, page), totalPages) - 1) * (Number(pageSize) || 10) + 1} to{' '}
                {Math.min(Math.min(Math.max(1, page), totalPages) * (Number(pageSize) || 10), listForView.length)} of {listForView.length} entries
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
