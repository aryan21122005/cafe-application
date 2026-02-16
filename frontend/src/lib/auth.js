const KEY = 'cafe_session'

export function setSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session))
}

export function getSession() {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(KEY)
}

export function roleToDashboardPath(role) {
  const r = String(role || '').toUpperCase()
  if (r === 'ADMIN') return '/dashboard/admin'
  if (r === 'OWNER') return '/dashboard/owner'
  if (r === 'CHEF') return '/dashboard/chef'
  if (r === 'WAITER') return '/dashboard/waiter'
  return '/dashboard/customer'
}
