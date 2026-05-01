import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../lib/api.js'
import { roleToDashboardPath, setSession } from '../lib/auth.js'

function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <div className="text-sm text-slate-700">{label}</div>
      {children}
    </label>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canSubmit = useMemo(() => {
    return username.trim().length >= 3 && password.length >= 1
  }, [username, password])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!canSubmit) {
      setError('Please fill all fields.')
      return
    }

    setLoading(true)
    try {
      const res = await loginUser({ username: username.trim(), password })
      const role = res?.role
      const uname = res?.username || username.trim()
      const forcePasswordChange = !!res?.forcePasswordChange
      setSession({ username: uname, role, forcePasswordChange })
      setSuccess('Login successful')
      setTimeout(() => navigate(forcePasswordChange ? '/change-password' : roleToDashboardPath(role)), 400)
    } catch (err) {
      const apiMsg = err?.response?.data
      setError(typeof apiMsg === 'string' ? apiMsg : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="app-container py-10">
        <Link to="/" className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900">
          Back
        </Link>

        <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-start">
          <div className="hidden md:block">
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-6">
                <div className="text-sm font-semibold text-white/90">Digital Cafe</div>
                <div className="mt-1 text-2xl font-extrabold text-white">Welcome back</div>
                <div className="mt-2 text-sm text-white/90">Sign in to manage orders, menus, and your cafe experience.</div>
              </div>
              <div className="p-6 text-sm text-slate-600">
                Use your username and password to continue.
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Sign in</h2>
            <p className="mt-1 text-sm text-slate-600">Login to your Digital Cafe account.</p>

            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <Field label="Username">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="e.g. aryan"
              autoComplete="username"
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>

          {error ? <div className="rounded-xl border border-red-600/20 bg-red-600/10 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          {success ? <div className="rounded-xl border border-emerald-600/20 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-800">{success}</div> : null}

          <button disabled={loading || !canSubmit} className="btn-primary mt-2 w-full py-3" type="submit">
            {loading ? 'Signing in...' : 'Login'}
          </button>

          <div className="text-sm text-slate-700">
            New here?{' '}
            <Link to="/register" className="font-semibold text-orange-700 hover:text-orange-600">
              Create an account
            </Link>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  )
}
