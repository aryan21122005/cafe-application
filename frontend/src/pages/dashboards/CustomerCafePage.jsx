import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  confirmRazorpayCustomerBookingFoodOrder,
  confirmRazorpayCustomerCartOrder,
  createCustomerBooking,
  createCustomerOrder,
  createRazorpayOrderForCustomerBooking,
  createRazorpayOrderForCustomerBookingFood,
  createRazorpayOrderForCustomerCart,
  getMyProfile,
  getPublicCafeDetail,
  getPublicAvailableTables,
  listPublicCafeImages,
  listPublicCafeAmenities,
  listPublicCafeMenu,
  verifyRazorpayPaymentForCustomerBooking
} from '../../lib/api.js'
import { useCustomerCart } from '../../lib/customerCart.jsx'
import { getSession } from '../../lib/auth.js'

function qtySum(cart) {
  return Object.values(cart || {}).reduce((a, b) => a + (Number(b) || 0), 0)
}

function togglePick(list, value, limit) {
  const v = String(value)
  const cur = Array.isArray(list) ? list : []
  if (cur.includes(v)) return cur.filter((x) => x !== v)
  if (limit != null && cur.length >= limit) return cur
  return [...cur, v]
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

  const [searchParams] = useSearchParams()
  const bookingIdParam = searchParams.get('bookingId')
  const bookingId = bookingIdParam ? Number(bookingIdParam) : null
  const isBookingFoodFlow = bookingId != null && !Number.isNaN(bookingId)

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
  const [bookFunctionType, setBookFunctionType] = useState('DINE_IN')
  const [bookAmenities, setBookAmenities] = useState([])
  const [bookAvailableTables, setBookAvailableTables] = useState([])
  const [bookTablesNeeded, setBookTablesNeeded] = useState(1)
  const [bookSelectedTables, setBookSelectedTables] = useState([])
  const [bookBusy, setBookBusy] = useState(false)
  const [bookMsg, setBookMsg] = useState('')
  const [bookErr, setBookErr] = useState('')
  const [bookPaying, setBookPaying] = useState(false)

  const [me, setMe] = useState(null)
  const [orderAmenity, setOrderAmenity] = useState('')
  const [orderFunctionType, setOrderFunctionType] = useState('DINE_IN')
  const [orderAmenities, setOrderAmenities] = useState([])
  const [orderAvailableTables, setOrderAvailableTables] = useState([])
  const [orderTablesNeeded, setOrderTablesNeeded] = useState(1)
  const [orderSelectedTables, setOrderSelectedTables] = useState([])
  const [orderDate, setOrderDate] = useState('')
  const [orderTime, setOrderTime] = useState('')
  const [orderGuests, setOrderGuests] = useState('2')
  const [orderBusy, setOrderBusy] = useState(false)
  const [orderMsg, setOrderMsg] = useState('')
  const [orderErr, setOrderErr] = useState('')

  const derivedName = useMemo(() => {
    const pd = me?.personalDetails || {}
    return String([pd?.firstName, pd?.lastName].filter(Boolean).join(' ') || '').trim()
  }, [me])

  const derivedPhone = useMemo(() => {
    const pd = me?.personalDetails || {}
    return String(pd?.phone || '').trim()
  }, [me])

  const canBookTables = useMemo(() => {
    const need = Number(bookTablesNeeded) || 1
    return (Array.isArray(bookSelectedTables) ? bookSelectedTables : []).length === need
  }, [bookSelectedTables, bookTablesNeeded])

  const canOrderTables = useMemo(() => {
    if (isBookingFoodFlow) return true
    const need = Number(orderTablesNeeded) || 1
    return (Array.isArray(orderSelectedTables) ? orderSelectedTables : []).length === need
  }, [isBookingFoodFlow, orderSelectedTables, orderTablesNeeded])

  useEffect(() => {
    if (!cafeId || Number.isNaN(cafeId)) return
    ;(async () => {
      try {
        const list = await listPublicCafeAmenities(cafeId, bookFunctionType)
        setBookAmenities(Array.isArray(list) ? list : [])
      } catch {
        setBookAmenities([])
      }
    })()
  }, [cafeId, bookFunctionType])

  useEffect(() => {
    if (!cafeId || Number.isNaN(cafeId)) return
    if (!bookDate || !bookTime || !bookFunctionType) {
      setBookAvailableTables([])
      setBookTablesNeeded(1)
      setBookSelectedTables([])
      return
    }
    ;(async () => {
      try {
        const res = await getPublicAvailableTables(cafeId, {
          functionType: bookFunctionType,
          bookingDate: bookDate,
          bookingTime: bookTime,
          guests: Number(bookGuests) || 1,
          amenity: bookAmenity || undefined
        })
        const avail = Array.isArray(res?.availableTables) ? res.availableTables : []
        setBookAvailableTables(avail)
        const needed = Number(res?.tablesNeeded) || 1
        setBookTablesNeeded(needed)
        setBookSelectedTables((prev) => {
          const cleaned = (Array.isArray(prev) ? prev : []).filter((t) => avail.includes(t))
          if (cleaned.length >= needed) return cleaned.slice(0, needed)
          const toAdd = avail.filter((t) => !cleaned.includes(t)).slice(0, needed - cleaned.length)
          return [...cleaned, ...toAdd]
        })
      } catch {
        setBookAvailableTables([])
        setBookTablesNeeded(1)
        setBookSelectedTables([])
      }
    })()
  }, [cafeId, bookDate, bookTime, bookGuests, bookAmenity, bookFunctionType])

  useEffect(() => {
    if (!cafeId || Number.isNaN(cafeId)) return
    ;(async () => {
      try {
        const list = await listPublicCafeAmenities(cafeId, orderFunctionType)
        setOrderAmenities(Array.isArray(list) ? list : [])
      } catch {
        setOrderAmenities([])
      }
    })()
  }, [cafeId, orderFunctionType])

  useEffect(() => {
    if (!cafeId || Number.isNaN(cafeId)) return
    if (isBookingFoodFlow) {
      setOrderAvailableTables([])
      setOrderTablesNeeded(1)
      setOrderSelectedTables([])
      return
    }
    if (!orderDate || !orderTime || !orderFunctionType) {
      setOrderAvailableTables([])
      setOrderTablesNeeded(1)
      setOrderSelectedTables([])
      return
    }
    ;(async () => {
      try {
        const res = await getPublicAvailableTables(cafeId, {
          functionType: orderFunctionType,
          bookingDate: orderDate,
          bookingTime: orderTime,
          guests: Number(orderGuests) || 1,
          amenity: orderAmenity || undefined
        })
        const avail = Array.isArray(res?.availableTables) ? res.availableTables : []
        setOrderAvailableTables(avail)
        const needed = Number(res?.tablesNeeded) || 1
        setOrderTablesNeeded(needed)
        setOrderSelectedTables((prev) => {
          const cleaned = (Array.isArray(prev) ? prev : []).filter((t) => avail.includes(t))
          if (cleaned.length >= needed) return cleaned.slice(0, needed)
          const toAdd = avail.filter((t) => !cleaned.includes(t)).slice(0, needed - cleaned.length)
          return [...cleaned, ...toAdd]
        })
      } catch {
        setOrderAvailableTables([])
        setOrderTablesNeeded(1)
        setOrderSelectedTables([])
      }
    })()
  }, [cafeId, isBookingFoodFlow, orderDate, orderTime, orderGuests, orderAmenity, orderFunctionType])

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

  useEffect(() => {
    const username = String(session?.username || '').trim()
    if (!username) return
    ;(async () => {
      try {
        const p = await getMyProfile(username)
        setMe(p && typeof p === 'object' ? p : null)
      } catch {
        setMe(null)
      }
    })()
  }, [session?.username])

  return (
    <div className="min-h-screen bg-[#EDE4DA] text-slate-900">
      <div className="w-full px-6 py-10">
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
                <div className="mt-1 text-xs text-slate-500">Choose date and time and then select function, amenity, and table(s).</div>

                {bookErr ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{bookErr}</div> : null}
                {bookMsg ? <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{bookMsg}</div> : null}

                <div className="mt-4 grid gap-3 md:grid-cols-2">
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
                      {(Array.isArray(bookAmenities) ? bookAmenities : []).map((a) => (
                        <option key={a.id} value={a.name}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-1 md:col-span-2">
                    <div className="text-xs font-semibold text-slate-600">Function type</div>
                    <select className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={bookFunctionType} onChange={(e) => setBookFunctionType(e.target.value)}>
                      <option value="DINE_IN">DINE_IN</option>
                      <option value="BIRTHDAY">BIRTHDAY</option>
                      <option value="CORPORATE">CORPORATE</option>
                    </select>
                  </div>

                  <div className="grid gap-1 md:col-span-2">
                    <div className="text-xs font-semibold text-slate-600">Table(s) (select {bookTablesNeeded})</div>
                    <div className="rounded-xl border border-black/10 bg-white p-3">
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(bookAvailableTables) ? bookAvailableTables : []).length === 0 ? (
                          <div className="text-sm text-slate-500">No tables available.</div>
                        ) : (
                          (Array.isArray(bookAvailableTables) ? bookAvailableTables : []).map((t) => {
                            const selected = (Array.isArray(bookSelectedTables) ? bookSelectedTables : []).includes(t)
                            return (
                              <button
                                key={t}
                                type="button"
                                className={
                                  selected
                                    ? 'rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-900'
                                    : 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'
                                }
                                onClick={() => {
                                  setBookSelectedTables((prev) => togglePick(prev, t, Number(bookTablesNeeded) || 1))
                                }}
                              >
                                {t}
                              </button>
                            )
                          })
                        )}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Selected {(Array.isArray(bookSelectedTables) ? bookSelectedTables : []).length} / {bookTablesNeeded}
                        {!canBookTables ? ' (select exact tables)' : ''}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                    disabled={bookBusy || !canBookTables}
                    onClick={async () => {
                      setBookErr('')
                      setBookMsg('')
                      setBookBusy(true)
                      try {
                        if (!derivedName || !derivedPhone) {
                          setBookErr('Please complete your profile (name and phone) before booking.')
                          return
                        }
                        if (!canBookTables) {
                          setBookErr(`Please select exactly ${Number(bookTablesNeeded) || 1} table(s).`)
                          return
                        }
                        const payload = {
                          customerName: derivedName,
                          customerPhone: derivedPhone,
                          bookingDate: bookDate,
                          bookingTime: bookTime,
                          guests: Number(bookGuests) || 0,
                          note: String(bookNote || '').trim() || '-',
                          amenityPreference: bookAmenity || null,
                          functionType: bookFunctionType,
                          allocatedTable: (Array.isArray(bookSelectedTables) && bookSelectedTables.length > 0) ? bookSelectedTables.join(', ') : null
                        }
                        const created = await createCustomerBooking(session?.username, cafeId, payload)

                        const ok = await loadRazorpayScript()
                        if (!ok) throw new Error('Failed to load Razorpay')

                        setBookPaying(true)
                        const rp = await createRazorpayOrderForCustomerBooking(session?.username, created?.id)

                        await new Promise((resolve, reject) => {
                          const options = {
                            key: rp.razorpayKeyId,
                            amount: rp.amountPaise,
                            currency: rp.currency || 'INR',
                            name: rp.cafeName || 'Cafe',
                            description: 'Booking fee (₹10)',
                            order_id: rp.razorpayOrderId,
                            prefill: {
                              name: rp.customerName || undefined,
                              contact: rp.customerPhone || undefined
                            },
                            handler: async function (response) {
                              try {
                                await verifyRazorpayPaymentForCustomerBooking(session?.username, created?.id, {
                                  razorpayOrderId: response.razorpay_order_id,
                                  razorpayPaymentId: response.razorpay_payment_id,
                                  razorpaySignature: response.razorpay_signature
                                })
                                resolve(true)
                              } catch (e) {
                                reject(e)
                              }
                            }
                          }

                          const rzp = new window.Razorpay(options)
                          rzp.on('payment.failed', function (resp) {
                            reject(new Error(resp?.error?.description || resp?.error?.reason || 'Payment failed'))
                          })
                          rzp.open()
                        })

                        setBookMsg('Booking paid and created')
                      } catch (e) {
                        const msg = e?.response?.data || e?.message
                        setBookErr(typeof msg === 'string' ? msg : 'Failed to create booking')
                      } finally {
                        setBookPaying(false)
                        setBookBusy(false)
                      }
                    }}
                  >
                    {bookPaying ? 'Paying...' : 'Book table'}
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
                          const username = String(session?.username || '').trim()
                          if (!username) {
                            setOrderErr('Session expired. Please login again.')
                            return
                          }

                          const pd = me?.personalDetails || {}
                          const derivedName = String([pd?.firstName, pd?.lastName].filter(Boolean).join(' ') || '').trim()
                          const derivedPhone = String(pd?.phone || '').trim()
                          if (!derivedName || !derivedPhone) {
                            setOrderErr('Please complete your profile (name and phone) before placing an order.')
                            return
                          }

                          if (!canOrderTables) {
                            setOrderErr(`Please select exactly ${Number(orderTablesNeeded) || 1} table(s).`)
                            return
                          }

                          const items = Object.values(cart || {}).map((e) => ({ menuItemId: e?.item?.id, qty: e?.qty }))
                          const orderPayload = {
                            cafeId,
                            customerName: derivedName,
                            customerPhone: derivedPhone,
                            items,
                            amenityPreference: orderAmenity || null,
                            allocatedTable:
                              Array.isArray(orderSelectedTables) && orderSelectedTables.length > 0 ? orderSelectedTables.join(', ') : null,
                            functionType: orderFunctionType
                          }

                          if (!isBookingFoodFlow) {
                            orderPayload.bookingDate = orderDate
                            orderPayload.bookingTime = orderTime
                            orderPayload.guests = Number(orderGuests) || 1
                          }

                          const ok = await loadRazorpayScript()
                          if (!ok) throw new Error('Failed to load Razorpay')

                          const rp = isBookingFoodFlow
                            ? await createRazorpayOrderForCustomerBookingFood(username, bookingId, orderPayload)
                            : await createRazorpayOrderForCustomerCart(username, orderPayload)

                          await new Promise((resolve, reject) => {
                            const options = {
                              key: rp.razorpayKeyId,
                              amount: rp.amountPaise,
                              currency: rp.currency || 'INR',
                              name: rp.cafeName || 'Cafe',
                              description: 'Order payment',
                              order_id: rp.razorpayOrderId,
                              prefill: {
                                name: rp.customerName || undefined,
                                contact: rp.customerPhone || undefined
                              },
                              handler: async function (response) {
                                try {
                                  if (isBookingFoodFlow) {
                                    await confirmRazorpayCustomerBookingFoodOrder(username, bookingId, {
                                      order: orderPayload,
                                      payment: {
                                        razorpayOrderId: response.razorpay_order_id,
                                        razorpayPaymentId: response.razorpay_payment_id,
                                        razorpaySignature: response.razorpay_signature
                                      }
                                    })
                                  } else {
                                    await confirmRazorpayCustomerCartOrder(username, {
                                      order: orderPayload,
                                      payment: {
                                        razorpayOrderId: response.razorpay_order_id,
                                        razorpayPaymentId: response.razorpay_payment_id,
                                        razorpaySignature: response.razorpay_signature
                                      }
                                    })
                                  }
                                  resolve(true)
                                } catch (e) {
                                  reject(e)
                                }
                              }
                            }

                            const rzp = new window.Razorpay(options)
                            rzp.on('payment.failed', function (resp) {
                              reject(new Error(resp?.error?.description || resp?.error?.reason || 'Payment failed'))
                            })
                            rzp.open()
                          })

                          clear()
                          setOrderMsg(isBookingFoodFlow ? 'Food paid and order placed for booking' : 'Order paid and placed')
                        } catch (e) {
                          const d = e?.response?.data
                          const msg = (typeof d === 'string' ? d : (d?.message || d?.error || null)) || e?.message
                          setOrderErr(msg || 'Failed to place order')
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
                      {!isBookingFoodFlow ? (
                        <>
                          <div className="grid gap-1">
                            <div className="text-xs font-semibold text-slate-600">Date *</div>
                            <input
                              type="date"
                              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                              value={orderDate}
                              onChange={(e) => setOrderDate(e.target.value)}
                            />
                          </div>

                          <div className="grid gap-1">
                            <div className="text-xs font-semibold text-slate-600">Time *</div>
                            <input
                              type="time"
                              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                              value={orderTime}
                              onChange={(e) => setOrderTime(e.target.value)}
                            />
                          </div>

                          <div className="grid gap-1">
                            <div className="text-xs font-semibold text-slate-600">Guests *</div>
                            <input
                              type="number"
                              min={1}
                              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                              value={orderGuests}
                              onChange={(e) => setOrderGuests(e.target.value)}
                            />
                          </div>
                        </>
                      ) : null}
                      <div className="grid gap-1">
                        <div className="text-xs font-semibold text-slate-600">Amenity preference</div>
                        <select className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" value={orderAmenity} onChange={(e) => setOrderAmenity(e.target.value)}>
                          <option value="">No preference</option>
                          {(Array.isArray(orderAmenities) ? orderAmenities : []).map((a) => (
                            <option key={a.id} value={a.name}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-1">
                        <div className="text-xs font-semibold text-slate-600">Function type</div>
                        <select className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" value={orderFunctionType} onChange={(e) => setOrderFunctionType(e.target.value)}>
                          <option value="DINE_IN">DINE_IN</option>
                          <option value="BIRTHDAY">BIRTHDAY</option>
                          <option value="CORPORATE">CORPORATE</option>
                        </select>
                      </div>

                      {!isBookingFoodFlow ? (
                        <div className="grid gap-1">
                          <div className="text-xs font-semibold text-slate-600">Table(s) (select {orderTablesNeeded})</div>
                          <div className="rounded-xl border border-black/10 bg-white p-3">
                            <div className="flex flex-wrap gap-2">
                              {(Array.isArray(orderAvailableTables) ? orderAvailableTables : []).length === 0 ? (
                                <div className="text-sm text-slate-500">No tables available.</div>
                              ) : (
                                (Array.isArray(orderAvailableTables) ? orderAvailableTables : []).map((t) => {
                                  const selected = (Array.isArray(orderSelectedTables) ? orderSelectedTables : []).includes(t)
                                  return (
                                    <button
                                      key={t}
                                      type="button"
                                      className={
                                        selected
                                          ? 'rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-900'
                                          : 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'
                                      }
                                      onClick={() => {
                                        setOrderSelectedTables((prev) => togglePick(prev, t, Number(orderTablesNeeded) || 1))
                                      }}
                                    >
                                      {t}
                                    </button>
                                  )
                                })
                              )}
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                              Selected {(Array.isArray(orderSelectedTables) ? orderSelectedTables : []).length} / {orderTablesNeeded}
                              {!canOrderTables ? ' (select exact tables)' : ''}
                            </div>
                          </div>
                        </div>
                      ) : null}
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
