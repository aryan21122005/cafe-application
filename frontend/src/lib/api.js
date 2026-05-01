import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://cafe-app-backend-guv2.onrender.com'

export const api = axios.create({
  baseURL
})

function ownerHeaders(username, cafeId) {
  const h = {
    'X-USERNAME': username
  }
  if (cafeId != null && cafeId !== '') {
    h['X-CAFE-ID'] = String(cafeId)
  }
  return h
}

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

export async function listStaffMenu(username) {
  const res = await api.get('/api/staff/menu', {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function updateStaffMenuAvailability(username, menuItemId, available) {
  const res = await api.put(
    `/api/staff/menu/${menuItemId}/availability`,
    { available },
    {
      headers: {
        'X-USERNAME': username
      }
    }
  )
  return res.data
}

export async function loginUser(payload) {
  try {
    const res = await api.post('/api/auth/login', payload)
    return res.data
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message)
    throw error
  }
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

export async function createCafeForOwnerWithDocuments(ownerUsername, payload, docKeys, documents) {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  for (const k of docKeys || []) {
    fd.append('docKeys', k)
  }
  for (const f of documents || []) {
    fd.append('documents', f)
  }
  const res = await api.post('/api/admin/cafes', fd, {
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

export async function createCafeMenuItemAdmin(cafeId, payload) {
  const res = await api.post(`/api/admin/cafes/${cafeId}/menu`, payload)
  return res.data
}

export async function updateCafeMenuItemAdmin(cafeId, menuItemId, payload) {
  const res = await api.put(`/api/admin/cafes/${cafeId}/menu/${menuItemId}`, payload)
  return res.data
}

export async function updateCafeMenuAvailabilityAdmin(cafeId, menuItemId, available) {
  const res = await api.put(`/api/admin/cafes/${cafeId}/menu/${menuItemId}/availability`, {
    available
  })
  return res.data
}

export async function uploadCafeMenuItemImageAdmin(cafeId, menuItemId, file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await api.post(`/api/admin/cafes/${cafeId}/menu/${menuItemId}/image`, fd)
  return res.data
}

export async function deleteCafeMenuItemAdmin(cafeId, menuItemId) {
  const res = await api.delete(`/api/admin/cafes/${cafeId}/menu/${menuItemId}`)
  return res.data
}

export async function getCafeDetailAdmin(cafeId) {
  const res = await api.get(`/api/admin/cafes/${cafeId}`)
  return res.data
}

export async function updateCafeProfileAdmin(cafeId, payload) {
  const res = await api.put(`/api/admin/cafes/${cafeId}`, payload)
  return res.data
}

export async function listCafeImagesAdmin(cafeId) {
  const res = await api.get(`/api/admin/cafes/${cafeId}/images`)
  return res.data
}

export async function uploadCafeImageAdmin(cafeId, file, cover) {
  const fd = new FormData()
  fd.append('file', file)
  if (typeof cover === 'boolean') {
    fd.append('cover', String(!!cover))
  }
  const res = await api.post(`/api/admin/cafes/${cafeId}/images`, fd)
  return res.data
}

export async function deleteCafeImageAdmin(cafeId, imageId) {
  const res = await api.delete(`/api/admin/cafes/${cafeId}/images/${imageId}`)
  return res.data
}

export async function downloadCafeHistoryExcel(cafeId) {
  const res = await api.get(`/api/admin/cafes/${cafeId}/export/history.xlsx`, {
    responseType: 'blob'
  })
  return res.data
}

export async function downloadCafeMenuExcel(cafeId) {
  const res = await api.get(`/api/admin/cafes/${cafeId}/export/menu.xlsx`, {
    responseType: 'blob'
  })
  return res.data
}

export async function getAdminAnalyticsSummary() {
  const res = await api.get('/api/admin/analytics/summary')
  return res.data
}

export async function getAdminAnalyticsDetails() {
  const res = await api.get('/api/admin/analytics/details')
  return res.data
}

export async function approveCafeAdmin(cafeId) {
  const res = await api.put(`/api/admin/cafes/${cafeId}/approve`)
  return res.data
}

export async function getOwnerAnalyticsSummary(username, cafeId) {
  const res = await api.get('/api/owner/analytics/summary', {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function getOwnerAnalyticsDetails(username, cafeId) {
  const res = await api.get('/api/owner/analytics/details', {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function listOwnerCafes(username) {
  const res = await api.get('/api/owner/cafes', {
    headers: ownerHeaders(username)
  })
  return res.data
}

export async function listPublicCafes() {
  const res = await api.get('/api/public/cafes')
  return res.data
}

export async function getPublicCafeDetail(cafeId) {
  const res = await api.get(`/api/public/cafes/${cafeId}`)
  return res.data
}

export async function listPublicCafeImages(cafeId) {
  const res = await api.get(`/api/public/cafes/${cafeId}/images`)
  return res.data
}

export async function listPublicCafeMenu(cafeId) {
  const res = await api.get(`/api/public/cafes/${cafeId}/menu`)
  return res.data
}

export async function listPublicCafeAmenities(cafeId, functionType) {
  const res = await api.get(`/api/public/cafes/${cafeId}/amenities`, {
    params: {
      functionType: functionType || undefined
    }
  })
  return res.data
}

export async function getPublicAvailableTables(cafeId, params) {
  const res = await api.get(`/api/public/cafes/${cafeId}/available-tables`, {
    params
  })
  return res.data
}

export async function createCustomerBooking(username, cafeId, payload) {
  const res = await api.post(`/api/customer/cafes/${cafeId}/bookings`, payload, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function listCustomerBookings(username) {
  const res = await api.get('/api/customer/bookings', {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function deleteCustomerBooking(username, bookingId) {
  const res = await api.delete(`/api/customer/bookings/${bookingId}`, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function createRazorpayOrderForCustomerBooking(username, bookingId) {
  const res = await api.post(`/api/customer/bookings/${bookingId}/payment/razorpay/order`, null, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function verifyRazorpayPaymentForCustomerBooking(username, bookingId, payload) {
  const res = await api.post(`/api/customer/bookings/${bookingId}/payment/razorpay/verify`, payload, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function createCustomerOrder(username, cafeId, payload) {
  const res = await api.post(`/api/customer/cafes/${cafeId}/orders`, payload, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function getUserDetail(id) {
  const res = await api.get(`/api/admin/users/${id}`)
  return res.data
}

export async function getUserDetailByUsername(username) {
  const res = await api.get(`/api/admin/users/by-username/${encodeURIComponent(username)}`)
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

export async function getOwnerCafe(username, cafeId) {
  const res = await api.get('/api/owner/cafe', {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function getOwnerMe(username) {
  const res = await api.get('/api/owner/me', {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function listOwnerBookings(username, cafeId) {
  const res = await api.get('/api/owner/bookings', {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function approveOwnerBooking(username, cafeId, bookingId) {
  const res = await api.post(`/api/owner/bookings/${bookingId}/approve`, null, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function denyOwnerBooking(username, cafeId, bookingId, payload) {
  const res = await api.post(`/api/owner/bookings/${bookingId}/deny`, payload, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function denyOwnerBookingWithRefund(username, cafeId, bookingId, payload) {
  const res = await api.post(`/api/owner/bookings/${bookingId}/deny-refund`, payload, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function deleteOwnerBooking(username, cafeId, bookingId) {
  const res = await api.delete(`/api/owner/bookings/${bookingId}`, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function listOwnerOrders(username, cafeId) {
  const res = await api.get('/api/owner/orders', {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function deleteOwnerOrder(username, cafeId, orderId) {
  const res = await api.delete(`/api/owner/orders/${orderId}`, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function listStaffOrders(username, status) {
  const res = await api.get('/api/staff/orders', {
    params: status ? { status } : undefined,
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function updateStaffOrderStatus(username, orderId, status) {
  const res = await api.post(
    `/api/staff/orders/${orderId}/status`,
    { status },
    {
      headers: {
        'X-USERNAME': username
      }
    }
  )
  return res.data
}

export async function listStaffApprovedBookings(username) {
  const res = await api.get('/api/staff/bookings', {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function serveStaffOrder(username, orderId, allocatedTable) {
  const res = await api.post(
    `/api/staff/orders/${orderId}/serve`,
    {},
    {
      headers: {
        'X-USERNAME': username
      }
    }
  )
  return res.data
}

export async function listCustomerOrders(username) {
  const res = await api.get('/api/customer/orders', {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function deleteCustomerOrder(username, orderId) {
  const res = await api.delete(`/api/customer/orders/${orderId}`, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function createRazorpayOrderForCustomerOrder(username, orderId) {
  const res = await api.post(`/api/customer/orders/${orderId}/payment/razorpay/order`, null, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function verifyRazorpayPaymentForCustomerOrder(username, orderId, payload) {
  const res = await api.post(`/api/customer/orders/${orderId}/payment/razorpay/verify`, payload, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function createRazorpayOrderForCustomerBookingFood(username, bookingId, payload) {
  const res = await api.post(`/api/customer/bookings/${bookingId}/food/payment/razorpay/order`, payload, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function confirmRazorpayCustomerBookingFoodOrder(username, bookingId, payload) {
  const res = await api.post(`/api/customer/bookings/${bookingId}/food/payment/razorpay/confirm`, payload, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function createRazorpayOrderForCustomerCart(username, payload) {
  const res = await api.post('/api/customer/payment/razorpay/order', payload, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function confirmRazorpayCustomerCartOrder(username, payload) {
  const res = await api.post('/api/customer/payment/razorpay/confirm-cart-order', payload, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function getMyProfile(username) {
  const res = await api.get('/api/profile/me', {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function updateMyProfile(username, payload) {
  const res = await api.put('/api/profile/me', payload, {
    headers: {
      'X-USERNAME': username
    }
  })
  return res.data
}

export async function upsertOwnerCafe(username, payload) {
  const res = await api.put('/api/owner/cafe', payload, {
    headers: {
      ...ownerHeaders(username, payload?.id)
    }
  })
  return res.data
}

export async function upsertOwnerCafeWithDocuments(username, payload, docKeys, documents) {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  for (const k of docKeys || []) {
    fd.append('docKeys', k)
  }
  for (const f of documents || []) {
    fd.append('documents', f)
  }
  const res = await api.put('/api/owner/cafe', fd, {
    headers: {
      ...ownerHeaders(username, payload?.id)
    }
  })
  return res.data
}

export async function deleteOwnerCafe(username, cafeId) {
  const res = await api.delete('/api/owner/cafe', {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function listOwnerStaff(username, cafeId) {
  const res = await api.get('/api/owner/staff', {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function createOwnerStaff(username, cafeId, payload, documents) {
  if (documents && documents.length > 0) {
    const fd = new FormData()
    fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
    for (const file of documents) {
      fd.append('documents', file)
    }

    const res = await api.post('/api/owner/staff', fd, {
      headers: {
        ...ownerHeaders(username, cafeId)
      }
    })
    return res.data
  }

  const res = await api.post('/api/owner/staff', payload, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function deleteOwnerStaff(username, cafeId, id) {
  const res = await api.delete(`/api/owner/staff/${id}`, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function listOwnerMenu(username, cafeId) {
  const res = await api.get('/api/owner/menu', {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function createOwnerMenuItem(username, cafeId, payload) {
  const res = await api.post('/api/owner/menu', payload, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function updateOwnerMenuItem(username, cafeId, id, payload) {
  const res = await api.put(`/api/owner/menu/${id}`, payload, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function updateOwnerMenuAvailability(username, cafeId, id, available) {
  const res = await api.put(
    `/api/owner/menu/${id}/availability`,
    { available },
    {
      headers: {
        ...ownerHeaders(username, cafeId)
      }
    }
  )
  return res.data
}

export async function uploadOwnerMenuItemImage(username, cafeId, id, file) {
  const fd = new FormData()
  fd.append('file', file)

  const res = await api.post(`/api/owner/menu/${id}/image`, fd, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function deleteOwnerMenuItem(username, cafeId, id) {
  const res = await api.delete(`/api/owner/menu/${id}`, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function listOwnerCapacities(username, cafeId) {
  const res = await api.get('/api/owner/capacities', {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function upsertOwnerCapacity(username, cafeId, payload) {
  const res = await api.post('/api/owner/capacities', payload, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function deleteOwnerCapacity(username, cafeId, id) {
  const res = await api.delete(`/api/owner/capacities/${id}`, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function listOwnerAmenities(username, cafeId) {
  const res = await api.get('/api/owner/amenities', {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function createOwnerAmenity(username, cafeId, payload) {
  const res = await api.post('/api/owner/amenities', payload, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function updateOwnerAmenity(username, cafeId, id, payload) {
  const res = await api.put(`/api/owner/amenities/${id}`, payload, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function deleteOwnerAmenity(username, cafeId, id) {
  const res = await api.delete(`/api/owner/amenities/${id}`, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function listOwnerImages(username, cafeId) {
  const res = await api.get('/api/owner/images', {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function uploadOwnerImage(username, cafeId, file, cover) {
  const fd = new FormData()
  fd.append('file', file)
  if (cover != null) {
    fd.append('cover', String(!!cover))
  }

  const res = await api.post('/api/owner/images', fd, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}

export async function deleteOwnerImage(username, cafeId, id) {
  const res = await api.delete(`/api/owner/images/${id}`, {
    headers: {
      ...ownerHeaders(username, cafeId)
    }
  })
  return res.data
}
