import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from "/favicon.png";


function Feature({ title, desc, tone = 'dark' }) {
  const isLight = tone === 'light'
  return (
    <div
      className={
        isLight
          ? 'rounded-2xl border border-white/10 bg-white/5 p-5'
          : 'rounded-2xl border border-black/10 bg-white/70 p-5'
      }
    >
      <div className={isLight ? 'text-dg font-semibold text-white' : 'text-lg font-semibold text-slate-900'}>
        {title}
      </div>
      <div className={isLight ? 'mt-2 text-sm text-gray-300' : 'mt-2 text-sm text-slate-600'}>{desc}</div>
    </div>
  )
}

function SectionTitle({ eyebrow, title, desc, tone = 'dark' }) {
  const isLight = tone === 'light'
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <div
          className={
            isLight
              ? 'inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200'
              : 'inline-flex items-center rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs text-slate-700'
          }
        >
          {eyebrow}
        </div>
      ) : null}
      <h2 className={isLight ? 'mt-4 text-3xl font-extrabold text-white sm:text-4xl' : 'mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl'}>
        {title}
      </h2>
      {desc ? (
        <p className={isLight ? 'mt-3 text-sm text-gray-300 sm:text-base' : 'mt-3 text-sm text-slate-600 sm:text-base'}>
          {desc}
        </p>
      ) : null}
    </div>
  )
}

function Stat({ value, label, tone = 'light' }) {
  const isLight = tone === 'light'
  return (
    <div
      className={
        isLight
          ? 'rounded-2xl border border-white/10 bg-white/5 p-5 text-center'
          : 'rounded-2xl border border-black/10 bg-white/70 p-5 text-center'
      }
    >
      <div className={isLight ? 'text-3xl font-extrabold text-white' : 'text-3xl font-extrabold text-slate-900'}>{value}</div>
      <div className={isLight ? 'mt-1 text-sm text-gray-300' : 'mt-1 text-sm text-slate-600'}>{label}</div>
    </div>
  )
}

function Step({ n, title, desc }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/15 text-sm font-bold text-emerald-700">
          {n}
        </div>
        <div className="text-base font-semibold text-slate-900">{title}</div>
      </div>
      <div className="mt-2 text-sm text-slate-600">{desc}</div>
    </div>
  )
}

function FaqItem({ q, a, open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full rounded-2xl border border-black/10 bg-white/70 p-5 text-left hover:bg-white"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-base font-semibold text-slate-900">{q}</div>
          {open ? <div className="mt-2 text-sm text-slate-600">{a}</div> : null}
        </div>
        <div className="mt-0.5 text-slate-500">{open ? '−' : '+'}</div>
      </div>
    </button>
  )
}

export default function Landing() {
  const faqs = useMemo(
    () => [
      {
        q: 'Is this app for customers or cafe owners?',
        a: 'Both. Customers can browse and place orders, while cafe teams manage orders, kitchen tickets, and daily operations.'
      },
      {
        q: 'What roles are supported?',
        a: 'ADMIN, OWNER, CHEF, WAITER, and CUSTOMER. Each role can have its own screens and permissions as you expand the app.'
      },
      {
        q: 'Do I need to install anything as a customer?',
        a: 'No. Customers can use it directly from the web. You can later add PWA/mobile if needed.'
      },
      {
        q: 'Can I run it for one cafe only?',
        a: 'Yes. Start with a single cafe, then later you can extend it to multi-branch if you want.'
      }
    ],
    []
  )

  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="min-h-screen bg-[#EDE4DA]">
      <div
        className="relative border-b border-black/10"
        style={{
          backgroundImage: 'url(/landing-bg.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '700px'
        }}
      >
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 h-full">
          <div className="h-full bg-gradient-to-b from-emerald-500/15 via-transparent to-transparent">
            <div className="mx-auto flex h-full max-w-6xl flex-col px-6 py-10">
              <div className="flex items-center justify-between">

                <img src={logo} alt="Digital Cafe" className="h-20 w-20" />
                {/* <div className="text-white text-xl font-bold">Digital Cafe</div> */}
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
                  >
                    Register
                  </Link>
                </div>
              </div>

              <div className="mt-14 grid flex-1 gap-10 pb-10 lg:grid-cols-2 lg:items-center">
                <div>
                  <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-gray-100">
                    For customers · For cafe teams · One platform
                  </div>
                  <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-6xl">
                    Order faster.
                    <span className="block text-emerald-300">Serve smarter.</span>
                  </h1>
                  <p className="mt-4 max-w-xl text-gray-100">
                    Customers get a clean ordering experience. Cafe owners and staff get real-time orders,
                    kitchen tickets, and a smooth workflow for daily operations.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      to="/register"
                      className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
                    >
                      Get started
                    </Link>
                    <Link
                      to="/login"
                      className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15"
                    >
                      I already have an account
                    </Link>
                  </div>
                  <div className="mt-8 grid grid-cols-3 gap-3">
                    <Stat value="2x" label="Faster ordering" tone="light" />
                    <Stat value="Early" label="Booking" tone="light" />
                    <Stat value="Fast" label="Access" tone="light" />
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/15 to-white/5 p-6 backdrop-blur">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Feature tone="light" title="For customers" desc="Browse, order, and track your order in a smooth flow." />
                    <Feature tone="light" title="For cafe owners" desc="Manage orders, tables, and staff operations in real time." />
                    <Feature tone="light" title="For kitchen & staff" desc="Clear tickets, status updates, and faster handoffs." />
                    <Feature tone="light" title="Connected" desc="From Table to Kitchen" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-14">
        <SectionTitle
          tone="dark"
          eyebrow="How it works"
          title="A simple flow for both sides"
          desc="Customers place orders quickly, and your cafe team processes them with clarity."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Step n="01" title="Customer orders" desc="Pick items, place an order, and stay updated." />
          <Step n="02" title="Cafe confirms" desc="Owners and staff view new orders instantly." />
          <Step n="03" title="Kitchen prepares" desc="Tickets move from pending to ready smoothly." />
        </div>
      </div>

      <div className="border-y border-black/10 bg-white/30">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <SectionTitle
            tone="dark"
            eyebrow="Built for owners"
            title="Control operations without the chaos"
            desc="Everything your cafe needs to keep service smooth and predictable."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Feature title="Order dashboard" desc="See new and active orders in one place." />
            <Feature title="Staff roles" desc="Give access to owners, chefs, and waiters." />
            <Feature title="Faster handoffs" desc="Reduce mistakes with clear status updates." />
            <Feature title="Peak-hour ready" desc="Handle busy periods with a consistent workflow." />
            <Feature title="Simple setup" desc="Register, login, and start using it." />
            <Feature title="Expandable" desc="Add payments, menus, tables, and more anytime." />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-14">
        <SectionTitle
          tone="dark"
          eyebrow="Built for customers"
          title="A better way to order"
          desc="Less waiting, fewer mistakes, and a cleaner experience from start to finish."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Feature title="Quick onboarding" desc="Create an account in seconds and start ordering." />
          <Feature title="Fewer errors" desc="Clear order details reduce confusion at checkout." />
          <Feature title="Order tracking" desc="Know what’s happening with your order." />
        </div>
      </div>

      <div className="border-t border-black/10 bg-gradient-to-b from-white/30 to-transparent">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <SectionTitle
            tone="dark"
            eyebrow="FAQ"
            title="Questions"
            desc="Tap a question to expand the answer."
          />
          <div className="mt-10 grid gap-3">
            {faqs.map((f, idx) => (
              <FaqItem
                key={f.q}
                q={f.q}
                a={f.a}
                open={openFaq === idx}
                onToggle={() => setOpenFaq((v) => (v === idx ? -1 : idx))}
              />
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-black/10 bg-white/70 p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="text-2xl font-extrabold text-slate-900">Ready to try Digital Cafe?</div>
                <div className="mt-2 text-sm text-slate-600">
                  Create an account as a customer or a cafe team member and start exploring.
                </div>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  to="/register"
                  className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-black/10 bg-white/30">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-700">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <div className="text-base font-semibold text-slate-900">Digital Cafe</div>
              <div className="text-slate-600">
                A single platform for customers to order and for cafes to run operations.
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-base font-semibold text-slate-900">Quick links</div>
              <div className="grid gap-2">
                <Link to="/" className="text-slate-600 hover:text-slate-900">Home</Link>
                <Link to="/register" className="text-slate-600 hover:text-slate-900">Register</Link>
                <Link to="/login" className="text-slate-600 hover:text-slate-900">Login</Link>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-base font-semibold text-slate-900">Contact</div>
              <div className="grid gap-2 text-slate-600">
                <div>Email: support@digitalcafe.local</div>
                <div>Phone: +91 00000 00000</div>
                <div>Hours: 9:00 AM - 11:00 PM</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-base font-semibold text-slate-900">Social</div>
              <div className="grid gap-2">
                <a href="#" className="text-slate-600 hover:text-slate-900">Instagram</a>
                <a href="#" className="text-slate-600 hover:text-slate-900">Facebook</a>
                <a href="#" className="text-slate-600 hover:text-slate-900">X (Twitter)</a>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-black/10 pt-6 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Digital Cafe. All rights reserved.</div>
            <div className="text-slate-500">Built for your cafe operations</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
