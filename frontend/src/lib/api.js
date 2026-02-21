import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

export const api = axios.create({
  baseURL
})

export async function registerUser(payload, documents) {
  if (documents && documents.length > 0) {
    const fd = new FormData()
    fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
    for (const file of documents) {
      fd.append('documents', file)
    }

    const res = await api.post('/api/auth/register', fd)
    return res.data
  }

  const res = await api.post('/api/auth/register', payload)
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

export async function listCafes() {
  const res = await api.get('/api/admin/cafes')
  return res.data
}

export async function listOwners() {
  const res = await api.get('/api/admin/owners')
  return res.data
}

export async function createOwner(payload, documents) {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  for (const file of documents || []) {
    fd.append('documents', file)
  }
  const res = await api.post('/api/admin/owners', fd)
  return res.data
}

export async function createCafeForOwner(ownerUsername, payload) {
  const res = await api.post('/api/admin/cafes', payload, {
    headers: {
      'X-OWNER-USERNAME': ownerUsername
    }
  })
  return res.data
}

export async function deleteCafeAdmin(id) {
  const res = await api.delete(`/api/admin/cafes/${id}`)
  return res.data
}

export async function listCafeMenu(cafeId) {
  const res = await api.get(`/api/admin/cafes/${cafeId}/menu`)
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

export async function deleteUser(id) {
  const res = await api.delete(`/api/admin/users/${id}`)
  return res.data
}

export async function changePassword(payload) {
  const res = await api.post('/api/auth/change-password', payload)
  return res.data
}

export async function getOwnerCafe(username) {
  const res = await api.get('/api/owner/cafe', {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function upsertOwnerCafe(username, payload) {
  const res = await api.put('/api/owner/cafe', payload, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function deleteOwnerCafe(username) {
  const res = await api.delete('/api/owner/cafe', {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function listOwnerStaff(username) {
  const res = await api.get('/api/owner/staff', {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function createOwnerStaff(username, payload, documents) {
  if (documents && documents.length > 0) {
    const fd = new FormData()
    fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
    for (const file of documents) {
      fd.append('documents', file)
    }

    const res = await api.post('/api/owner/staff', fd, {
      headers: {
        'X-USERNAME': username,
        'Content-Type': 'multipart/form-data'
      }
    })
    return res.data
  }

  const res = await api.post('/api/owner/staff', payload, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function deleteOwnerStaff(username, id) {
  const res = await api.delete(`/api/owner/staff/${id}`, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function listOwnerMenu(username) {
  const res = await api.get('/api/owner/menu', {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function createOwnerMenuItem(username, payload) {
  const res = await api.post('/api/owner/menu', payload, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function updateOwnerMenuItem(username, id, payload) {
  const res = await api.put(`/api/owner/menu/${id}`, payload, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function deleteOwnerMenuItem(username, id) {
  const res = await api.delete(`/api/owner/menu/${id}`, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function listOwnerCapacities(username) {
  const res = await api.get('/api/owner/capacities', {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function upsertOwnerCapacity(username, payload) {
  const res = await api.post('/api/owner/capacities', payload, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function deleteOwnerCapacity(username, id) {
  const res = await api.delete(`/api/owner/capacities/${id}`, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function listOwnerImages(username) {
  const res = await api.get('/api/owner/images', {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function uploadOwnerImage(username, file, cover) {
  const fd = new FormData()
  fd.append('file', file)
  if (cover != null) {
    fd.append('cover', String(!!cover))
  }

  const res = await api.post('/api/owner/images', fd, {
    headers: {
      'X-USERNAME': username,
      'Content-Type': 'multipart/form-data'
    }
  })
  return res.data
}

export async function deleteOwnerImage(username, id) {
  const res = await api.delete(`/api/owner/images/${id}`, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}
