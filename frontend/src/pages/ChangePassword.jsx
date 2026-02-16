import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { changePassword } from '../lib/api.js'
import { getSession, roleToDashboardPath, setSession } from '../lib/auth.js'

function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <div className="text-sm text-slate-700">{label}</div>
      {children}
    </label>
  )
}

export default function ChangePassword() {
  const navigate = useNavigate()
  const session = getSession()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canSubmit = useMemo(() => {
    return oldPassword.length >= 1 && newPassword.length >= 4
  }, [oldPassword, newPassword])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!session?.username) {
      setError('Please login again.')
      return
    }

    if (!canSubmit) {
      setError('Please fill all fields.')
      return
    }

    setLoading(true)
    try {
      const msg = await changePassword({
        username: session.username,
        oldPassword,
        newPassword
      })

      setSession({ ...session, forcePasswordChange: false })
      setSuccess(typeof msg === 'string' ? msg : 'Password changed')
      setTimeout(() => navigate(roleToDashboardPath(session.role)), 500)
    } catch (err) {
      const apiMsg = err?.response?.data
      setError(typeof apiMsg === 'string' ? apiMsg : 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#EDE4DA] text-slate-900">
      <div className="mx-auto max-w-md px-6 py-12">
        <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900">
          Back
        </Link>

        <h2 className="mt-4 text-3xl font-extrabold text-slate-900">Change password</h2>
        <p className="mt-2 text-sm text-slate-600">You must change your password before continuing.</p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-4 rounded-2xl border border-black/10 bg-white/70 p-6">
          <Field label="Current (temporary) password">
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>

          <Field label="New password">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
              placeholder="Minimum 4 characters"
              autoComplete="new-password"
            />
          </Field>

          {error ? (
            <div className="rounded-xl border border-red-600/20 bg-red-600/10 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}
          {success ? (
            <div className="rounded-xl border border-emerald-600/20 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-800">
              {success}
            </div>
          ) : null}

          <button
            disabled={loading || !canSubmit}
            className="mt-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
          >
            {loading ? 'Saving...' : 'Save new password'}
          </button>
        </form>
      </div>
    </div>
  )
}
