import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clearSession, getSession } from '../../lib/auth.js'
import { approveUser, denyUser, getUserDetail, listUsers } from '../../lib/api.js'

const SECTIONS = {
  overview: 'Overview',
  cafes: 'Cafe Management',
  users: 'User Management',
  orders: 'Order Monitoring',
  revenue: 'Revenue Control',
  analytics: 'Analytics',
  notifications: 'Notifications',
  complaints: 'Complaints / Reports',
  settings: 'System Settings'
}

export default function AdminDashboard() {
  const session = getSession()
  const [section, setSection] = useState('overview')

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionBusyId, setActionBusyId] = useState(null)

  const [q, setQ] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const [selectedUserId, setSelectedUserId] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const data = await listUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(typeof e?.response?.data === 'string' ? e.response.data : 'Failed to load users')
    } finally {
      setLoading(false)
    }

  }

  async function openUserDetail(id) {
    setSelectedUserId(id)
    setSelectedUser(null)
    setDetailError('')
    setDetailLoading(true)
    try {
      const data = await getUserDetail(id)
      setSelectedUser(data)
    } catch (e) {
      setDetailError(typeof e?.response?.data === 'string' ? e.response.data : 'Failed to load user details')
    } finally {
      setDetailLoading(false)
    }
  }

  function closeUserDetail() {
    setSelectedUserId(null)
    setSelectedUser(null)
    setDetailError('')
    setDetailLoading(false)
  }

  useEffect(() => {
    let ignore = false
    ;(async () => {
      if (ignore) return
      await refresh()
    })()
    return () => {
      ignore = true
    }
  }, [])

  async function onApprove(id) {
    setActionBusyId(id)
    setError('')
    try {
      await approveUser(id)
      await refresh()
    } catch (e) {
      setError(typeof e?.response?.data === 'string' ? e.response.data : 'Failed to approve user')
    } finally {
      setActionBusyId(null)
    }
  }

  async function onDeny(id) {
    const reason = window.prompt('Reason for denial (optional):') || ''
    setActionBusyId(id)
    setError('')
    try {
      await denyUser(id, { reason })
      await refresh()
    } catch (e) {
      setError(typeof e?.response?.data === 'string' ? e.response.data : 'Failed to deny user')
    } finally {
      setActionBusyId(null)
    }
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return users
    return users.filter((u) => {
      const username = String(u.username || '').toLowerCase()
      const role = String(u.role || '').toLowerCase()
      const email = String(u.email || '').toLowerCase()
      const status = String(u.approvalStatus || 'PENDING').toLowerCase()
      return username.includes(query) || role.includes(query) || email.includes(query) || status.includes(query)
    })
  }, [users, q])

  const counts = useMemo(() => {
    const total = users.length
    const pending = users.filter((u) => String(u.approvalStatus || 'PENDING').toUpperCase() === 'PENDING').length
    const approved = users.filter((u) => String(u.approvalStatus || '').toUpperCase() === 'APPROVED').length
    const denied = users.filter((u) => String(u.approvalStatus || '').toUpperCase() === 'DENIED').length
    return { total, pending, approved, denied }
  }, [users])

  const roleCounts = useMemo(() => {
    const map = new Map()
    for (const u of users) {
      const key = String(u.role || 'UNKNOWN').toUpperCase()
      map.set(key, (map.get(key) || 0) + 1)
    }
    const entries = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([role, count]) => ({ role, count }))
    return entries
  }, [users])

  function downloadCsv(filename, rows) {
    const esc = (v) => {
      const s = v == null ? '' : String(v)
      return '"' + s.replaceAll('"', '""') + '"'
    }
    const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function PieChart({ data, size = 180 }) {
    const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
    const r = size / 2
    const cx = r
    const cy = r
    const stroke = 22
    let acc = 0

    const arcs = total === 0
      ? []
      : data.map((d) => {
          const value = Number(d.value) || 0
          const start = (acc / total) * Math.PI * 2
          acc += value
          const end = (acc / total) * Math.PI * 2

          const x1 = cx + r * Math.cos(start)
          const y1 = cy + r * Math.sin(start)
          const x2 = cx + r * Math.cos(end)
          const y2 = cy + r * Math.sin(end)
          const large = end - start > Math.PI ? 1 : 0
          const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
          return { path, color: d.color, label: d.label, value }
        })

    return (
      <div className="flex flex-col items-center gap-3">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
          {arcs.map((a, idx) => (
            <path key={idx} d={a.path} fill="none" stroke={a.color} strokeWidth={stroke} strokeLinecap="butt" />
          ))}
          <circle cx={cx} cy={cy} r={r - stroke} fill="white" />
          <text x={cx} y={cy - 2} textAnchor="middle" className="fill-slate-900" style={{ fontSize: 18, fontWeight: 800 }}>
            {total}
          </text>
          <text x={cx} y={cy + 18} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 11, fontWeight: 600 }}>
            TOTAL
          </text>
        </svg>

        <div className="grid w-full gap-2 text-sm">
          {data.map((d) => (
            <div key={d.label} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-700">{d.label}</span>
              </div>
              <div className="font-semibold text-slate-900">{d.value}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function BarChart({ data }) {
    const max = Math.max(1, ...data.map((d) => Number(d.count) || 0))
    return (
      <div className="grid gap-3">
        {data.map((d) => (
          <div key={d.role} className="grid gap-1">
            <div className="flex items-center justify-between text-sm">
              <div className="font-semibold text-slate-700">{d.role}</div>
              <div className="text-slate-900">{d.count}</div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${Math.round(((Number(d.count) || 0) / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const sliceStart = (safePage - 1) * pageSize
  const pageRows = filtered.slice(sliceStart, sliceStart + pageSize)

  useEffect(() => {
    setPage(1)
  }, [q, pageSize])

  const revenuePlaceholder = useMemo(() => {
    return {
      totalRevenue: 0,
      commissionEarned: 0,
      activeCafesToday: 0
    }
  }, [])

  const cafePlaceholderRows = useMemo(() => {
    return []
  }, [])

  const orderPlaceholderRows = useMemo(() => {
    return []
  }, [])

  function SectionTitle({ breadcrumb, title, subtitle }) {
    return (
      <div>
        <div className="text-xs text-slate-500">{breadcrumb}</div>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">{title}</h1>
        {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
      </div>
    )
  }

  function Card({ label, value }) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-xs font-semibold text-slate-500">{label}</div>
        <div className="mt-2 text-3xl font-extrabold">{value}</div>
      </div>
    )
  }

  const menu = [
    { key: 'overview', label: SECTIONS.overview },
    { key: 'cafes', label: SECTIONS.cafes },
    { key: 'users', label: SECTIONS.users },
    { key: 'orders', label: SECTIONS.orders },
    { key: 'revenue', label: SECTIONS.revenue },
    { key: 'analytics', label: SECTIONS.analytics },
    { key: 'notifications', label: SECTIONS.notifications },
    { key: 'complaints', label: SECTIONS.complaints },
    { key: 'settings', label: SECTIONS.settings }
  ]

  function SidebarButton({ item }) {
    const active = section === item.key
    return (
      <button
        type="button"
        onClick={() => setSection(item.key)}
        className={
          active
            ? 'rounded-lg bg-emerald-500/15 px-3 py-2 text-left text-sm font-semibold text-emerald-200'
            : 'rounded-lg px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10'
        }
      >
        {item.label}
      </button>
    )
  }

  function OverviewSection() {
    const approvalData = [
      { label: 'Approved', value: counts.approved, color: '#16a34a' },
      { label: 'Pending', value: counts.pending, color: '#f59e0b' },
      { label: 'Denied', value: counts.denied, color: '#ef4444' }
    ]

    return (
      <>
        <div className="flex items-center justify-between">
          <SectionTitle
            breadcrumb="Dashboard / Overview"
            title="Dashboard Overview"
            subtitle="Platform status and key metrics"
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
              onClick={() => refresh()}
            >
              Refresh
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
              onClick={() => {
                setSection('users')
                setQ('pending')
              }}
            >
              View pending
            </button>
            <button
              type="button"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              onClick={() => {
                const header = ['id', 'username', 'role', 'status', 'email', 'phone']
                const rows = users.map((u) => [
                  u.id,
                  u.username,
                  u.role,
                  u.approvalStatus || 'PENDING',
                  u.email || '',
                  u.phone || ''
                ])
                downloadCsv('users.csv', [header, ...rows])
              }}
            >
              Export users
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card label="TOTAL CAFES REGISTERED" value={0} />
          <Card label="TOTAL USERS" value={counts.total} />
          <Card label="PENDING APPROVALS" value={counts.pending} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card label="TOTAL REVENUE" value={revenuePlaceholder.totalRevenue} />
          <Card label="ACTIVE CAFES TODAY" value={revenuePlaceholder.activeCafesToday} />
          <Card label="COMMISSION EARNED" value={revenuePlaceholder.commissionEarned} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Approval status</div>
                <div className="mt-1 text-xs text-slate-500">Breakdown of approved vs pending vs denied users</div>
              </div>
              <div className="text-xs text-slate-500">{new Date().toLocaleDateString()}</div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 md:items-center">
              <PieChart data={approvalData} size={190} />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold">Quick insights</div>
                <div className="mt-2 grid gap-2 text-sm text-slate-700">
                  <div>
                    <span className="text-slate-500">Approval rate:</span>{' '}
                    <span className="font-semibold">
                      {counts.total === 0 ? '0%' : `${Math.round((counts.approved / counts.total) * 100)}%`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Pending load:</span>{' '}
                    <span className="font-semibold">
                      {counts.total === 0 ? '0%' : `${Math.round((counts.pending / counts.total) * 100)}%`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Tip: Use “View pending” to quickly approve/deny new users.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold">Users by role</div>
            <div className="mt-1 text-xs text-slate-500">Distribution of roles across the platform</div>
            <div className="mt-4">
              {roleCounts.length > 0 ? <BarChart data={roleCounts} /> : <div className="text-sm text-slate-600">No users yet.</div>}
            </div>
          </div>
        </div>
      </>
    )
  }

  function CafeManagementSection() {
    return (
      <>
        <SectionTitle
          breadcrumb="Dashboard / Cafe Management"
          title="Cafe Management"
          subtitle="Approve, reject, suspend, activate and review performance"
        />

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold">Cafes</div>
              <div className="mt-1 text-xs text-slate-500">View all cafes and manage registrations</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
                View all cafes
              </button>
              <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
                Approve new cafes
              </button>
              <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
                Suspended cafes
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Cafe</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Revenue</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cafePlaceholderRows.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-slate-500" colSpan={6}>
                      No cafes available yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )
  }

  function UserManagementSection() {
    return (
      <>
        <SectionTitle breadcrumb="Dashboard / User Management" title="User Management" subtitle="Approve registrations and manage users" />

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card label="TOTAL USERS" value={counts.total} />
          <Card label="PENDING APPROVAL" value={counts.pending} />
          <Card label="APPROVED" value={counts.approved} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card label="DENIED" value={counts.denied} />
          <Card label="ADMINS" value={users.filter((u) => String(u.role || '').toUpperCase() === 'ADMIN').length} />
          <Card label="OWNERS" value={users.filter((u) => String(u.role || '').toUpperCase() === 'OWNER').length} />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold">Users</div>
              <div className="mt-1 text-xs text-slate-500">User list with documents and approval actions</div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value) || 10)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Search:</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  placeholder="username / role / email / status"
                />
              </div>
            </div>
          </div>

          {error ? <div className="p-5 text-sm text-red-600">{error}</div> : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Documents</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td className="px-5 py-6 text-slate-500" colSpan={8}>
                      Loading...
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-slate-500" colSpan={8}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-700">{u.id}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        <button
                          type="button"
                          onClick={() => openUserDetail(u.id)}
                          className="text-left text-emerald-700 hover:underline"
                        >
                          {u.username}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={
                            String(u.approvalStatus || 'PENDING').toUpperCase() === 'APPROVED'
                              ? 'rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700'
                              : String(u.approvalStatus || 'PENDING').toUpperCase() === 'DENIED'
                                ? 'rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-700'
                                : 'rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700'
                          }
                        >
                          {u.approvalStatus || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{u.email || '-'}</td>
                      <td className="px-5 py-3 text-slate-700">{u.phone || '-'}</td>
                      <td className="px-5 py-3 text-slate-700">
                        {Array.isArray(u.documents) && u.documents.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {u.documents.map((d) => (
                              <a
                                key={d.id}
                                className="text-emerald-700 hover:underline"
                                href={`/api/admin/documents/${d.id}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {d.documentName || `Document ${d.id}`}
                              </a>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {String(u.approvalStatus || 'PENDING').toUpperCase() === 'PENDING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                              disabled={actionBusyId === u.id}
                              onClick={() => onApprove(u.id)}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              disabled={actionBusyId === u.id}
                              onClick={() => onDeny(u.id)}
                            >
                              Deny
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-600">
              Showing {filtered.length === 0 ? 0 : sliceStart + 1} to {Math.min(sliceStart + pageSize, filtered.length)} of {filtered.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">{safePage}</div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  function OrderMonitoringSection() {
    return (
      <>
        <SectionTitle breadcrumb="Dashboard / Order Monitoring" title="Order Monitoring" subtitle="View and filter orders across cafes" />
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold">Orders</div>
              <div className="mt-1 text-xs text-slate-500">Filter by cafe and date</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
                View all
              </button>
              <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
                Filter
              </button>
              <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Cafe</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orderPlaceholderRows.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-slate-500" colSpan={6}>
                      No orders available yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )
  }

  function RevenueControlSection() {
    return (
      <>
        <SectionTitle breadcrumb="Dashboard / Revenue Control" title="Revenue Control" subtitle="Platform earnings and commissions" />

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card label="TOTAL REVENUE" value={revenuePlaceholder.totalRevenue} />
          <Card label="COMMISSION EARNED" value={revenuePlaceholder.commissionEarned} />
          <Card label="TOP CAFES BY SALES" value={0} />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold">Revenue details</div>
          <div className="mt-2 h-64 rounded-xl border border-dashed border-slate-200 bg-slate-50" />
        </div>
      </>
    )
  }

  function AnalyticsSection() {
    return (
      <>
        <SectionTitle breadcrumb="Dashboard / Analytics" title="Analytics" subtitle="Top cafes, popular items, busy hours and sales insights" />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold">Top performing cafes</div>
            <div className="mt-2 h-56 rounded-xl border border-dashed border-slate-200 bg-slate-50" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold">Most ordered items</div>
            <div className="mt-2 h-56 rounded-xl border border-dashed border-slate-200 bg-slate-50" />
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold">Busy hours</div>
            <div className="mt-2 h-56 rounded-xl border border-dashed border-slate-200 bg-slate-50" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold">City-wise sales</div>
            <div className="mt-2 h-56 rounded-xl border border-dashed border-slate-200 bg-slate-50" />
          </div>
        </div>
      </>
    )
  }

  function NotificationsSection() {
    return (
      <>
        <SectionTitle breadcrumb="Dashboard / Notifications" title="Notifications" subtitle="Send announcements and alerts" />

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-semibold">Create notification</div>
              <div className="mt-3 grid gap-3">
                <input className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Title" />
                <textarea className="min-h-32 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Message" />
                <select className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <option>All users</option>
                  <option>All cafes</option>
                  <option>Specific cafe</option>
                </select>
                <button type="button" className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500">
                  Send
                </button>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold">Recent notifications</div>
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No notifications yet.
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  function ComplaintsSection() {
    return (
      <>
        <SectionTitle breadcrumb="Dashboard / Complaints" title="Complaints / Reports" subtitle="Handle complaints, refunds and violations" />
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold">Reports</div>
          <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No reports available yet.
          </div>
        </div>
      </>
    )
  }

  function SettingsSection() {
    return (
      <>
        <SectionTitle breadcrumb="Dashboard / Settings" title="System Settings" subtitle="Commission, email and security rules" />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold">Commission %</div>
            <div className="mt-3 flex items-center gap-3">
              <input className="w-32 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="0" />
              <button type="button" className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500">
                Save
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold">Security rules</div>
            <div className="mt-3 grid gap-3">
              <select className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option>Default</option>
              </select>
              <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                Manage role permissions
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-slate-900 text-white md:flex">
          <div className="bg-emerald-600 px-5 py-4 text-lg font-extrabold">Digital Cafe Admin</div>
          <div className="px-5 py-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10" />
              <div>
                <div className="text-sm font-semibold">{session?.username || 'Admin'}</div>
                <div className="text-xs text-white/60">Administrator</div>
              </div>
            </div>
          </div>

          <div className="px-4">
            <div className="mb-2 text-xs font-semibold text-white/50">Navigation</div>
            <div className="grid gap-1">
              {menu.map((item) => (
                <SidebarButton key={item.key} item={item} />
              ))}
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
              <div className="flex flex-1 items-center gap-3">
                <div className="hidden text-sm font-semibold text-slate-700 md:block">{SECTIONS[section]}</div>
                <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <span className="mr-2 text-slate-400">Search...</span>
                  <div className="flex-1" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm" to="/">
                  Home
                </Link>
                <button
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                  onClick={() => {
                    clearSession()
                    window.location.href = '/login'
                  }}
                  type="button"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
            {section === 'overview' ? <OverviewSection /> : null}
            {section === 'cafes' ? <CafeManagementSection /> : null}
            {section === 'users' ? <UserManagementSection /> : null}
            {section === 'orders' ? <OrderMonitoringSection /> : null}
            {section === 'revenue' ? <RevenueControlSection /> : null}
            {section === 'analytics' ? <AnalyticsSection /> : null}
            {section === 'notifications' ? <NotificationsSection /> : null}
            {section === 'complaints' ? <ComplaintsSection /> : null}
            {section === 'settings' ? <SettingsSection /> : null}
          </main>

          {selectedUserId != null ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={closeUserDetail}>
              <div
                className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-6"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-500">User details</div>
                    <div className="mt-1 text-xl font-extrabold text-slate-900">{selectedUser?.username || 'Loading...'}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {selectedUser?.role ? `Role: ${selectedUser.role}` : ''}
                      {selectedUser?.approvalStatus ? ` • Status: ${selectedUser.approvalStatus}` : ''}
                    </div>
                  </div>
                  <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onClick={closeUserDetail}>
                    Close
                  </button>
                </div>

                {detailError ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{detailError}</div> : null}
                {detailLoading ? <div className="mt-4 text-sm text-slate-600">Loading details...</div> : null}

                {selectedUser && !detailLoading ? (
                  <div className="mt-5 grid gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold">Personal details</div>
                      <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                        <div><span className="text-slate-500">First name:</span> {selectedUser.personalDetails?.firstName || '-'}</div>
                        <div><span className="text-slate-500">Last name:</span> {selectedUser.personalDetails?.lastName || '-'}</div>
                        <div><span className="text-slate-500">Email:</span> {selectedUser.personalDetails?.email || '-'}</div>
                        <div><span className="text-slate-500">Phone:</span> {selectedUser.personalDetails?.phone || '-'}</div>
                        <div><span className="text-slate-500">Contact no:</span> {selectedUser.personalDetails?.contactNo || '-'}</div>
                        <div><span className="text-slate-500">Gender:</span> {selectedUser.personalDetails?.gender || '-'}</div>
                        <div><span className="text-slate-500">Marital status:</span> {selectedUser.personalDetails?.maritalStatus || '-'}</div>
                        <div><span className="text-slate-500">Force password change:</span> {String(!!selectedUser.forcePasswordChange)}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold">Address</div>
                      <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                        <div><span className="text-slate-500">Street:</span> {selectedUser.address?.street || '-'}</div>
                        <div><span className="text-slate-500">City:</span> {selectedUser.address?.city || '-'}</div>
                        <div><span className="text-slate-500">State:</span> {selectedUser.address?.state || '-'}</div>
                        <div><span className="text-slate-500">Pincode:</span> {selectedUser.address?.pincode || '-'}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold">Academic info</div>
                      {Array.isArray(selectedUser.academicInfoList) && selectedUser.academicInfoList.length > 0 ? (
                        <div className="mt-2 grid gap-3">
                          {selectedUser.academicInfoList.map((a) => (
                            <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                              <div className="font-semibold text-slate-900">{a.institutionName || '-'} {a.degree ? `• ${a.degree}` : ''}</div>
                              <div className="mt-1 text-slate-600">Passing year: {a.passingYear || '-'} • Grade: {a.grade || '-'} • %: {a.gradeInPercentage ?? '-'}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-slate-600">No academic info.</div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold">Work experience</div>
                      {Array.isArray(selectedUser.workExperienceList) && selectedUser.workExperienceList.length > 0 ? (
                        <div className="mt-2 grid gap-3">
                          {selectedUser.workExperienceList.map((w) => (
                            <div key={w.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                              <div className="font-semibold text-slate-900">{w.companyName || '-'} {w.designation ? `• ${w.designation}` : ''}</div>
                              <div className="mt-1 text-slate-600">{w.startDate || '-'} to {w.endDate || '-'} • Current: {String(!!w.currentlyWorking)} • CTC: {w.ctc ?? '-'}</div>
                              {w.reasonForLeaving ? <div className="mt-1 text-slate-600">Reason: {w.reasonForLeaving}</div> : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-slate-600">No work experience.</div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold">Documents</div>
                      {Array.isArray(selectedUser.documents) && selectedUser.documents.length > 0 ? (
                        <div className="mt-2 flex flex-col gap-2">
                          {selectedUser.documents.map((d) => (
                            <a
                              key={d.id}
                              className="text-sm font-semibold text-emerald-700 hover:underline"
                              href={`/api/admin/documents/${d.id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {d.documentName || `Document ${d.id}`}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-slate-600">No documents.</div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
