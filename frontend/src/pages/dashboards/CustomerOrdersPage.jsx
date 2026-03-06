import { useEffect, useMemo, useState } from 'react'
import { createRazorpayOrderForCustomerOrder, deleteCustomerOrder, listCustomerOrders, verifyRazorpayPaymentForCustomerOrder } from '../../lib/api.js'
import { getSession } from '../../lib/auth.js'

function TrashIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 16h10l1-16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

export default function CustomerOrdersPage() {
  const session = getSession()
  const username = session?.username

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [payingId, setPayingId] = useState(null)

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true)
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
      if (existing) {
        existing.addEventListener('load', () => resolve(true))
        existing.addEventListener('error', () => resolve(false))
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  async function onPayNow(order) {
    if (!username) return
    if (!order?.id) return
    const status = String(order?.paymentStatus || 'UNPAID').toUpperCase()
    if (status === 'PAID') return

    setErr('')
    setPayingId(order.id)
    try {
      const ok = await loadRazorpayScript()
      if (!ok) throw new Error('Failed to load Razorpay')

      const rp = await createRazorpayOrderForCustomerOrder(username, order.id)

      const options = {
        key: rp.razorpayKeyId,
        amount: rp.amountPaise,
        currency: rp.currency || 'INR',
        name: rp.cafeName || 'Cafe',
        description: `Order #${rp.orderNumber ?? rp.cafeOrderId}`,
        order_id: rp.razorpayOrderId,
        prefill: {
          name: rp.customerName || undefined,
          contact: rp.customerPhone || undefined
        },
        handler: async function (response) {
          try {
            await verifyRazorpayPaymentForCustomerOrder(username, order.id, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
            await refresh()
          } catch (e) {
            const msg = e?.response?.data
            setErr(typeof msg === 'string' ? msg : 'Payment verification failed')
          } finally {
            setPayingId(null)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (resp) {
        const reason = resp?.error?.description || resp?.error?.reason || 'Payment failed'
        setErr(reason)
        setPayingId(null)
      })
      rzp.open()
    } catch (e) {
      const msg = e?.response?.data || e?.message
      setErr(typeof msg === 'string' ? msg : 'Failed to start payment')
      setPayingId(null)
    }
  }

  async function refresh() {
    if (!username) return
    setErr('')
    setLoading(true)
    try {
      const o = await listCustomerOrders(username)
      setOrders(Array.isArray(o) ? o : [])
    } catch (e) {
      const msg = e?.response?.data
      setErr(typeof msg === 'string' ? msg : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [username])

  useEffect(() => {
    if (!username) return
    const t = setInterval(() => {
      refresh()
    }, 8000)
    return () => clearInterval(t)
  }, [username])

  const [ordersQ, setOrdersQ] = useState('')
  const [ordersStatus, setOrdersStatus] = useState('ALL')
  const [ordersPageSize, setOrdersPageSize] = useState(10)
  const [ordersPage, setOrdersPage] = useState(1)

  const filteredOrders = useMemo(() => {
    const list = Array.isArray(orders) ? orders : []
    const query = String(ordersQ || '').trim().toLowerCase()
    const statusQ = String(ordersStatus || 'ALL').toUpperCase()

    return list.filter((o) => {
      const s = String(o?.status || 'PLACED').toUpperCase()
      if (statusQ !== 'ALL' && s !== statusQ) return false
      if (!query) return true

      const hay = [o?.id, o?.cafeName, o?.customerName, o?.customerPhone, o?.status, o?.allocatedTable, o?.amenityPreference]
        .filter((v) => v !== null && v !== undefined)
        .map((v) => String(v).toLowerCase())
        .join(' | ')
      return hay.includes(query)
    })
  }, [orders, ordersQ, ordersStatus])

  const ordersTotalPages = useMemo(() => {
    const size = Number(ordersPageSize) || 10
    return Math.max(1, Math.ceil(filteredOrders.length / size))
  }, [filteredOrders.length, ordersPageSize])

  const pagedOrders = useMemo(() => {
    const size = Number(ordersPageSize) || 10
    const safePage = Math.min(Math.max(1, ordersPage), ordersTotalPages)
    const start = (safePage - 1) * size
    return filteredOrders.slice(start, start + size)
  }, [filteredOrders, ordersPage, ordersPageSize, ordersTotalPages])

  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
      <div className="text-xs text-slate-500">Customer / Orders</div>
      <div className="mt-1 text-2xl font-extrabold">Past Orders</div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Your food orders</div>
            <div className="mt-1 text-xs text-slate-600">Status will change as Chef/Waiter updates it (READY/SERVED).</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span>Show</span>
              <select
                value={ordersPageSize}
                onChange={(e) => {
                  setOrdersPageSize(Number(e.target.value) || 10)
                  setOrdersPage(1)
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
                value={ordersStatus}
                onChange={(e) => {
                  setOrdersStatus(e.target.value)
                  setOrdersPage(1)
                }}
                className="rounded-lg border border-black/10 bg-white px-2 py-1"
              >
                <option value="ALL">All</option>
                <option value="PLACED">Placed</option>
                <option value="PREPARING">Preparing</option>
                <option value="READY">Ready</option>
                <option value="SERVED">Served</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span>Search:</span>
              <input
                value={ordersQ}
                onChange={(e) => {
                  setOrdersQ(e.target.value)
                  setOrdersPage(1)
                }}
                className="w-56 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="cafe / status / table"
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
          <div className="mt-4 grid gap-3">
            {filteredOrders.length > 0 ? (
              pagedOrders.map((o) => (
                <div key={o.id} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">Order #{o.orderNumber ?? o.id}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {o.cafeName || '-'} • {o.status || 'PLACED'}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">Payment: {o.paymentStatus || 'UNPAID'}</div>
                      <div className="mt-1 text-xs text-slate-600">Allocated: {o.allocatedTable || '-'} • Preference: {o.amenityPreference || '-'}</div>
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

                  <div className="mt-3 flex justify-end gap-2">
                    {String(o?.paymentStatus || 'UNPAID').toUpperCase() !== 'PAID' ? (
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                        disabled={loading || payingId === o.id}
                        onClick={() => onPayNow(o)}
                      >
                        {payingId === o.id ? 'Opening...' : 'Pay Now'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-white/80 disabled:opacity-50"
                      disabled={loading}
                      onClick={async () => {
                        if (!window.confirm('Delete this order?')) return
                        setErr('')
                        try {
                          await deleteCustomerOrder(username, o.id)
                          await refresh()
                        } catch (e) {
                          const d = e?.response?.data
                          const msg = typeof d === 'string' ? d : (d?.message || d?.error || null)
                          setErr(msg || 'Failed to delete order')
                        }
                      }}
                      aria-label="Delete order"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-600">No orders yet.</div>
            )}

            {filteredOrders.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
                <div>
                  Showing {(Math.min(Math.max(1, ordersPage), ordersTotalPages) - 1) * (Number(ordersPageSize) || 10) + 1} to{' '}
                  {Math.min(
                    Math.min(Math.max(1, ordersPage), ordersTotalPages) * (Number(ordersPageSize) || 10),
                    filteredOrders.length
                  )}{' '}
                  of {filteredOrders.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                    disabled={ordersPage <= 1}
                  >
                    Prev
                  </button>
                  <div className="text-xs">
                    Page {Math.min(Math.max(1, ordersPage), ordersTotalPages)} of {ordersTotalPages}
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    onClick={() => setOrdersPage((p) => Math.min(ordersTotalPages, p + 1))}
                    disabled={ordersPage >= ordersTotalPages}
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
