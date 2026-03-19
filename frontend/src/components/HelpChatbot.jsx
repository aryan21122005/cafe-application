import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getSession, roleToDashboardPath } from '../lib/auth.js'

function ChatIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  )
}

function XIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  )
}

function ArrowIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M5 12h13" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  )
}

function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function routeContext(pathname) {
  const p = String(pathname || '')
  if (p.startsWith('/dashboard/customer')) return 'customer'
  if (p.startsWith('/dashboard/owner')) return 'owner'
  if (p.startsWith('/dashboard/chef')) return 'chef'
  if (p.startsWith('/dashboard/waiter')) return 'waiter'
  if (p === '/' || p.startsWith('/login') || p.startsWith('/register')) return 'public'
  return 'public'
}

function getQuickActions(ctx, session) {
  const loggedIn = !!session?.username

  const commonPublic = [
    { id: 'how-book', label: 'How to book a table?', type: 'intent', payload: 'how_book' },
    { id: 'how-order', label: 'How to order food?', type: 'intent', payload: 'how_order' },
    { id: 'register', label: 'Register', type: 'nav', payload: '/register' },
    { id: 'login', label: 'Login', type: 'nav', payload: '/login' }
  ]

  const commonLoggedIn = [
    { id: 'go-dashboard', label: 'Go to my dashboard', type: 'nav', payload: roleToDashboardPath(session?.role) },
    { id: 'change-password', label: 'Change password', type: 'nav', payload: '/change-password' }
  ]

  if (ctx === 'public') {
    return loggedIn ? [...commonLoggedIn, ...commonPublic] : commonPublic
  }

  if (ctx === 'customer') {
    return [
      { id: 'cust-orders', label: 'My Orders', type: 'nav', payload: '/dashboard/customer/orders' },
      { id: 'cust-bookings', label: 'My Bookings', type: 'nav', payload: '/dashboard/customer/bookings' },
      { id: 'cust-cart', label: 'Cart', type: 'nav', payload: '/dashboard/customer/cart' },
      { id: 'cust-profile', label: 'Profile help', type: 'intent', payload: 'customer_profile_help' },
      { id: 'order-status', label: 'What do order statuses mean?', type: 'intent', payload: 'order_status_help' }
    ]
  }

  if (ctx === 'owner') {
    return [
      { id: 'owner-add-cafe', label: 'How to add a cafe?', type: 'intent', payload: 'owner_add_cafe_help' },
      { id: 'owner-tables', label: 'How to add tables?', type: 'intent', payload: 'owner_tables_help' },
      { id: 'owner-menu', label: 'How to add menu items?', type: 'intent', payload: 'owner_menu_help' },
      { id: 'owner-staff', label: 'How to add staff?', type: 'intent', payload: 'owner_staff_help' },
      { id: 'owner-bookings', label: 'Bookings help', type: 'intent', payload: 'owner_bookings_help' }
    ]
  }

  if (ctx === 'chef') {
    return [
      { id: 'chef-incoming', label: 'How to update order status?', type: 'intent', payload: 'chef_status_help' },
      { id: 'chef-menu', label: 'Open Menu', type: 'nav', payload: '/dashboard/chef/menu' },
      { id: 'chef-history', label: 'Order history', type: 'intent', payload: 'chef_history_help' }
    ]
  }

  if (ctx === 'waiter') {
    return [
      { id: 'waiter-serve', label: 'How to serve an order?', type: 'intent', payload: 'waiter_serve_help' },
      { id: 'waiter-history', label: 'Order history', type: 'intent', payload: 'waiter_history_help' }
    ]
  }

  return loggedIn ? commonLoggedIn : commonPublic
}

function respondToIntent(intent) {
  switch (intent) {
    case 'how_book':
      return {
        text:
          'To book a table: Login as Customer → Dashboard → Table Bookings. Pick date/time/guests and complete payment (if required). You can track the status (PENDING/APPROVED/DENIED) in the same page.'
      }
    case 'how_order':
      return {
        text:
          'To order food: Login as Customer → Browse Cafes → Open a cafe → Add items to cart → Place order → Pay via Razorpay. After payment you will be redirected to My Orders.'
      }
    case 'order_status_help':
      return {
        text:
          'Order statuses: PLACED (received) → PREPARING (chef started) → READY (ready to serve) → SERVED (delivered to your table).'
      }
    case 'customer_profile_help':
      return {
        text:
          'If checkout/booking fails, make sure your customer profile has your name and phone. Go to Customer Dashboard → Profile Management.'
      }
    case 'owner_add_cafe_help':
      return {
        text:
          'Owner: use the “Add cafe” button in your Owner Dashboard. Complete the 3-step registration and Save. After that you can configure staff, menu, tables/functions, images, bookings and orders.'
      }
    case 'owner_tables_help':
      return {
        text:
          'Owner: open Tables/Functions. Choose function type, enter Tables available, optionally Seats/table, and use Auto-generate to fill table labels (T1, T2...). Then click Save.'
      }
    case 'owner_menu_help':
      return {
        text:
          'Owner: open Menu. Add menu item name/price/category and Save. You can also toggle availability and upload an image for the item.'
      }
    case 'owner_staff_help':
      return {
        text:
          'Owner: open Staff. Add staff with role (CHEF/WAITER) and their details. Once added, they can login and manage orders.'
      }
    case 'owner_bookings_help':
      return {
        text:
          'Owner: open Bookings. Approve or Deny a booking. If denying, add a reason so the customer understands. Deny + Refund can be used if payment was done.'
      }
    case 'chef_status_help':
      return {
        text:
          'Chef: in Orders → Incoming, update status: PLACED → PREPARING → READY. Ready orders will then be visible to the Waiter for serving.'
      }
    case 'chef_history_help':
      return {
        text:
          'Chef: use the History toggle to view previously handled orders (READY/SERVED).'
      }
    case 'waiter_serve_help':
      return {
        text:
          'Waiter: in Orders → Ready, click Serve to mark an order as SERVED. Make sure the booking/table is approved so the table is valid.'
      }
    case 'waiter_history_help':
      return {
        text:
          'Waiter: use the History toggle to see previously served orders.'
      }
    default:
      return { text: 'I can help with bookings, orders, registration and dashboard navigation. Try one of the quick actions below.' }
  }
}

export default function HelpChatbot() {
  const navigate = useNavigate()
  const loc = useLocation()

  const session = getSession()
  const ctx = routeContext(loc.pathname)

  const actions = useMemo(() => getQuickActions(ctx, session), [ctx, session?.username, session?.role])

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(() => {
    try {
      const raw = window.localStorage.getItem('helpChatbotMessages')
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  const listRef = useRef(null)

  useEffect(() => {
    try {
      window.localStorage.setItem('helpChatbotMessages', JSON.stringify(messages.slice(-50)))
    } catch {
      // ignore
    }
  }, [messages])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      const el = listRef.current
      if (!el) return
      el.scrollTop = el.scrollHeight
    }, 0)
    return () => clearTimeout(t)
  }, [open, messages.length])

  useEffect(() => {
    if (!messages || messages.length > 0) return
    const initial = {
      id: String(Date.now()),
      who: 'bot',
      text:
        'Hi! I can guide you through the app. Use the quick buttons below, or type a question like “how to book table” or “my orders”.'
    }
    setMessages([initial])
  }, [])

  function pushUser(text) {
    const t = String(text || '').trim()
    if (!t) return
    setMessages((prev) => [...prev, { id: `${Date.now()}-u`, who: 'user', text: t }])
  }

  function pushBot(text) {
    const t = String(text || '').trim()
    if (!t) return
    setMessages((prev) => [...prev, { id: `${Date.now()}-b`, who: 'bot', text: t }])
  }

  function handleIntent(intent) {
    const r = respondToIntent(intent)
    if (r?.text) pushBot(r.text)
  }

  function handleNav(path) {
    if (!path) return
    pushBot('Opening the page for you…')
    navigate(path)
  }

  function handleSend() {
    const raw = String(input || '').trim()
    if (!raw) return

    pushUser(raw)
    setInput('')

    const q = normalizeText(raw)

    if (q.includes('register')) {
      pushBot('You can register here.')
      navigate('/register')
      return
    }

    if (q.includes('login')) {
      pushBot('You can login here.')
      navigate('/login')
      return
    }

    if ((q.includes('book') && q.includes('table')) || q.includes('booking')) {
      handleIntent('how_book')
      if (ctx === 'customer') {
        pushBot('Opening bookings…')
        navigate('/dashboard/customer/bookings')
      }
      return
    }

    if (q.includes('order') || q.includes('cart') || q.includes('payment')) {
      if (q.includes('status')) {
        handleIntent('order_status_help')
        return
      }
      handleIntent('how_order')
      if (ctx === 'customer') {
        pushBot('Opening My Orders…')
        navigate('/dashboard/customer/orders')
      }
      return
    }

    if (q.includes('add') && q.includes('cafe')) {
      handleIntent('owner_add_cafe_help')
      return
    }

    if (q.includes('table') || q.includes('capacity')) {
      if (ctx === 'owner') {
        handleIntent('owner_tables_help')
        return
      }
    }

    if (q.includes('menu')) {
      if (ctx === 'owner') {
        handleIntent('owner_menu_help')
        return
      }
      if (ctx === 'chef') {
        pushBot('Opening menu…')
        navigate('/dashboard/chef/menu')
        return
      }
    }

    if (q.includes('staff') || q.includes('chef') || q.includes('waiter')) {
      handleIntent('owner_staff_help')
      return
    }

    pushBot('I did not understand that fully. Try one of the quick actions below.')
  }

  return (
    <div className="fixed bottom-5 right-5 z-[9999]">
      {open ? (
        <div className="w-[340px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-3">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Help</div>
              <div className="mt-0.5 text-[11px] font-semibold text-slate-500">
                {ctx === 'public' ? 'General help' : ctx === 'customer' ? 'Customer help' : ctx === 'owner' ? 'Owner help' : ctx === 'chef' ? 'Chef help' : 'Waiter help'}
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg border border-black/10 bg-white px-2 py-2 text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
              aria-label="Close help"
              title="Close"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <div ref={listRef} className="max-h-[320px] overflow-y-auto bg-slate-50 px-3 py-3">
            {messages.map((m) => (
              <div key={m.id} className={m.who === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    m.who === 'user'
                      ? 'mb-2 max-w-[85%] rounded-2xl bg-emerald-600 px-3 py-2 text-sm text-white'
                      : 'mb-2 max-w-[85%] rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-800'
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-black/10 bg-white px-3 py-3">
            <div className="flex flex-wrap gap-2">
              {actions.slice(0, 6).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={() => {
                    if (a.type === 'nav') handleNav(a.payload)
                    else handleIntent(a.payload)
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="Type a question..."
              />
              <button
                type="button"
                className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                onClick={handleSend}
                aria-label="Send"
                title="Send"
              >
                <ArrowIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 text-[11px] text-slate-500">In your service</div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-2 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500"
          onClick={() => setOpen(true)}
          aria-label="Open help"
        >
          <ChatIcon className="h-3 w-3" />
          Help
        </button>
      )}
    </div>
  )
}
