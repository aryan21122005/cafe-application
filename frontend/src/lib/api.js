import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

export const api = axios.create({
  baseURL
})

export async function registerUser(payload, documents, adminKey) {
  const headers = {}
  if (adminKey) {
    headers['X-ADMIN-KEY'] = adminKey
  }

  if (documents && documents.length > 0) {
    const fd = new FormData()
    fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
    for (const file of documents) {
      fd.append('documents', file)
    }

    const res = await api.post('/api/auth/register', fd, { headers })
    return res.data
  }

  const res = await api.post('/api/auth/register', payload, { headers })
  return res.data
}

export async function loginUser(payload) {
  const res = await api.post('/api/auth/login', payload)
  return res.data
}

export async function listUsers() {
  const res = await api.get('/api/admin/users')
  return res.data
}

export async function getUserDetail(id) {
  const res = await api.get(`/api/admin/users/${id}`)
  return res.data
}

export async function approveUser(id) {
  const res = await api.post(`/api/admin/users/${id}/approve`)
  return res.data
}

export async function denyUser(id, payload) {
  const res = await api.post(`/api/admin/users/${id}/deny`, payload || {})
  return res.data
}

export async function changePassword(payload) {
  const res = await api.post('/api/auth/change-password', payload)
  return res.data
}
