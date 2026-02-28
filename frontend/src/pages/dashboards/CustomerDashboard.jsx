import { Link } from 'react-router-dom'
import { getSession } from '../../lib/auth.js'
import { listPublicCafes } from '../../lib/api.js'
import { useEffect, useMemo, useState } from 'react'

export default function CustomerDashboard() {
  const session = getSession()

  const [cafes, setCafes] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')

  async function refreshCafes() {
    setErr('')
    setLoading(true)
    try {
      const rows = await listPublicCafes()
      setCafes(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setErr(typeof e?.response?.data === 'string' ? e.response.data : 'Failed to load cafes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshCafes()
  }, [])

  const filtered = useMemo(() => {
    const s = String(q || '').trim().toLowerCase()
    if (!s) return cafes
    return cafes.filter((c) => {
      const name = String(c?.cafeName || '').toLowerCase()
      const city = String(c?.city || '').toLowerCase()
      const state = String(c?.state || '').toLowerCase()
      return name.includes(s) || city.includes(s) || state.includes(s)
    })
  }, [cafes, q])

  return (
    <div>
      <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs text-slate-500">Customer / Browse</div>
              <div className="mt-1 text-2xl font-extrabold">Discover cafes near you</div>
              <div className="mt-1 text-xs text-slate-500">Only approved cafes are visible here.</div>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search cafe / city / state"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-500 md:w-80"
              />
              <button
                type="button"
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
                onClick={refreshCafes}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </div>

          {err ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}

          <div className="mt-5">
            {loading ? (
              <div className="text-sm text-slate-600">Loading cafes...</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-slate-600">No cafes found.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <Link
                    key={c.id}
                    to={`/dashboard/customer/cafes/${c.id}`}
                    className="group block overflow-hidden rounded-2xl border border-black/10 bg-white/70 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    <div className="h-36 w-full bg-slate-100">
                      {c.coverImageUrl ? (
                        <img src={c.coverImageUrl} alt={c.cafeName || 'Cafe'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No image</div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700">{c.cafeName || 'Cafe'}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {(c.city || c.state) ? `${c.city || ''}${c.city && c.state ? ', ' : ''}${c.state || ''}` : 'Location not set'}
                      </div>
                      <div className="mt-3 inline-flex rounded-full bg-emerald-600/10 px-2 py-1 text-[11px] font-semibold text-emerald-800">
                        View menu
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
      </div>
    </div>
  )
}
