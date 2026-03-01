import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useCustomerCart } from '../../lib/customerCart.jsx'
import { createCustomerOrder } from '../../lib/api.js'
import { getSession } from '../../lib/auth.js'
import { useState } from 'react'

export default function CustomerCartPage() {
  const session = getSession()
  const { cart, cafeId, cafeName, inc, dec, clear, countItems, totalAmount } = useCustomerCart()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [amenity, setAmenity] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const rows = useMemo(() => Object.values(cart || {}), [cart])
  const items = countItems()
  const total = totalAmount()

  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">Customer / Cart</div>
          <div className="mt-1 text-2xl font-extrabold">Your Cart</div>
          <div className="mt-1 text-sm text-slate-600">Items: {items}</div>
          {cafeName ? <div className="mt-1 text-xs text-slate-500">Cafe: {cafeName}</div> : null}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" onClick={clear} disabled={items === 0}>
            Clear
          </button>
          <Link className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500" to="/dashboard/customer">
            Browse
          </Link>
        </div>
      </div>

      {items === 0 ? (
        <div className="mt-6 text-sm text-slate-600">Your cart is empty.</div>
      ) : (
        <>
          <div className="mt-6 grid gap-3">
            {rows.map(({ item, qty }) => (
              <div key={item.id} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold">{item.name}</div>
                    {item.description ? <div className="mt-1 text-xs text-slate-600">{item.description}</div> : null}
                    <div className="mt-2 text-sm font-semibold">₹{item.price ?? 0}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" onClick={() => dec(item.id)}>
                      -
                    </button>
                    <div className="min-w-10 text-center text-sm font-semibold">{qty}</div>
                    <button type="button" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" onClick={() => inc(item.id)}>
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700">Total</span>
              <span className="text-lg font-extrabold">₹{total.toFixed(2)}</span>
            </div>

            {err ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div> : null}
            {msg ? <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</div> : null}

            <div className="mt-3 grid gap-2">
              <div className="grid gap-1">
                <div className="text-xs font-semibold text-slate-600">Name *</div>
                <input className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <div className="text-xs font-semibold text-slate-600">Phone *</div>
                <input className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <div className="text-xs font-semibold text-slate-600">Amenity preference</div>
                <select className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" value={amenity} onChange={(e) => setAmenity(e.target.value)}>
                  <option value="">No preference</option>
                  <option value="WINDOW">Beside window</option>
                  <option value="QUIET">Quiet area</option>
                  <option value="FAMILY">Family seating</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
              disabled={busy}
              onClick={async () => {
                setErr('')
                setMsg('')
                setBusy(true)
                try {
                  if (cafeId == null) {
                    setErr('Cafe not selected. Add items from a cafe first.')
                    return
                  }
                  const itemsPayload = Object.values(cart || {}).map((e) => ({ menuItemId: e?.item?.id, qty: e?.qty }))
                  const payload = { customerName: name, customerPhone: phone, items: itemsPayload, amenityPreference: amenity || null }
                  await createCustomerOrder(session?.username, cafeId, payload)
                  clear()
                  setMsg('Order placed')
                } catch (e) {
                  setErr(typeof e?.response?.data === 'string' ? e.response.data : 'Failed to place order')
                } finally {
                  setBusy(false)
                }
              }}
            >
              Place order
            </button>
          </div>
        </>
      )}
    </div>
  )
}
