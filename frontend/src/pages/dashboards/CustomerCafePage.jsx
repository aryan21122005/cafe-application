import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { createCustomerBooking, createCustomerOrder, getPublicCafeDetail, listPublicCafeImages, listPublicCafeMenu } from '../../lib/api.js'
import { useCustomerCart } from '../../lib/customerCart.jsx'
import { getSession } from '../../lib/auth.js'

function qtySum(cart) {
  return Object.values(cart || {}).reduce((a, b) => a + (Number(b) || 0), 0)
}

function cartTotal(cart, itemsById) {
  let total = 0
  for (const [id, qty] of Object.entries(cart || {})) {
    const it = itemsById.get(Number(id))
    if (!it) continue
    total += (Number(qty) || 0) * (Number(it.price) || 0)
  }
  return total
}

export default function CustomerCafePage() {
  const session = getSession()
  const { id } = useParams()
  const cafeId = Number(id)

  const [cafe, setCafe] = useState(null)
  const [menu, setMenu] = useState([])
  const [images, setImages] = useState([])
  const [imgIdx, setImgIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const { cart, cafeId: cartCafeId, add, inc, dec, clear, countItems, totalAmount } = useCustomerCart()

  const [bookName, setBookName] = useState('')
  const [bookPhone, setBookPhone] = useState('')
  const [bookDate, setBookDate] = useState('')
  const [bookTime, setBookTime] = useState('')
  const [bookGuests, setBookGuests] = useState('2')
  const [bookNote, setBookNote] = useState('')
  const [bookAmenity, setBookAmenity] = useState('')
  const [bookBusy, setBookBusy] = useState(false)
  const [bookMsg, setBookMsg] = useState('')
  const [bookErr, setBookErr] = useState('')

  const [orderName, setOrderName] = useState('')
  const [orderPhone, setOrderPhone] = useState('')
  const [orderAmenity, setOrderAmenity] = useState('')
  const [orderBusy, setOrderBusy] = useState(false)
  const [orderMsg, setOrderMsg] = useState('')
  const [orderErr, setOrderErr] = useState('')

  const itemsById = useMemo(() => {
    const m = new Map()
    for (const it of menu || []) {
      if (it?.id != null) m.set(Number(it.id), it)
    }
    return m
  }, [menu])

  const totalItems = useMemo(() => countItems(), [countItems])
  const total = useMemo(() => totalAmount(), [totalAmount])

  useEffect(() => {
    let ignore = false
    async function run() {
      if (!cafeId || Number.isNaN(cafeId)) {
        setErr('Invalid cafe')
        setLoading(false)
        return
      }
      setErr('')
      setLoading(true)
      try {
        const [detail, items, imgs] = await Promise.all([getPublicCafeDetail(cafeId), listPublicCafeMenu(cafeId), listPublicCafeImages(cafeId)])
        if (ignore) return
        setCafe(detail || null)
        setMenu(Array.isArray(items) ? items : [])
        const urls = (Array.isArray(imgs) ? imgs : [])
          .map((x) => x?.url)
          .filter((u) => typeof u === 'string' && u.length > 0)
        setImages(urls)
        setImgIdx(0)
      } catch (e) {
        if (ignore) return
        setErr(typeof e?.response?.data === 'string' ? e.response.data : 'Failed to load cafe')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    run()
    return () => {
      ignore = true
    }
  }, [cafeId])

  return (
    <div className="min-h-screen bg-[#EDE4DA] text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500">Customer / Cafe</div>
            <div className="mt-1 text-3xl font-extrabold">{cafe?.cafeName || 'Cafe'}</div>
            <div className="mt-1 text-sm text-slate-600">
              {(cafe?.city || cafe?.state) ? `${cafe.city || ''}${cafe.city && cafe.state ? ', ' : ''}${cafe.state || ''}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm" to="/dashboard/customer">
              Back
            </Link>
          </div>
        </div>

        {err ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}
        {loading ? <div className="mt-6 text-sm text-slate-600">Loading...</div> : null}

        {!loading ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
                <div className="text-sm font-semibold">Cafe info</div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white/70">
                  <div className="relative h-56 w-full bg-slate-100">
                    {images.length > 0 ? (
                      <img src={images[Math.min(imgIdx, images.length - 1)]} alt="Cafe" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No images</div>
                    )}

                    {images.length > 1 ? (
                      <>
                        <button
                          type="button"
                          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-sm font-semibold text-white hover:bg-black/60"
                          onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                        >
                          {'<'}
                        </button>
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-sm font-semibold text-white hover:bg-black/60"
                          onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                        >
                          {'>'}
                        </button>
                        <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white">
                          {imgIdx + 1} / {images.length}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="mt-2 text-sm text-slate-700">{cafe?.description || 'No description.'}</div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <div className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-xs text-slate-700">Phone: {cafe?.phone || '-'}</div>
                  <div className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-xs text-slate-700">WhatsApp: {cafe?.whatsappNumber || '-'}</div>
                  <div className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-xs text-slate-700">Email: {cafe?.email || '-'}</div>
                  <div className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-xs text-slate-700">Hours: {cafe?.openingTime || '-'} - {cafe?.closingTime || '-'}</div>
                </div>

              <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-5">
                <div className="text-sm font-semibold">Book a table</div>
                <div className="mt-1 text-xs text-slate-500">Choose date and time and share your details.</div>

                {bookErr ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{bookErr}</div> : null}
                {bookMsg ? <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{bookMsg}</div> : null}

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="grid gap-1">
                    <div className="text-xs font-semibold text-slate-600">Customer name *</div>
                    <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={bookName} onChange={(e) => setBookName(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <div className="text-xs font-semibold text-slate-600">Phone number *</div>
                    <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={bookPhone} onChange={(e) => setBookPhone(e.target.value)} placeholder="9876543210" />
                  </div>
                  <div className="grid gap-1">
                    <div className="text-xs font-semibold text-slate-600">Date *</div>
                    <input type="date" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={bookDate} onChange={(e) => setBookDate(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <div className="text-xs font-semibold text-slate-600">Time *</div>
                    <input type="time" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={bookTime} onChange={(e) => setBookTime(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <div className="text-xs font-semibold text-slate-600">Guests *</div>
                    <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={bookGuests} onChange={(e) => setBookGuests(e.target.value)} placeholder="2" />
                  </div>
                  <div className="grid gap-1">
                    <div className="text-xs font-semibold text-slate-600">Note</div>
                    <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={bookNote} onChange={(e) => setBookNote(e.target.value)} placeholder="Any special request" />
                  </div>

                  <div className="grid gap-1 md:col-span-2">
                    <div className="text-xs font-semibold text-slate-600">Amenity preference</div>
                    <select className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={bookAmenity} onChange={(e) => setBookAmenity(e.target.value)}>
                      <option value="">No preference</option>
                      <option value="WINDOW">Beside window</option>
                      <option value="QUIET">Quiet area</option>
                      <option value="FAMILY">Family seating</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                    disabled={bookBusy}
                    onClick={async () => {
                      setBookErr('')
                      setBookMsg('')
                      setBookBusy(true)
                      try {
                        const payload = {
                          customerName: bookName,
                          customerPhone: bookPhone,
                          bookingDate: bookDate,
                          bookingTime: bookTime,
                          guests: Number(bookGuests) || 0,
                          note: bookNote,
                          amenityPreference: bookAmenity || null
                        }
                        await createCustomerBooking(session?.username, cafeId, payload)
                        setBookMsg('Booking request created')
                      } catch (e) {
                        setBookErr(typeof e?.response?.data === 'string' ? e.response.data : 'Failed to create booking')
                      } finally {
                        setBookBusy(false)
                      }
                    }}
                  >
                    Book table
                  </button>
                </div>
              </div>
                <div className="mt-3 rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-xs text-slate-700">
                  Address: {cafe?.addressLine || '-'}{cafe?.pincode ? ` • ${cafe.pincode}` : ''}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Menu</div>
                    <div className="mt-1 text-xs text-slate-500">Select items to add them to your cart.</div>
                  </div>
                  <div className="text-xs text-slate-600">Items: {Array.isArray(menu) ? menu.length : 0}</div>
                </div>

                {Array.isArray(menu) && menu.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {menu.map((m) => {
                      const q = Number(cart[String(m.id)]?.qty) || 0
                      return (
                        <div key={m.id} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                              {m.imageUrl ? <img src={m.imageUrl} alt={m.name || 'Item'} className="h-full w-full object-cover" /> : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-extrabold text-slate-900">{m.name || '-'}</div>
                              {m.description ? <div className="mt-1 line-clamp-2 text-xs text-slate-600">{m.description}</div> : null}
                              <div className="mt-2 flex items-center justify-between">
                                <div className="text-sm font-semibold text-slate-900">₹{m.price ?? 0}</div>
                                <div className={`rounded-full px-2 py-1 text-[11px] font-semibold ${m.available ? 'bg-emerald-600/10 text-emerald-800' : 'bg-red-600/10 text-red-700'}`}>
                                  {m.available ? 'Available' : 'Unavailable'}
                                </div>
                              </div>

                              <div className="mt-3 flex items-center justify-end gap-2">
                                {q > 0 ? (
                                  <>
                                    <button
                                      type="button"
                                      className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                                      onClick={() => dec(m.id)}
                                    >
                                      -
                                    </button>
                                    <div className="min-w-10 text-center text-sm font-semibold">{q}</div>
                                    <button
                                      type="button"
                                      className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                                      onClick={() => inc(m.id)}
                                    >
                                      +
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                                    onClick={() => add(m, cafeId, cafe?.cafeName)}
                                    disabled={!m.available}
                                  >
                                    Add
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-slate-600">No menu items found.</div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-6 rounded-2xl border border-black/10 bg-white/70 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Cart</div>
                  <button type="button" className="text-xs font-semibold text-slate-600 hover:underline" onClick={clear} disabled={totalItems === 0}>
                    Clear
                  </button>
                </div>

                {totalItems === 0 ? (
                  <div className="mt-3 text-sm text-slate-600">Your cart is empty.</div>
                ) : (
                  <div className="mt-3 grid gap-2">
                    {Object.entries(cart).map(([itemId, entry]) => {
                      const it = itemsById.get(Number(itemId)) || entry?.item
                      if (!it) return null
                      return (
                        <div key={itemId} className="rounded-xl border border-black/10 bg-white/70 px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">{it.name}</div>
                              <div className="mt-1 text-xs text-slate-600">₹{it.price ?? 0}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" className="rounded-lg border border-black/10 bg-white px-2 py-1 text-sm" onClick={() => dec(it.id)}>
                                -
                              </button>
                              <div className="min-w-6 text-center text-sm font-semibold">{entry?.qty || 0}</div>
                              <button type="button" className="rounded-lg border border-black/10 bg-white px-2 py-1 text-sm" onClick={() => inc(it.id)}>
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    <div className="mt-2 rounded-xl border border-black/10 bg-white/70 px-3 py-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">Items</span>
                        <span className="font-semibold">{totalItems}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="text-slate-700">Total</span>
                        <span className="font-extrabold">₹{total.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="mt-2 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                      disabled={totalItems === 0}
                      onClick={async () => {
                        setOrderErr('')
                        setOrderMsg('')
                        setOrderBusy(true)
                        try {
                          if (cartCafeId != null && cartCafeId !== cafeId) {
                            setOrderErr('Your cart belongs to another cafe. Clear cart to continue.')
                            return
                          }
                          const items = Object.values(cart || {}).map((e) => ({ menuItemId: e?.item?.id, qty: e?.qty }))
                          const payload = { customerName: orderName, customerPhone: orderPhone, items, amenityPreference: orderAmenity || null }
                          await createCustomerOrder(session?.username, cafeId, payload)
                          clear()
                          setOrderMsg('Order placed')
                        } catch (e) {
                          setOrderErr(typeof e?.response?.data === 'string' ? e.response.data : 'Failed to place order')
                        } finally {
                          setOrderBusy(false)
                        }
                      }}
                    >
                      Place order
                    </button>

                    <div className="mt-3 grid gap-2">
                      {orderErr ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{orderErr}</div> : null}
                      {orderMsg ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{orderMsg}</div> : null}
                      <div className="grid gap-1">
                        <div className="text-xs font-semibold text-slate-600">Name for order *</div>
                        <input className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" value={orderName} onChange={(e) => setOrderName(e.target.value)} />
                      </div>
                      <div className="grid gap-1">
                        <div className="text-xs font-semibold text-slate-600">Phone for order *</div>
                        <input className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" value={orderPhone} onChange={(e) => setOrderPhone(e.target.value)} />
                      </div>
                      <div className="grid gap-1">
                        <div className="text-xs font-semibold text-slate-600">Amenity preference</div>
                        <select className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" value={orderAmenity} onChange={(e) => setOrderAmenity(e.target.value)}>
                          <option value="">No preference</option>
                          <option value="WINDOW">Beside window</option>
                          <option value="QUIET">Quiet area</option>
                          <option value="FAMILY">Family seating</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
