import { useEffect, useMemo, useState } from 'react'
import { deleteCustomerBooking, listCustomerBookings } from '../../lib/api.js'
import { getSession } from '../../lib/auth.js'

export default function CustomerOrdersPage() {
  const session = getSession()
  const username = session?.username

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('ALL')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const filteredBookings = useMemo(() => {
    const list = Array.isArray(bookings) ? bookings : []
    const query = String(q || '').trim().toLowerCase()
    const statusQ = String(status || 'ALL').toUpperCase()

    return list.filter((b) => {
      if (statusQ !== 'ALL') {
        const s = String(b?.status || 'PENDING').toUpperCase()
        if (s !== statusQ) return false
      }

      if (!query) return true

      const hay = [
        b?.id,
        b?.cafeName,
        b?.bookingDate,
        b?.bookingTime,
        b?.guests,
        b?.amenityPreference,
        b?.allocatedTable,
        b?.status,
        b?.denialReason
      ]
        .filter((v) => v !== null && v !== undefined)
        .map((v) => String(v).toLowerCase())
        .join(' | ')
      return hay.includes(query)
    })
  }, [bookings, q, status])

  const totalPages = useMemo(() => {
    const size = Number(pageSize) || 10
    return Math.max(1, Math.ceil(filteredBookings.length / size))
  }, [filteredBookings.length, pageSize])

  const pagedBookings = useMemo(() => {
    const size = Number(pageSize) || 10
    const safePage = Math.min(Math.max(1, page), totalPages)
    const start = (safePage - 1) * size
    return filteredBookings.slice(start, start + size)
  }, [filteredBookings, page, pageSize, totalPages])

  async function refresh() {
    if (!username) return
    setErr('')
    setLoading(true)
    try {
      const res = await listCustomerBookings(username)
      setBookings(Array.isArray(res) ? res : [])
    } catch (e) {
      const msg = e?.response?.data
      setErr(typeof msg === 'string' ? msg : 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [username])

  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
      <div className="text-xs text-slate-500">Customer / Orders</div>
      <div className="mt-1 text-2xl font-extrabold">Past Orders</div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Your table bookings</div>
            <div className="mt-1 text-xs text-slate-600">Status updates and denial reasons will appear here.</div>
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

            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span>Status:</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setPage(1)
                }}
                className="rounded-lg border border-black/10 bg-white px-2 py-1"
              >
                <option value="ALL">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="DENIED">Denied</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span>Search:</span>
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
                className="w-56 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="cafe / date / status"
              />
            </div>

            <button type="button" className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm" onClick={refresh} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>

        {err ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}
        {loading ? <div className="mt-4 text-sm text-slate-600">Loading...</div> : null}

        {!loading ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Cafe</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Guests</th>
                  <th className="px-3 py-2">Preference</th>
                  <th className="px-3 py-2">Allocated</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBookings.length > 0 ? (
                  pagedBookings.map((b) => (
                    <tr key={b.id} className="bg-white/60">
                      <td className="px-3 py-2 font-semibold text-slate-900">{b.cafeName || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.bookingDate || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.bookingTime || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.guests ?? '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.amenityPreference || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.allocatedTable || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.status || 'PENDING'}</td>
                      <td className="px-3 py-2 text-slate-600">{b.denialReason || '-'}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-white/80"
                          onClick={async () => {
                            if (!window.confirm('Delete this booking request?')) return
                            setErr('')
                            try {
                              await deleteCustomerBooking(username, b.id)
                              await refresh()
                            } catch (e) {
                              const msg = e?.response?.data
                              setErr(typeof msg === 'string' ? msg : 'Failed to delete booking')
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-4 text-slate-600" colSpan={9}>
                      No bookings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredBookings.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
                <div>
                  Showing {(Math.min(Math.max(1, page), totalPages) - 1) * (Number(pageSize) || 10) + 1} to{' '}
                  {Math.min(Math.min(Math.max(1, page), totalPages) * (Number(pageSize) || 10), filteredBookings.length)} of {filteredBookings.length} entries
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

      <div className="mt-6 text-sm text-slate-600">Orders: Coming soon.</div>
    </div>
  )
}
