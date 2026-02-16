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
    <div className="min-h-screen bg-[#EDE4DA] text-slate-900">
      <div className="mx-auto max-w-md px-6 py-12">
        <Link to="/" className="text-sm text-slate-600 hover:text-slate-900">
          Back
        </Link>

        <h2 className="mt-4 text-3xl font-extrabold text-slate-900">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-600">Login to your Digital Cafe account.</p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-4 rounded-2xl border border-black/10 bg-white/70 p-6">
          <Field label="Username">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
              placeholder="e.g. aryan"
              autoComplete="username"
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>

          {error ? <div className="rounded-xl border border-red-600/20 bg-red-600/10 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          {success ? <div className="rounded-xl border border-emerald-600/20 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-800">{success}</div> : null}

          <button
            disabled={loading || !canSubmit}
            className="mt-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>

          <div className="text-sm text-slate-700">
            New here?{' '}
            <Link to="/register" className="text-emerald-700 hover:text-emerald-600">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
