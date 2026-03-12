import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { clearSession, getSession } from '../../lib/auth.js'
import ProfilePage from './ProfilePage.jsx'
import {
  approveOwnerBooking,
  approveCafeAdmin,
  createOwnerStaff,
  createOwnerMenuItem,
  deleteOwnerCapacity,
  listOwnerAmenities,
  createOwnerAmenity,
  updateOwnerAmenity,
  deleteOwnerAmenity,
  deleteOwnerCafe,
  deleteOwnerStaff,
  deleteOwnerImage,
  deleteOwnerBooking,
  denyOwnerBookingWithRefund,
  denyOwnerBooking,
  deleteOwnerOrder,
  listOwnerCafes,
  getOwnerCafe,
  getOwnerMe,
  listOwnerBookings,
  listOwnerCapacities,
  listOwnerImages,
  listOwnerMenu,
  listOwnerOrders,
  listOwnerStaff,
  getOwnerAnalyticsDetails,
  getOwnerAnalyticsSummary,
  uploadOwnerMenuItemImage,
  updateOwnerMenuAvailability,
  uploadOwnerImage,
  upsertOwnerCapacity,
  upsertOwnerCafe
} from '../../lib/api.js'

function TrashIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 16h10l1-16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

function Field({ label, children, className }) {
  return (
    <label className={`grid gap-1 ${className || ''}`.trim()}>
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      {children}
    </label>
  )
}

function ProfileSection({
  cafe,
  setCafe,
  cafeSteps = ['Basic & contact', 'Legal', 'Bank'],
  cafeStep = 0,
  setCafeStep = () => {},
  canGoNextCafe = true,
  canSubmitCafe = true,
  cafeLoading,
  cafeErr,
  cafeMsg,
  canSaveCafe,
  refreshCafe,
  onSaveCafe,
  onDeleteCafe
}) {
  return (
    <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Cafe profile</div>
          <div className="mt-1 text-xs text-slate-600">Create and maintain your cafe details shown across the app.</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm"
            onClick={() => refreshCafe()}
            disabled={cafeLoading}
          >
            Reload
          </button>
          {/* {cafe?.id ? (
            <button
              type="button"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-500/15 disabled:opacity-60"
              onClick={onDeleteCafe}
              disabled={cafeLoading}
            >
              Delete cafe
            </button>
          ) : null} */}
          <button
            type="button"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            onClick={onSaveCafe}
            disabled={cafeLoading || !canSaveCafe || !canSubmitCafe}
          >
            Save
          </button>
        </div>
      </div>

      {cafeErr ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{cafeErr}</div> : null}
      {cafeMsg ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{cafeMsg}</div> : null}
      {cafeLoading ? <div className="mt-4 text-sm text-slate-600">Loading...</div> : null}

      <div className="mt-5">
        <div className="text-sm font-semibold">Step {cafeStep + 1} of {cafeSteps.length}: {cafeSteps[cafeStep]}</div>
      </div>

      {cafeStep === 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Cafe name *">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.cafeName || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), cafeName: e.target.value }))}
              placeholder="Digital Cafe"
            />
          </Field>
          <Field label="Active">
            <select
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={String(cafe?.active ?? true)}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), active: e.target.value === 'true' }))}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </Field>

          <Field label="Owner name(s)">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.ownerNames || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), ownerNames: e.target.value }))}
              placeholder="Owner / partners"
            />
          </Field>
          <Field label="POC designation">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.pocDesignation || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), pocDesignation: e.target.value }))}
              placeholder="Manager / Owner"
            />
          </Field>

          <Field label="Mobile">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.phone || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), phone: e.target.value }))}
              placeholder="Cafe contact"
            />
          </Field>
          <Field label="WhatsApp number">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.whatsappNumber || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), whatsappNumber: e.target.value }))}
              placeholder="WhatsApp"
            />
          </Field>

          <Field label="Email">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.email || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), email: e.target.value }))}
              placeholder="cafe@email.com"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                className="min-h-[90px] w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={cafe?.description || ''}
                onChange={(e) => setCafe((c) => ({ ...(c || {}), description: e.target.value }))}
                placeholder="About your cafe..."
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Full address">
              <input
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={cafe?.addressLine || ''}
                onChange={(e) => setCafe((c) => ({ ...(c || {}), addressLine: e.target.value }))}
                placeholder="Street / landmark"
              />
            </Field>
          </div>

          <Field label="City">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.city || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), city: e.target.value }))}
            />
          </Field>
          <Field label="State">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.state || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), state: e.target.value }))}
            />
          </Field>
          <Field label="Pincode">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.pincode || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), pincode: e.target.value }))}
            />
          </Field>

          <Field label="Opening time">
            <input
              type="time"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.openingTime || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), openingTime: e.target.value }))}
              placeholder="09:00"
            />
          </Field>
          <Field label="Closing time">
            <input
              type="time"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.closingTime || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), closingTime: e.target.value }))}
              placeholder="23:00"
            />
          </Field>
        </div>
      ) : null}

      {cafeStep === 1 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="FSSAI number">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.fssaiNumber || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), fssaiNumber: e.target.value }))}
              placeholder="FSSAI"
            />
          </Field>
          <Field label="PAN number">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.panNumber || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), panNumber: e.target.value }))}
              placeholder="PAN"
            />
          </Field>
          <Field label="GSTIN">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.gstin || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), gstin: e.target.value }))}
              placeholder="GSTIN"
            />
          </Field>
          <Field label="Shop/Establishment license number">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.shopLicenseNumber || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), shopLicenseNumber: e.target.value }))}
              placeholder="License"
            />
          </Field>
        </div>
      ) : null}

      {cafeStep === 2 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Bank account number">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.bankAccountNumber || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), bankAccountNumber: e.target.value }))}
            />
          </Field>
          <Field label="IFSC">
            <input
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
              value={cafe?.bankIfsc || ''}
              onChange={(e) => setCafe((c) => ({ ...(c || {}), bankIfsc: e.target.value }))}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Account holder name">
              <input
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={cafe?.bankAccountHolderName || ''}
                onChange={(e) => setCafe((c) => ({ ...(c || {}), bankAccountHolderName: e.target.value }))}
              />
            </Field>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm disabled:opacity-60"
          disabled={cafeLoading || cafeStep === 0}
          onClick={() => setCafeStep((s) => Math.max(0, s - 1))}
        >
          Back
        </button>

        {cafeStep < cafeSteps.length - 1 ? (
          <button
            type="button"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            disabled={cafeLoading || !canGoNextCafe}
            onClick={() => setCafeStep((s) => Math.min(cafeSteps.length - 1, s + 1))}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            onClick={onSaveCafe}
            disabled={cafeLoading || !canSaveCafe || !canSubmitCafe}
          >
            Save
          </button>
        )}
      </div>
    </div>
  )
}

function OnboardingSection({
  cafe,
  setCafe,
  cafeSteps,
  cafeStep,
  setCafeStep,
  canGoNextCafe,
  canSubmitCafe,
  cafeLoading,
  cafeErr,
  cafeMsg,
  canSaveCafe,
  refreshCafe,
  onSaveCafe
}) {
  return (
    <div className="mt-10 rounded-3xl border border-black/10 bg-white/70 p-8">
      <div className="text-xs font-semibold text-slate-600">First step</div>
      <div className="mt-2 text-2xl font-extrabold">Register your cafe</div>
      <div className="mt-2 max-w-2xl text-sm text-slate-600">
        Before you can manage staff, menu, tables, or images, create your cafe profile.
      </div>
      <ProfileSection
        cafe={cafe}
        setCafe={setCafe}
        cafeSteps={cafeSteps}
        cafeStep={cafeStep}
        setCafeStep={setCafeStep}
        canGoNextCafe={canGoNextCafe}
        canSubmitCafe={canSubmitCafe}
        cafeLoading={cafeLoading}
        cafeErr={cafeErr}
        cafeMsg={cafeMsg}
        canSaveCafe={canSaveCafe}
        refreshCafe={refreshCafe}
        onSaveCafe={onSaveCafe}
        onDeleteCafe={() => {}}
      />
    </div>
  )
}

export default function OwnerDashboard() {
  const session = getSession()
  const loc = useLocation()

  const [tab, setTab] = useState('profile')

  useEffect(() => {
    if (String(loc?.pathname || '').endsWith('/dashboard/owner/profile')) {
      setTab('myProfile')
    }
  }, [loc?.pathname])

  async function onSaveAddCafe() {
    setCafeErr('')
    setCafeMsg('')

    if (!canSaveAddCafe) {
      setCafeErr('Cafe name is required')
      return
    }

    setCafeLoading(true)
    try {
      const payload = {
        cafeName: String(addCafeDraft?.cafeName || '').trim(),
        ownerNames: String(addCafeDraft?.ownerNames || '').trim() || null,
        pocDesignation: String(addCafeDraft?.pocDesignation || '').trim() || null,
        description: String(addCafeDraft?.description || '').trim() || null,
        phone: String(addCafeDraft?.phone || '').trim() || null,
        email: String(addCafeDraft?.email || '').trim() || null,
        whatsappNumber: String(addCafeDraft?.whatsappNumber || '').trim() || null,
        addressLine: String(addCafeDraft?.addressLine || '').trim() || null,
        city: String(addCafeDraft?.city || '').trim() || null,
        state: String(addCafeDraft?.state || '').trim() || null,
        pincode: String(addCafeDraft?.pincode || '').trim() || null,
        openingTime: String(addCafeDraft?.openingTime || '').trim() || null,
        closingTime: String(addCafeDraft?.closingTime || '').trim() || null,
        fssaiNumber: String(addCafeDraft?.fssaiNumber || '').trim() || null,
        panNumber: String(addCafeDraft?.panNumber || '').trim() || null,
        gstin: String(addCafeDraft?.gstin || '').trim() || null,
        shopLicenseNumber: String(addCafeDraft?.shopLicenseNumber || '').trim() || null,
        bankAccountNumber: String(addCafeDraft?.bankAccountNumber || '').trim() || null,
        bankIfsc: String(addCafeDraft?.bankIfsc || '').trim() || null,
        bankAccountHolderName: String(addCafeDraft?.bankAccountHolderName || '').trim() || null,
        active: addCafeDraft?.active ?? true
      }

      const saved = await upsertOwnerCafe(ownerUsername, payload)
      if (saved?.id != null) {
        setSelectedCafeId(Number(saved.id))
        try {
          window.localStorage.setItem('ownerSelectedCafeId', String(saved.id))
        } catch {
          // ignore
        }
      }

      setCafeMsg('Saved')
      setAddCafeOpen(false)
      setHasCafe(true)
      await refreshCafes(saved?.id)
      if (saved?.id != null) {
        await refreshCafeWithId(Number(saved.id))
      }
    } catch (e) {
      const status = e?.response?.status
      const data = e?.response?.data
      const msg = typeof data === 'string' ? data : data ? JSON.stringify(data) : ''
      setCafeErr(`${status ? `HTTP ${status}: ` : ''}${msg || 'Failed to save cafe'}`)
    } finally {
      setCafeLoading(false)
    }
  }

  const [hasCafe, setHasCafe] = useState(false)

  const sidebarItems = useMemo(() => {
    const disabled = !hasCafe
    return [
      { key: 'myProfile', label: 'My Profile', disabled: false },
      { key: 'profile', label: 'Cafe Profile', disabled: false },
      { key: 'staff', label: 'Staff', disabled },
      { key: 'menu', label: 'Menu', disabled },
      { key: 'capacities', label: 'Tables/Functions', disabled },
      { key: 'images', label: 'Images', disabled },
      { key: 'revenue', label: 'Revenue', disabled },
      { key: 'bookings', label: 'Bookings', disabled },
      { key: 'orders', label: 'Orders', disabled }
    ]
  }, [hasCafe])

  function SidebarButton({ item }) {
    const active = tab === item.key
    const disabled = !!item.disabled
    return (
      <button
        type="button"
        onClick={() => {
          if (!disabled) setTab(item.key)
        }}
        disabled={disabled}
        className={
          (
            'w-full rounded-xl px-4 py-2 text-left text-sm font-semibold transition ' +
            (active
              ? 'bg-emerald-600 text-white'
              : disabled
                ? 'border border-black/10 bg-white/40 text-slate-400'
                : 'border border-black/10 bg-white/70 text-slate-800 hover:bg-white')
          ).trim()
        }
      >
        {item.label}
      </button>
    )
  }

  function SidebarLogoutButton() {
    return (
      <button
        type="button"
        className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        onClick={() => {
          clearSession()
          window.location.href = '/login'
        }}
      >
        Logout
      </button>
    )
  }

  const [cafe, setCafe] = useState(null)
  const [cafeLoading, setCafeLoading] = useState(false)
  const [cafeMsg, setCafeMsg] = useState('')
  const [cafeErr, setCafeErr] = useState('')

  const cafeSteps = ['Basic & contact', 'Legal', 'Bank']
  const [cafeStep, setCafeStep] = useState(0)

  const [addCafeDraft, setAddCafeDraft] = useState(null)
  const [addCafeStep, setAddCafeStep] = useState(0)
  const canSaveCafe = useMemo(() => {
    return String(cafe?.cafeName || '').trim().length > 0
  }, [cafe])

  const canGoNextCafe = useMemo(() => {
    if (cafeStep === 0) return canSaveCafe
    return true
  }, [cafeStep, canSaveCafe])

  const canSubmitCafe = useMemo(() => {
    return canSaveCafe
  }, [canSaveCafe])

  const canSaveAddCafe = useMemo(() => {
    return String(addCafeDraft?.cafeName || '').trim().length > 0
  }, [addCafeDraft])

  const canGoNextAddCafe = useMemo(() => {
    if (addCafeStep === 0) return canSaveAddCafe
    return true
  }, [addCafeStep, canSaveAddCafe])

  const canSubmitAddCafe = useMemo(() => {
    return canSaveAddCafe
  }, [canSaveAddCafe])

  const [cafes, setCafes] = useState([])
  const [cafesLoading, setCafesLoading] = useState(false)
  const [selectedCafeId, setSelectedCafeId] = useState(() => {
    try {
      const v = window.localStorage.getItem('ownerSelectedCafeId')
      return v ? Number(v) : null
    } catch {
      return null
    }
  })

  const [addCafeOpen, setAddCafeOpen] = useState(false)

  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffMsg, setStaffMsg] = useState('')
  const [staffErr, setStaffErr] = useState('')

  const [staffQ, setStaffQ] = useState('')
  const [staffPageSize, setStaffPageSize] = useState(10)
  const [staffPage, setStaffPage] = useState(1)

  const [menu, setMenu] = useState([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuMsg, setMenuMsg] = useState('')
  const [menuErr, setMenuErr] = useState('')

  const [menuQ, setMenuQ] = useState('')
  const [menuPageSize, setMenuPageSize] = useState(10)
  const [menuPage, setMenuPage] = useState(1)

  const [newMenuName, setNewMenuName] = useState('')
  const [newMenuPrice, setNewMenuPrice] = useState('')
  const [newMenuCategory, setNewMenuCategory] = useState('')
  const [newMenuDescription, setNewMenuDescription] = useState('')
  const [newMenuAvailable, setNewMenuAvailable] = useState(true)
  const [newMenuImageFile, setNewMenuImageFile] = useState(null)

  const [revLoading, setRevLoading] = useState(false)
  const [revErr, setRevErr] = useState('')
  const [ownerAnalyticsSummary, setOwnerAnalyticsSummary] = useState(null)
  const [ownerAnalyticsDetails, setOwnerAnalyticsDetails] = useState(null)
  const [revRefreshTick, setRevRefreshTick] = useState(0)

  const [capacities, setCapacities] = useState([])
  const [capLoading, setCapLoading] = useState(false)
  const [capMsg, setCapMsg] = useState('')
  const [capErr, setCapErr] = useState('')

  const [capQ, setCapQ] = useState('')
  const [capPageSize, setCapPageSize] = useState(10)
  const [capPage, setCapPage] = useState(1)

  const [capType, setCapType] = useState('DINE_IN')
  const [capTables, setCapTables] = useState('')
  const [capTableLabels, setCapTableLabels] = useState('')
  const [capSeatsPerTable, setCapSeatsPerTable] = useState('')
  const [capSeats, setCapSeats] = useState('')
  const [capPrice, setCapPrice] = useState('')
  const [capEnabled, setCapEnabled] = useState(true)

  const [amenities, setAmenities] = useState([])
  const [amenityLoading, setAmenityLoading] = useState(false)
  const [amenityMsg, setAmenityMsg] = useState('')
  const [amenityErr, setAmenityErr] = useState('')
  const [amenityName, setAmenityName] = useState('')
  const [amenityFunctionType, setAmenityFunctionType] = useState('')
  const [amenityEnabled, setAmenityEnabled] = useState(true)

  useEffect(() => {
    if (tab !== 'capacities') return
    refreshAmenities()
  }, [tab])

  const [images, setImages] = useState([])
  const [imgLoading, setImgLoading] = useState(false)
  const [imgMsg, setImgMsg] = useState('')
  const [imgErr, setImgErr] = useState('')

  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsErr, setBookingsErr] = useState('')

  const [bookingsQ, setBookingsQ] = useState('')
  const [bookingsPageSize, setBookingsPageSize] = useState(10)
  const [bookingsPage, setBookingsPage] = useState(1)

  const [denyOpen, setDenyOpen] = useState(false)
  const [denyBookingId, setDenyBookingId] = useState(null)
  const [denyReason, setDenyReason] = useState('')
  const [denyBusy, setDenyBusy] = useState(false)
  const [denyRefund, setDenyRefund] = useState(false)

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersErr, setOrdersErr] = useState('')

  const [ordersQ, setOrdersQ] = useState('')
  const [ordersPageSize, setOrdersPageSize] = useState(10)
  const [ordersPage, setOrdersPage] = useState(1)

  const [uploadFile, setUploadFile] = useState(null)
  const [uploadCover, setUploadCover] = useState(false)

  const [newStaffRole, setNewStaffRole] = useState('WAITER')
  const newStaffSteps = ['Personal details', 'Address', 'Academic info', 'Work experience', 'Documents']
  const [newStaffStep, setNewStaffStep] = useState(0)
  const [newStaffFirstName, setNewStaffFirstName] = useState('')
  const [newStaffLastName, setNewStaffLastName] = useState('')
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffPhone, setNewStaffPhone] = useState('')
  const [newStaffContactNo, setNewStaffContactNo] = useState('')
  const [newStaffGender, setNewStaffGender] = useState('')
  const [newStaffMaritalStatus, setNewStaffMaritalStatus] = useState('')

  const [newStaffStreet, setNewStaffStreet] = useState('')
  const [newStaffCity, setNewStaffCity] = useState('')
  const [newStaffState, setNewStaffState] = useState('')
  const [newStaffPincode, setNewStaffPincode] = useState('')

  const [newStaffAcademicInfoList, setNewStaffAcademicInfoList] = useState([
    {
      institutionName: '',
      degree: '',
      passingYear: '',
      grade: '',
      gradeInPercentage: ''
    }
  ])

  const [newStaffWorkExperienceList, setNewStaffWorkExperienceList] = useState([
    {
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      companyName: '',
      designation: '',
      ctc: '',
      reasonForLeaving: ''
    }
  ])

  const [newStaffDocuments, setNewStaffDocuments] = useState([])

  const canGoNextStaff = useMemo(() => {
    if (newStaffStep === 0) {
      return (
        String(newStaffFirstName || '').trim().length > 0 &&
        String(newStaffLastName || '').trim().length > 0 &&
        String(newStaffEmail || '').trim().length > 0 &&
        String(newStaffPhone || '').trim().length > 0
      )
    }
    if (newStaffStep === 1) {
      return (
        String(newStaffStreet || '').trim().length > 0 &&
        String(newStaffCity || '').trim().length > 0 &&
        String(newStaffState || '').trim().length > 0 &&
        String(newStaffPincode || '').trim().length > 0
      )
    }
    return true
  }, [
    newStaffStep,
    newStaffFirstName,
    newStaffLastName,
    newStaffEmail,
    newStaffPhone,
    newStaffStreet,
    newStaffCity,
    newStaffState,
    newStaffPincode
  ])

  const canCreateStaff = useMemo(() => {
    return (
      String(newStaffFirstName || '').trim().length > 0 &&
      String(newStaffLastName || '').trim().length > 0 &&
      String(newStaffEmail || '').trim().length > 0 &&
      String(newStaffPhone || '').trim().length > 0 &&
      String(newStaffStreet || '').trim().length > 0 &&
      String(newStaffCity || '').trim().length > 0 &&
      String(newStaffState || '').trim().length > 0 &&
      String(newStaffPincode || '').trim().length > 0 &&
      Array.isArray(newStaffDocuments) &&
      newStaffDocuments.length > 0
    )
  }, [
    newStaffFirstName,
    newStaffLastName,
    newStaffEmail,
    newStaffPhone,
    newStaffStreet,
    newStaffCity,
    newStaffState,
    newStaffPincode,
    newStaffDocuments
  ])

  const [didPrefillCafe, setDidPrefillCafe] = useState(false)

  const ownerUsername = session?.username

  const filteredStaff = useMemo(() => {
    const list = Array.isArray(staff) ? staff : []
    const q = String(staffQ || '').trim().toLowerCase()
    if (!q) return list

    return list.filter((u) => {
      const hay = [u?.id, u?.username, u?.role, u?.approvalStatus, u?.email, u?.phone]
        .filter((v) => v !== null && v !== undefined)
        .map((v) => String(v).toLowerCase())
        .join(' | ')
      return hay.includes(q)
    })
  }, [staff, staffQ])

  const staffTotalPages = useMemo(() => {
    const size = Number(staffPageSize) || 10
    return Math.max(1, Math.ceil(filteredStaff.length / size))
  }, [filteredStaff.length, staffPageSize])

  const pagedStaff = useMemo(() => {
    const size = Number(staffPageSize) || 10
    const safePage = Math.min(Math.max(1, staffPage), staffTotalPages)
    const start = (safePage - 1) * size
    return filteredStaff.slice(start, start + size)
  }, [filteredStaff, staffPage, staffPageSize, staffTotalPages])

  const filteredMenu = useMemo(() => {
    const list = Array.isArray(menu) ? menu : []
    const q = String(menuQ || '').trim().toLowerCase()
    if (!q) return list

    return list.filter((m) => {
      const hay = [m?.id, m?.name, m?.category, m?.price, m?.available]
        .filter((v) => v !== null && v !== undefined)
        .map((v) => String(v).toLowerCase())
        .join(' | ')
      return hay.includes(q)
    })
  }, [menu, menuQ])

  const menuTotalPages = useMemo(() => {
    const size = Number(menuPageSize) || 10
    return Math.max(1, Math.ceil(filteredMenu.length / size))
  }, [filteredMenu.length, menuPageSize])

  const pagedMenu = useMemo(() => {
    const size = Number(menuPageSize) || 10
    const safePage = Math.min(Math.max(1, menuPage), menuTotalPages)
    const start = (safePage - 1) * size
    return filteredMenu.slice(start, start + size)
  }, [filteredMenu, menuPage, menuPageSize, menuTotalPages])

  const filteredCaps = useMemo(() => {
    const list = Array.isArray(capacities) ? capacities : []
    const q = String(capQ || '').trim().toLowerCase()
    if (!q) return list

    return list.filter((c) => {
      const hay = [c?.id, c?.functionType, c?.tablesAvailable, c?.tableLabels, c?.seatsAvailable, c?.price, c?.enabled]
        .filter((v) => v !== null && v !== undefined)
        .map((v) => String(v).toLowerCase())
        .join(' | ')
      return hay.includes(q)
    })
  }, [capacities, capQ])

  const capTotalPages = useMemo(() => {
    const size = Number(capPageSize) || 10
    return Math.max(1, Math.ceil(filteredCaps.length / size))
  }, [filteredCaps.length, capPageSize])

  const pagedCaps = useMemo(() => {
    const size = Number(capPageSize) || 10
    const safePage = Math.min(Math.max(1, capPage), capTotalPages)
    const start = (safePage - 1) * size
    return filteredCaps.slice(start, start + size)
  }, [filteredCaps, capPage, capPageSize, capTotalPages])

  const filteredBookings = useMemo(() => {
    const list = Array.isArray(bookings) ? bookings : []
    const q = String(bookingsQ || '').trim().toLowerCase()
    if (!q) return list

    return list.filter((b) => {
      const hay = [
        b?.id,
        b?.customerName,
        b?.customerPhone,
        b?.bookingDate,
        b?.bookingTime,
        b?.guests,
        b?.amenityPreference,
        b?.allocatedTable,
        b?.status,
        b?.note,
        b?.denialReason
      ]
        .filter((v) => v !== null && v !== undefined)
        .map((v) => String(v).toLowerCase())
        .join(' | ')
      return hay.includes(q)
    })
  }, [bookings, bookingsQ])

  const bookingsTotalPages = useMemo(() => {
    const size = Number(bookingsPageSize) || 10
    return Math.max(1, Math.ceil(filteredBookings.length / size))
  }, [filteredBookings.length, bookingsPageSize])

  const pagedBookings = useMemo(() => {
    const size = Number(bookingsPageSize) || 10
    const safePage = Math.min(Math.max(1, bookingsPage), bookingsTotalPages)
    const start = (safePage - 1) * size
    return filteredBookings.slice(start, start + size)
  }, [filteredBookings, bookingsPage, bookingsPageSize, bookingsTotalPages])

  const filteredOrders = useMemo(() => {
    const list = Array.isArray(orders) ? orders : []
    const q = String(ordersQ || '').trim().toLowerCase()
    if (!q) return list

    return list.filter((o) => {
      const hay = [o?.id, o?.customerName, o?.customerPhone, o?.status, o?.amenityPreference, o?.allocatedTable, o?.totalAmount, o?.createdAt]
        .filter((v) => v !== null && v !== undefined)
        .map((v) => String(v).toLowerCase())
        .join(' | ')
      return hay.includes(q)
    })
  }, [orders, ordersQ])

  const ordersTotalPages = useMemo(() => {
    const size = Number(ordersPageSize) || 10
    return Math.max(1, Math.ceil(filteredOrders.length / size))
  }, [filteredOrders.length, ordersPageSize])

  const pagedOrders = useMemo(() => {
    const size = Number(ordersPageSize) || 10
    const safePage = Math.min(Math.max(1, ordersPage), ordersTotalPages)
    const start = (safePage - 1) * size
    return filteredOrders.slice(start, start + size)
  }, [filteredOrders, ordersPage, ordersPageSize, ordersTotalPages])

  async function refreshCafes(nextSelectedId) {
    if (!ownerUsername) return []
    setCafesLoading(true)
    try {
      const res = await listOwnerCafes(ownerUsername)
      const rows = Array.isArray(res) ? res : []
      setCafes(rows)

      const preferred = nextSelectedId ?? selectedCafeId
      const preferredExists = preferred != null && rows.some((c) => Number(c?.id) === Number(preferred))
      const resolved = preferredExists ? preferred : (rows[0]?.id ?? null)

      setSelectedCafeId(resolved != null ? Number(resolved) : null)
      try {
        if (resolved != null) window.localStorage.setItem('ownerSelectedCafeId', String(resolved))
        else window.localStorage.removeItem('ownerSelectedCafeId')
      } catch {
        // ignore
      }

      return rows
    } catch {
      setCafes([])
      setSelectedCafeId(null)
      return []
    } finally {
      setCafesLoading(false)
    }
  }

  async function onDeleteCafe() {
    if (!window.confirm('Delete your cafe? This will remove menu items, images, and capacities.')) return
    setCafeErr('')
    setCafeMsg('')
    setCafeLoading(true)
    try {
      await deleteOwnerCafe(ownerUsername, selectedCafeId)
      setCafe(null)
      setHasCafe(false)
      setTab('profile')
      setMenu([])
      setCapacities([])
      setImages([])
      setStaff([])
      setCafeMsg('Deleted')
      await refreshCafes()
    } catch (e) {
      const msg = e?.response?.data
      setCafeErr(typeof msg === 'string' ? msg : 'Failed to delete cafe')
    } finally {
      setCafeLoading(false)
    }
  }

  async function refreshCafeWithId(nextCafeId) {
    setCafeErr('')
    setCafeMsg('')
    setCafeLoading(true)
    try {
      const res = await getOwnerCafe(ownerUsername, nextCafeId)
      setCafe(res)
      setHasCafe(true)
      return true
    } catch (e) {
      if (e?.response?.status === 404) {
        setCafe((c) => (c && Object.keys(c).length > 0 ? c : null))
        setHasCafe(false)
        return false
      }
      const msg = e?.response?.data
      setCafeErr(typeof msg === 'string' ? msg : 'Failed to load cafe profile')
      return false
    } finally {
      setCafeLoading(false)
    }
  }

  async function refreshCafe() {
    setCafeErr('')
    setCafeMsg('')
    setCafeLoading(true)
    try {
      const res = await getOwnerCafe(ownerUsername, selectedCafeId)
      setCafe(res)
      setHasCafe(true)
      return true
    } catch (e) {
      if (e?.response?.status === 404) {
        setCafe((c) => (c && Object.keys(c).length > 0 ? c : null))
        setHasCafe(false)
        return false
      }
      const msg = e?.response?.data
      setCafeErr(typeof msg === 'string' ? msg : 'Failed to load cafe profile')
      return false
    } finally {
      setCafeLoading(false)
    }
  }

  async function onSaveCafe() {
    setCafeErr('')
    setCafeMsg('')

    const wasCreatingNew = selectedCafeId == null

    if (!canSaveCafe) {
      setCafeErr('Cafe name is required')
      return
    }

    setCafeLoading(true)
    try {
      const payload = {
        cafeName: String(cafe?.cafeName || '').trim(),
        ownerNames: String(cafe?.ownerNames || '').trim() || null,
        pocDesignation: String(cafe?.pocDesignation || '').trim() || null,
        description: String(cafe?.description || '').trim() || null,
        phone: String(cafe?.phone || '').trim() || null,
        email: String(cafe?.email || '').trim() || null,
        whatsappNumber: String(cafe?.whatsappNumber || '').trim() || null,
        addressLine: String(cafe?.addressLine || '').trim() || null,
        city: String(cafe?.city || '').trim() || null,
        state: String(cafe?.state || '').trim() || null,
        pincode: String(cafe?.pincode || '').trim() || null,
        openingTime: String(cafe?.openingTime || '').trim() || null,
        closingTime: String(cafe?.closingTime || '').trim() || null,
        fssaiNumber: String(cafe?.fssaiNumber || '').trim() || null,
        panNumber: String(cafe?.panNumber || '').trim() || null,
        gstin: String(cafe?.gstin || '').trim() || null,
        shopLicenseNumber: String(cafe?.shopLicenseNumber || '').trim() || null,
        bankAccountNumber: String(cafe?.bankAccountNumber || '').trim() || null,
        bankIfsc: String(cafe?.bankIfsc || '').trim() || null,
        bankAccountHolderName: String(cafe?.bankAccountHolderName || '').trim() || null,
        active: cafe?.active ?? true
      }

      const saved = await upsertOwnerCafe(ownerUsername, payload)
      if (saved?.id != null) {
        setSelectedCafeId(Number(saved.id))
        try {
          window.localStorage.setItem('ownerSelectedCafeId', String(saved.id))
        } catch {
          // ignore
        }
      }
      setCafeMsg('Saved')
      await refreshCafes(saved?.id)
      if (saved?.id != null) {
        await refreshCafeWithId(Number(saved.id))
      } else {
        await refreshCafe()
      }

      if (wasCreatingNew) {
        setAddCafeOpen(false)
      }
    } catch (e) {
      const status = e?.response?.status
      const data = e?.response?.data
      const msg = typeof data === 'string' ? data : data ? JSON.stringify(data) : ''
      setCafeErr(`${status ? `HTTP ${status}: ` : ''}${msg || 'Failed to save cafe'}`)
    } finally {
      setCafeLoading(false)
    }
  }

  async function refreshStaff() {
    setStaffErr('')
    setStaffMsg('')
    setStaffLoading(true)
    try {
      const res = await listOwnerStaff(ownerUsername, selectedCafeId)
      setStaff(Array.isArray(res) ? res : [])
    } catch (e) {
      const msg = e?.response?.data
      setStaffErr(typeof msg === 'string' ? msg : 'Failed to load staff')
    } finally {
      setStaffLoading(false)
    }
  }

  async function refreshMenu() {
    setMenuErr('')
    setMenuMsg('')
    setMenuLoading(true)
    try {
      const res = await listOwnerMenu(ownerUsername, selectedCafeId)
      setMenu(Array.isArray(res) ? res : [])
    } catch (e) {
      const msg = e?.response?.data
      setMenuErr(typeof msg === 'string' ? msg : 'Failed to load menu')
    } finally {
      setMenuLoading(false)
    }
  }

  async function refreshCapacities() {
    setCapErr('')
    setCapMsg('')
    setCapLoading(true)
    try {
      const res = await listOwnerCapacities(ownerUsername, selectedCafeId)
      setCapacities(Array.isArray(res) ? res : [])
    } catch (e) {
      const msg = e?.response?.data
      setCapErr(typeof msg === 'string' ? msg : 'Failed to load capacities')
    } finally {
      setCapLoading(false)
    }
  }

  async function refreshAmenities() {
    setAmenityErr('')
    setAmenityMsg('')
    setAmenityLoading(true)
    try {
      const res = await listOwnerAmenities(ownerUsername, selectedCafeId)
      setAmenities(Array.isArray(res) ? res : [])
    } catch (e) {
      const msg = e?.response?.data
      setAmenityErr(typeof msg === 'string' ? msg : 'Failed to load amenities')
    } finally {
      setAmenityLoading(false)
    }
  }

  async function refreshImages() {
    setImgErr('')
    setImgMsg('')
    setImgLoading(true)
    try {
      const res = await listOwnerImages(ownerUsername, selectedCafeId)
      setImages(Array.isArray(res) ? res : [])
    } catch (e) {
      const msg = e?.response?.data
      setImgErr(typeof msg === 'string' ? msg : 'Failed to load images')
    } finally {
      setImgLoading(false)
    }
  }

  async function refreshBookings() {
    setBookingsErr('')
    setBookingsLoading(true)
    try {
      if (selectedCafeId == null) {
        setBookings([])
        setBookingsErr('Select a cafe first')
        return
      }
      const res = await listOwnerBookings(ownerUsername, selectedCafeId)
      setBookings(Array.isArray(res) ? res : [])
    } catch (e) {
      const status = e?.response?.status
      const data = e?.response?.data
      const msg = typeof data === 'string' ? data : data ? JSON.stringify(data) : ''
      setBookingsErr(`${status ? `HTTP ${status}: ` : ''}${msg || 'Failed to load bookings'}`)
    } finally {
      setBookingsLoading(false)
    }
  }

  async function refreshOrders() {
    setOrdersErr('')
    setOrdersLoading(true)
    try {
      if (selectedCafeId == null) {
        setOrders([])
        setOrdersErr('Select a cafe first')
        return
      }
      const res = await listOwnerOrders(ownerUsername, selectedCafeId)
      setOrders(Array.isArray(res) ? res : [])
    } catch (e) {
      const status = e?.response?.status
      const data = e?.response?.data
      const msg = typeof data === 'string' ? data : data ? JSON.stringify(data) : ''
      setOrdersErr(`${status ? `HTTP ${status}: ` : ''}${msg || 'Failed to load orders'}`)
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => {
    if (!ownerUsername) return
    ;(async () => {
      const rows = await refreshCafes()
      const resolved = (selectedCafeId != null ? selectedCafeId : (rows?.[0]?.id ?? null))
      const ok = await refreshCafeWithId(resolved)
      if (ok) {
        await refreshStaff()
        await refreshMenu()
        await refreshCapacities()
        await refreshImages()
        await refreshBookings()
        await refreshOrders()
        await refreshAmenities()
      }
    })()
  }, [ownerUsername, selectedCafeId])

  function onAddCafe() {
    setCafeErr('')
    setCafeMsg('')
    setAddCafeOpen(true)
    setAddCafeStep(0)
    setAddCafeDraft({
      cafeName: '',
      active: true,
      ownerNames: '',
      pocDesignation: '',
      description: '',
      phone: '',
      email: '',
      whatsappNumber: '',
      addressLine: '',
      city: '',
      state: '',
      pincode: '',
      openingTime: '',
      closingTime: '',
      fssaiNumber: '',
      panNumber: '',
      gstin: '',
      shopLicenseNumber: '',
      bankAccountNumber: '',
      bankIfsc: '',
      bankAccountHolderName: ''
    })
  }

  function closeAddCafe() {
    setAddCafeOpen(false)
  }

  function RevenueSection() {
    const summary = ownerAnalyticsDetails?.summary || ownerAnalyticsSummary || null

    const busyHours = Array.isArray(ownerAnalyticsDetails?.busyHours) ? ownerAnalyticsDetails.busyHours : []
    const busyHoursTop = busyHours
      .filter((h) => h && h.hour != null)
      .slice(0, 8)
      .map((h) => ({
        hour: Number(h.hour),
        revenue: Number(h.orderRevenue ?? 0),
        count: Number(h.orderCount ?? 0)
      }))

    const busyMax = Math.max(1, ...busyHoursTop.map((h) => h.revenue || 0))

    const topItems = Array.isArray(ownerAnalyticsDetails?.topItems) ? ownerAnalyticsDetails.topItems : []
    const topItemsTop = topItems
      .filter((i) => i && i.itemName)
      .slice(0, 5)
      .map((i) => ({
        name: String(i.itemName),
        revenue: Number(i.totalRevenue ?? 0)
      }))

    const totalTopItemRevenue = topItemsTop.reduce((s, i) => s + (i.revenue || 0), 0)
    const pieColors = ['#059669', '#0ea5e9', '#a855f7', '#f59e0b', '#ef4444']

    function polarToCartesian(cx, cy, r, angleDeg) {
      const a = ((angleDeg - 90) * Math.PI) / 180.0
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
    }

    function arcPath(cx, cy, r, startAngle, endAngle) {
      const start = polarToCartesian(cx, cy, r, endAngle)
      const end = polarToCartesian(cx, cy, r, startAngle)
      const largeArc = endAngle - startAngle <= 180 ? 0 : 1
      return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
    }

    let pieStart = 0
    const pieSlices = totalTopItemRevenue > 0
      ? topItemsTop.map((i) => {
          const pct = (i.revenue || 0) / totalTopItemRevenue
          const sweep = pct * 360
          const s = { ...i, start: pieStart, end: pieStart + sweep }
          pieStart += sweep
          return s
        })
      : []

    return (
      <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Revenue</div>
            <div className="mt-1 text-xs text-slate-600">Your cafe earnings overview.</div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm"
            onClick={() => setRevRefreshTick((t) => t + 1)}
            disabled={revLoading}
          >
            Refresh
          </button>
        </div>

        {revErr ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{revErr}</div> : null}
        {revLoading ? <div className="mt-4 text-sm text-slate-600">Loading...</div> : null}

        {summary ? (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="text-xs font-semibold uppercase text-slate-500">Orders</div>
              <div className="mt-1 text-2xl font-extrabold">{summary?.totalOrders ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="text-xs font-semibold uppercase text-slate-500">Bookings</div>
              <div className="mt-1 text-2xl font-extrabold">{summary?.totalBookings ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="text-xs font-semibold uppercase text-slate-500">Order Revenue</div>
              <div className="mt-1 text-2xl font-extrabold">₹{Number(summary?.totalOrderRevenue ?? 0).toFixed(2)}</div>
            </div>
          </div>
        ) : (
          !revLoading ? <div className="mt-4 text-sm text-slate-600">No revenue data yet.</div> : null
        )}

        {summary ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="text-sm font-semibold">Busy hours (revenue)</div>
              <div className="mt-1 text-xs text-slate-600">Top hours by order revenue</div>
              {busyHoursTop.length === 0 ? (
                <div className="mt-4 text-sm text-slate-600">No hourly data yet.</div>
              ) : (
                <div className="mt-4">
                  <div className="flex items-end gap-2">
                    {busyHoursTop.map((h) => {
                      const height = Math.max(6, Math.round((h.revenue / busyMax) * 140))
                      return (
                        <div key={h.hour} className="flex w-10 flex-col items-center gap-2">
                          <div
                            className="w-full rounded-lg bg-emerald-600/80"
                            style={{ height: `${height}px` }}
                            title={`Hour ${h.hour}: ₹${h.revenue.toFixed(0)} (${h.count} orders)`}
                          />
                          <div className="text-[11px] font-semibold text-slate-700">{String(h.hour).padStart(2, '0')}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="text-sm font-semibold">Top items (revenue share)</div>
              <div className="mt-1 text-xs text-slate-600">Revenue split among best sellers</div>
              {pieSlices.length === 0 ? (
                <div className="mt-4 text-sm text-slate-600">No item revenue data yet.</div>
              ) : (
                <div className="mt-4 flex flex-wrap items-center gap-6">
                  <svg width="180" height="180" viewBox="0 0 180 180" className="shrink-0">
                    {pieSlices.map((s, idx) => (
                      <path key={s.name} d={arcPath(90, 90, 80, s.start, s.end)} fill={pieColors[idx % pieColors.length]} />
                    ))}
                    <circle cx="90" cy="90" r="45" fill="white" />
                    <text x="90" y="90" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900" style={{ fontSize: 12, fontWeight: 700 }}>
                      ₹{totalTopItemRevenue.toFixed(0)}
                    </text>
                    <text x="90" y="108" textAnchor="middle" dominantBaseline="middle" className="fill-slate-500" style={{ fontSize: 10 }}>
                      top items
                    </text>
                  </svg>

                  <div className="grid gap-2">
                    {pieSlices.map((s, idx) => {
                      const pct = ((s.revenue || 0) / totalTopItemRevenue) * 100
                      return (
                        <div key={s.name} className="flex items-center gap-2 text-sm">
                          <span className="h-3 w-3 rounded-sm" style={{ background: pieColors[idx % pieColors.length] }} />
                          <div className="max-w-[260px] truncate text-slate-800" title={s.name}>{s.name}</div>
                          <div className="ml-auto font-semibold text-slate-900">{pct.toFixed(0)}%</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  function MenuSection() {
    return (
      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Menu</div>
              <div className="mt-1 text-xs text-slate-600">Manage your menu items.</div>
            </div>
            <button
              type="button"
              className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm"
              onClick={refreshMenu}
              disabled={menuLoading}
            >
              Refresh
            </button>
          </div>

          {menuErr ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{menuErr}</div> : null}
          {menuMsg ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{menuMsg}</div> : null}

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <Field label="Name">
              <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" value={newMenuName} onChange={(e) => setNewMenuName(e.target.value)} />
            </Field>
            <Field label="Price">
              <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" value={newMenuPrice} onChange={(e) => setNewMenuPrice(e.target.value)} />
            </Field>
            <Field label="Category">
              <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" value={newMenuCategory} onChange={(e) => setNewMenuCategory(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <button type="button" className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={onCreateMenuItem} disabled={menuLoading}>
                Add
              </button>
            </div>
          </div>

          <div className="mt-4">
            <Field label="Description">
              <textarea className="min-h-[80px] w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" value={newMenuDescription} onChange={(e) => setNewMenuDescription(e.target.value)} />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Available">
              <select className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" value={String(newMenuAvailable)} onChange={(e) => setNewMenuAvailable(e.target.value === 'true')}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>
            <Field label="Image">
              <input type="file" accept="image/*" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" onChange={(e) => setNewMenuImageFile(e.target.files?.[0] || null)} />
            </Field>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
          <div className="text-sm font-semibold">Menu items</div>
          {menuLoading ? <div className="mt-4 text-sm text-slate-600">Loading...</div> : null}
          {!menuLoading && (Array.isArray(menu) && menu.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {menu.map((m) => (
                <div key={m.id} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{m.name}</div>
                      <div className="mt-1 text-xs text-slate-600">₹{m.price} • {m.category || '-'} • {m.available ? 'Available' : 'Unavailable'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold"
                        onClick={async () => {
                          setMenuErr('')
                          try {
                            await updateOwnerMenuAvailability(ownerUsername, selectedCafeId, m.id, !m.available)
                            await refreshMenu()
                          } catch (e) {
                            const msg = e?.response?.data
                            setMenuErr(typeof msg === 'string' ? msg : 'Failed to update availability')
                          }
                        }}
                        disabled={menuLoading}
                      >
                        Toggle
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                        onClick={() => onDeleteMenuItem(m.id)}
                        disabled={menuLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-600">No menu items yet.</div>
          ))}
        </div>
      </div>
    )
  }

  function CapacitiesSection() {
    return (
      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Tables/Functions</div>
              <div className="mt-1 text-xs text-slate-600">Configure tables & seating by function type.</div>
            </div>
            <button type="button" className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm" onClick={refreshCapacities} disabled={capLoading}>
              Refresh
            </button>
          </div>

          {capErr ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{capErr}</div> : null}
          {capMsg ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{capMsg}</div> : null}

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field label="Function type">
              <select className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" value={capType} onChange={(e) => setCapType(e.target.value)}>
                <option value="DINE_IN">DINE_IN</option>
                <option value="BIRTHDAY">BIRTHDAY</option>
                <option value="ANNIVERSARY">ANNIVERSARY</option>
              </select>
            </Field>
            <Field label="Tables available">
              <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" value={capTables} onChange={(e) => setCapTables(e.target.value)} />
            </Field>
            <Field label="Table labels (comma separated)">
              <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" value={capTableLabels} onChange={(e) => setCapTableLabels(e.target.value)} />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <Field label="Seats/table">
              <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" value={capSeatsPerTable} onChange={(e) => setCapSeatsPerTable(e.target.value)} />
            </Field>
            <Field label="Seats available">
              <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" value={capSeats} onChange={(e) => setCapSeats(e.target.value)} />
            </Field>
            <Field label="Price">
              <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" value={capPrice} onChange={(e) => setCapPrice(e.target.value)} />
            </Field>
            <Field label="Enabled">
              <select className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" value={String(capEnabled)} onChange={(e) => setCapEnabled(e.target.value === 'true')}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>
          </div>

          <div className="mt-4">
            <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={onUpsertCapacity} disabled={capLoading}>
              Save
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
          <div className="text-sm font-semibold">Configured capacities</div>
          {capLoading ? <div className="mt-4 text-sm text-slate-600">Loading...</div> : null}
          {!capLoading && (Array.isArray(capacities) && capacities.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {capacities.map((c) => (
                <div key={c.id} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-slate-900">
                      <div className="font-semibold">{c.functionType}</div>
                      <div className="mt-1 text-xs text-slate-600">Tables: {c.tablesAvailable} • Labels: {c.tableLabels || '-'} • Enabled: {c.enabled ? 'Yes' : 'No'}</div>
                    </div>
                    <button type="button" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700" onClick={() => onDeleteCapacity(c.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-600">No capacities yet.</div>
          ))}
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!ownerUsername) return
    if (tab !== 'orders') return
    const t = setInterval(() => {
      refreshOrders()
    }, 8000)
    return () => clearInterval(t)
  }, [ownerUsername, tab])

  useEffect(() => {
    if (!ownerUsername) return
    if (hasCafe) return
    if (didPrefillCafe) return

    ;(async () => {
      try {
        const me = await getOwnerMe(ownerUsername)
        const pd = me?.personalDetails || {}
        const addr = me?.address || {}
        const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(' ').trim()

        setCafe((prev) => {
          const c = prev && typeof prev === 'object' ? { ...prev } : {}

          if (!String(c.ownerNames || '').trim() && fullName) c.ownerNames = fullName
          if (!String(c.phone || '').trim() && pd.phone) c.phone = String(pd.phone)
          if (!String(c.whatsappNumber || '').trim() && (pd.contactNo || pd.phone)) c.whatsappNumber = String(pd.contactNo || pd.phone)
          if (!String(c.email || '').trim() && pd.email) c.email = String(pd.email)

          if (!String(c.addressLine || '').trim() && addr.street) c.addressLine = String(addr.street)
          if (!String(c.city || '').trim() && addr.city) c.city = String(addr.city)
          if (!String(c.state || '').trim() && addr.state) c.state = String(addr.state)
          if (!String(c.pincode || '').trim() && addr.pincode) c.pincode = String(addr.pincode)

          return c
        })
      } catch (e) {
        // ignore autofill errors
      } finally {
        setDidPrefillCafe(true)
      }
    })()
  }, [ownerUsername, hasCafe, didPrefillCafe])

  function BookingsSection() {
    return (
      <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Bookings</div>
            <div className="mt-1 text-xs text-slate-600">Table bookings made by customers.</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span>Show</span>
              <select
                value={bookingsPageSize}
                onChange={(e) => {
                  setBookingsPageSize(Number(e.target.value) || 10)
                  setBookingsPage(1)
                }}
                className="rounded-lg border border-black/10 bg-white px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span>Search:</span>
              <input
                value={bookingsQ}
                onChange={(e) => {
                  setBookingsQ(e.target.value)
                  setBookingsPage(1)
                }}
                className="w-56 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="customer / phone / date"
              />
            </div>
            <button
              type="button"
              className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm"
              onClick={refreshBookings}
              disabled={bookingsLoading}
            >
              Refresh
            </button>
          </div>
        </div>

        {bookingsErr ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{bookingsErr}</div> : null}
        {bookingsLoading ? <div className="mt-4 text-sm text-slate-600">Loading...</div> : null}

        {!bookingsLoading ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Guests</th>
                  <th className="px-3 py-2">Preference</th>
                  <th className="px-3 py-2">Function</th>
                  <th className="px-3 py-2">Allocated</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Payment</th>
                  <th className="px-3 py-2">Payment ID</th>
                  <th className="px-3 py-2">Paid At</th>
                  <th className="px-3 py-2">Note</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBookings.length > 0 ? (
                  pagedBookings.map((b) => (
                    <tr key={b.id} className="bg-white/60">
                      <td className="px-3 py-2 font-semibold text-slate-900">{b.customerName || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.customerPhone || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.bookingDate || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.bookingTime || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.guests ?? '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.amenityPreference || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.functionType || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.allocatedTable || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.status || 'PENDING'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.paymentStatus || 'UNPAID'}</td>
                      <td className="px-3 py-2 text-slate-700">{b.razorpayPaymentId || '-'}</td>
                      <td className="px-3 py-2 text-slate-600">{b.paidAt ? new Date(Number(b.paidAt)).toLocaleString() : '-'}</td>
                      <td className="px-3 py-2 text-slate-600">{b.note || '-'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                            disabled={['APPROVED', 'DENIED_WITH_REFUND'].includes(String(b.status || '').toUpperCase())}
                            onClick={async () => {
                              setBookingsErr('')
                              try {
                                await approveOwnerBooking(ownerUsername, selectedCafeId, b.id)
                                await refreshBookings()
                              } catch (e) {
                                const msg = e?.response?.data
                                setBookingsErr(typeof msg === 'string' ? msg : 'Failed to approve booking')
                              }
                            }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-500/15 disabled:opacity-60"
                            disabled={['APPROVED', 'DENIED', 'DENIED_WITH_REFUND'].includes(String(b.status || '').toUpperCase())}
                            onClick={() => {
                              setDenyBookingId(b.id)
                              setDenyReason('')
                              setDenyRefund(false)
                              setDenyOpen(true)
                            }}
                          >
                            Deny
                          </button>

                          <button
                            type="button"
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-500/15 disabled:opacity-60"
                            disabled={['APPROVED', 'DENIED_WITH_REFUND'].includes(String(b.status || '').toUpperCase())}
                            onClick={() => {
                              setDenyBookingId(b.id)
                              setDenyReason('')
                              setDenyRefund(true)
                              setDenyOpen(true)
                            }}
                          >
                            Deny + Refund
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-white/80"
                            onClick={async () => {
                              if (!window.confirm('Delete this booking request?')) return
                              setBookingsErr('')
                              try {
                                await deleteOwnerBooking(ownerUsername, selectedCafeId, b.id)
                                await refreshBookings()
                              } catch (e) {
                                const msg = e?.response?.data
                                setBookingsErr(typeof msg === 'string' ? msg : 'Failed to delete booking')
                              }
                            }}
                            aria-label="Delete booking"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        {['DENIED', 'DENIED_WITH_REFUND'].includes(String(b.status || '').toUpperCase()) && b.denialReason ? (
                          <div className="mt-2 text-xs text-red-700">Reason: {b.denialReason}</div>
                        ) : null}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-4 text-slate-600" colSpan={14}>
                      No bookings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredBookings.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
                <div>
                  Showing {(Math.min(Math.max(1, bookingsPage), bookingsTotalPages) - 1) * (Number(bookingsPageSize) || 10) + 1} to{' '}
                  {Math.min(Math.min(Math.max(1, bookingsPage), bookingsTotalPages) * (Number(bookingsPageSize) || 10), filteredBookings.length)} of {filteredBookings.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    onClick={() => setBookingsPage((p) => Math.max(1, p - 1))}
                    disabled={bookingsPage <= 1}
                  >
                    Prev
                  </button>
                  <div className="text-xs">
                    Page {Math.min(Math.max(1, bookingsPage), bookingsTotalPages)} of {bookingsTotalPages}
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    onClick={() => setBookingsPage((p) => Math.min(bookingsTotalPages, p + 1))}
                    disabled={bookingsPage >= bookingsTotalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {denyOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5">
              <div className="text-sm font-extrabold">{denyRefund ? 'Deny booking with refund' : 'Deny booking'}</div>
              <div className="mt-1 text-xs text-slate-600">Please provide a message. This will be shown to the customer.</div>

              <div className="mt-4 grid gap-2">
                <div className="text-xs font-semibold text-slate-600">Reason *</div>
                <textarea
                  className="min-h-24 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                  value={denyReason}
                  onChange={(e) => setDenyReason(e.target.value)}
                  placeholder="e.g. No tables available at this time"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
                  onClick={() => {
                    if (denyBusy) return
                    setDenyOpen(false)
                    setDenyBookingId(null)
                    setDenyReason('')
                    setDenyRefund(false)
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                  disabled={denyBusy}
                  onClick={async () => {
                    setBookingsErr('')
                    setDenyBusy(true)
                    try {
                      if (denyRefund) {
                        await denyOwnerBookingWithRefund(ownerUsername, selectedCafeId, denyBookingId, { reason: denyReason })
                      } else {
                        await denyOwnerBooking(ownerUsername, selectedCafeId, denyBookingId, { reason: denyReason })
                      }
                      setDenyOpen(false)
                      setDenyBookingId(null)
                      setDenyReason('')
                      setDenyRefund(false)
                      await refreshBookings()
                    } catch (e) {
                      const msg = e?.response?.data
                      setBookingsErr(typeof msg === 'string' ? msg : 'Failed to deny booking')
                    } finally {
                      setDenyBusy(false)
                    }
                  }}
                >
                  {denyRefund ? 'Deny + Refund' : 'Deny booking'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  function OrdersSection() {
    return (
      <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Orders</div>
            <div className="mt-1 text-xs text-slate-600">Food orders placed by customers.</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span>Show</span>
              <select
                value={ordersPageSize}
                onChange={(e) => {
                  setOrdersPageSize(Number(e.target.value) || 10)
                  setOrdersPage(1)
                }}
                className="rounded-lg border border-black/10 bg-white px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span>Search:</span>
              <input
                value={ordersQ}
                onChange={(e) => {
                  setOrdersQ(e.target.value)
                  setOrdersPage(1)
                }}
                className="w-56 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="customer / phone / status"
              />
            </div>
            <button
              type="button"
              className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm"
              onClick={refreshOrders}
              disabled={ordersLoading}
            >
              Refresh
            </button>
          </div>
        </div>

        {ordersErr ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{ordersErr}</div> : null}
        {ordersLoading ? <div className="mt-4 text-sm text-slate-600">Loading...</div> : null}

        {!ordersLoading ? (
          <div className="mt-4 grid gap-3">
            {filteredOrders.length > 0 ? (
              pagedOrders.map((o) => (
                <div key={o.id} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">Order #{o.orderNumber ?? o.id}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {o.customerName || '-'} • {o.customerPhone || '-'} • {o.status || 'PLACED'}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">Preference: {o.amenityPreference || '-'} • Allocated: {o.allocatedTable || '-'}</div>
                    </div>
                    <div className="text-sm font-extrabold">₹{o.totalAmount ?? 0}</div>
                  </div>

                  {Array.isArray(o.items) && o.items.length > 0 ? (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[560px] text-left text-sm">
                        <thead className="text-xs font-semibold uppercase text-slate-500">
                          <tr>
                            <th className="px-3 py-2">Item</th>
                            <th className="px-3 py-2">Price</th>
                            <th className="px-3 py-2">Qty</th>
                            <th className="px-3 py-2">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {o.items.map((it, idx) => (
                            <tr key={`${o.id}-${idx}`} className="bg-white/60">
                              <td className="px-3 py-2 font-semibold text-slate-900">{it.itemName || '-'}</td>
                              <td className="px-3 py-2 text-slate-700">₹{it.price ?? 0}</td>
                              <td className="px-3 py-2 text-slate-700">{it.qty ?? 0}</td>
                              <td className="px-3 py-2 text-slate-700">₹{((it.price ?? 0) * (it.qty ?? 0)).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-slate-600">No items.</div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-white/80 disabled:opacity-50"
                      disabled={ordersLoading}
                      onClick={async () => {
                        if (!window.confirm('Delete this order?')) return
                        setOrdersErr('')
                        try {
                          await deleteOwnerOrder(ownerUsername, selectedCafeId, o.id)
                          await refreshOrders()
                        } catch (e) {
                          const msg = e?.response?.data
                          setOrdersErr(typeof msg === 'string' ? msg : 'Failed to delete order')
                        }
                      }}
                      aria-label="Delete order"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-600">No orders yet.</div>
            )}

            {filteredOrders.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
                <div>
                  Showing {(Math.min(Math.max(1, ordersPage), ordersTotalPages) - 1) * (Number(ordersPageSize) || 10) + 1} to{' '}
                  {Math.min(Math.min(Math.max(1, ordersPage), ordersTotalPages) * (Number(ordersPageSize) || 10), filteredOrders.length)} of {filteredOrders.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                    disabled={ordersPage <= 1}
                  >
                    Prev
                  </button>
                  <div className="text-xs">
                    Page {Math.min(Math.max(1, ordersPage), ordersTotalPages)} of {ordersTotalPages}
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    onClick={() => setOrdersPage((p) => Math.min(ordersTotalPages, p + 1))}
                    disabled={ordersPage >= ordersTotalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  async function onCreateMenuItem() {
    setMenuErr('')
    setMenuMsg('')
    const name = newMenuName.trim()
    const priceNum = Number(newMenuPrice)
    if (!name || !Number.isFinite(priceNum) || priceNum <= 0) {
      setMenuErr('Name and valid price are required')
      return
    }
    setMenuLoading(true)
    try {
      const created = await createOwnerMenuItem(ownerUsername, selectedCafeId, {
        name,
        price: priceNum,
        category: newMenuCategory.trim() || null,
        description: newMenuDescription.trim() || null,
        available: !!newMenuAvailable
      })

      let imageFailed = false
      if (newMenuImageFile && created?.id) {
        try {
          await uploadOwnerMenuItemImage(ownerUsername, selectedCafeId, created.id, newMenuImageFile)
        } catch (e) {
          imageFailed = true
        }
      }

      setNewMenuName('')
      setNewMenuPrice('')
      setNewMenuCategory('')
      setNewMenuDescription('')
      setNewMenuAvailable(true)
      setNewMenuImageFile(null)
      setMenuMsg(imageFailed ? 'Added (image upload failed)' : 'Added')
      await refreshMenu()
    } catch (e) {
      const msg = e?.response?.data
      setMenuErr(typeof msg === 'string' ? msg : 'Failed to add menu item')
    } finally {
      setMenuLoading(false)
    }
  }

  async function onUploadMenuImage(item, file) {
    if (!item?.id || !file) return
    setMenuErr('')
    setMenuMsg('')
    setMenuLoading(true)
    try {
      await uploadOwnerMenuItemImage(ownerUsername, selectedCafeId, item.id, file)
      setMenuMsg('Image uploaded')
      await refreshMenu()
    } catch (e) {
      const msg = e?.response?.data
      setMenuErr(typeof msg === 'string' ? msg : 'Failed to upload image')
    } finally {
      setMenuLoading(false)
    }
  }

  async function onDeleteMenuItem(id) {
    if (!window.confirm('Delete this menu item?')) return
    setMenuErr('')
    setMenuMsg('')
    setMenuLoading(true)
    try {
      await deleteOwnerMenuItem(ownerUsername, selectedCafeId, id)
      setMenuMsg('Deleted')
      await refreshMenu()
    } catch (e) {
      const msg = e?.response?.data
      setMenuErr(typeof msg === 'string' ? msg : 'Failed to delete menu item')
    } finally {
      setMenuLoading(false)
    }
  }

  async function onUpsertCapacity() {
    setCapErr('')
    setCapMsg('')
    const tablesNum = Number(capTables)
    const seatsPerTableNum = capSeatsPerTable === '' ? null : Number(capSeatsPerTable)
    const seatsNum = capSeats === '' ? null : Number(capSeats)
    const priceNum = capPrice === '' ? null : Number(capPrice)
    if (!Number.isFinite(tablesNum) || tablesNum < 0) {
      setCapErr('Tables must be a valid number')
      return
    }
    if (seatsPerTableNum != null && (!Number.isFinite(seatsPerTableNum) || seatsPerTableNum <= 0)) {
      setCapErr('Seats per table must be a valid number greater than 0')
      return
    }
    if (seatsNum != null && !Number.isFinite(seatsNum)) {
      setCapErr('Seats must be a valid number')
      return
    }
    if (priceNum != null && !Number.isFinite(priceNum)) {
      setCapErr('Price must be a valid number')
      return
    }
    setCapLoading(true)
    try {
      await upsertOwnerCapacity(ownerUsername, selectedCafeId, {
        functionType: capType,
        tablesAvailable: tablesNum,
        tableLabels: String(capTableLabels || '').trim() || null,
        seatsPerTable: seatsPerTableNum,
        seatsAvailable: seatsNum,
        price: priceNum,
        enabled: !!capEnabled
      })
      setCapMsg('Saved')
      await refreshCapacities()
    } catch (e) {
      const msg = e?.response?.data
      setCapErr(typeof msg === 'string' ? msg : 'Failed to save capacity')
    } finally {
      setCapLoading(false)
    }
  }

  async function onDeleteCapacity(id) {
    if (!window.confirm('Delete this capacity row?')) return
    setCapErr('')
    setCapMsg('')
    setCapLoading(true)
    try {
      await deleteOwnerCapacity(ownerUsername, selectedCafeId, id)
      setCapMsg('Deleted')
      await refreshCapacities()
    } catch (e) {
      const msg = e?.response?.data
      setCapErr(typeof msg === 'string' ? msg : 'Failed to delete capacity')
    } finally {
      setCapLoading(false)
    }
  }

  async function onUploadImage() {
    setImgErr('')
    setImgMsg('')
    if (!uploadFile) {
      setImgErr('Please choose an image')
      return
    }
    setImgLoading(true)
    try {
      await uploadOwnerImage(ownerUsername, selectedCafeId, uploadFile, uploadCover)
      setUploadFile(null)
      setUploadCover(false)
      setImgMsg('Uploaded')
      await refreshImages()
    } catch (e) {
      const msg = e?.response?.data
      setImgErr(typeof msg === 'string' ? msg : 'Failed to upload image')
    } finally {
      setImgLoading(false)
    }
  }

  async function onDeleteImage(id) {
    if (!window.confirm('Delete this image?')) return
    setImgErr('')
    setImgMsg('')
    setImgLoading(true)
    try {
      await deleteOwnerImage(ownerUsername, selectedCafeId, id)
      setImgMsg('Deleted')
      await refreshImages()
    } catch (e) {
      const msg = e?.response?.data
      setImgErr(typeof msg === 'string' ? msg : 'Failed to delete image')
    } finally {
      setImgLoading(false)
    }
  }

  async function onCreateStaff() {
    setStaffErr('')
    setStaffMsg('')

    if (!canCreateStaff) {
      setStaffErr('Please fill required fields and upload documents.')
      return
    }

    if (!newStaffDocuments || newStaffDocuments.length === 0) {
      setStaffErr('Please upload staff documents')
      return
    }

    setStaffLoading(true)
    try {
      const cleanedAcademic = newStaffAcademicInfoList
        .map((a) => ({
          institutionName: String(a.institutionName || '').trim(),
          degree: String(a.degree || '').trim(),
          passingYear: a.passingYear === '' ? 0 : Number(a.passingYear),
          grade: String(a.grade || '').trim(),
          gradeInPercentage: a.gradeInPercentage === '' ? 0 : Number(a.gradeInPercentage)
        }))
        .filter((a) => a.institutionName || a.degree || a.passingYear || a.grade || a.gradeInPercentage)

      const cleanedWork = newStaffWorkExperienceList
        .map((w) => ({
          startDate: String(w.startDate || '').trim(),
          endDate: String(w.endDate || '').trim(),
          currentlyWorking: !!w.currentlyWorking,
          companyName: String(w.companyName || '').trim(),
          designation: String(w.designation || '').trim(),
          ctc: w.ctc === '' ? 0 : Number(w.ctc),
          reasonForLeaving: String(w.reasonForLeaving || '').trim()
        }))
        .filter((w) => w.startDate || w.endDate || w.companyName || w.designation || w.ctc || w.reasonForLeaving)

      const payload = {
        role: newStaffRole,
        personalDetails: {
          firstName: newStaffFirstName.trim(),
          lastName: newStaffLastName.trim(),
          email: newStaffEmail.trim(),
          phone: newStaffPhone.trim(),
          contactNo: newStaffContactNo.trim(),
          gender: newStaffGender.trim(),
          maritalStatus: newStaffMaritalStatus.trim()
        },
        address: {
          street: newStaffStreet.trim(),
          city: newStaffCity.trim(),
          state: newStaffState.trim(),
          pincode: newStaffPincode.trim()
        },
        academicInfoList: cleanedAcademic,
        workExperienceList: cleanedWork
      }

      const res = await createOwnerStaff(ownerUsername, selectedCafeId, payload, newStaffDocuments)
      setStaffMsg(typeof res === 'string' ? res : 'Staff created')
      setNewStaffFirstName('')
      setNewStaffLastName('')
      setNewStaffEmail('')
      setNewStaffPhone('')
      setNewStaffContactNo('')
      setNewStaffGender('')
      setNewStaffMaritalStatus('')
      setNewStaffStreet('')
      setNewStaffCity('')
      setNewStaffState('')
      setNewStaffPincode('')
      setNewStaffAcademicInfoList([{ institutionName: '', degree: '', passingYear: '', grade: '', gradeInPercentage: '' }])
      setNewStaffWorkExperienceList([
        {
          startDate: '',
          endDate: '',
          currentlyWorking: false,
          companyName: '',
          designation: '',
          ctc: '',
          reasonForLeaving: ''
        }
      ])
      setNewStaffDocuments([])
      setNewStaffStep(0)
      await refreshStaff()
    } catch (e) {
      setStaffErr(typeof e?.response?.data === 'string' ? e.response.data : 'Failed to create staff')
    } finally {
      setStaffLoading(false)
    }
  }

  async function onDeleteStaff(id) {
    if (!window.confirm('Delete this staff user?')) return
    setStaffErr('')
    setStaffMsg('')
    setStaffLoading(true)
    try {
      const res = await deleteOwnerStaff(ownerUsername, selectedCafeId, id)
      setStaffMsg(typeof res === 'string' ? res : 'Deleted')
      await refreshStaff()
    } catch (e) {
      const msg = e?.response?.data
      setStaffErr(typeof msg === 'string' ? msg : 'Failed to delete staff')
    } finally {
      setStaffLoading(false)
    }
  }

  async function onUpsertAmenity() {
    setAmenityErr('')
    setAmenityMsg('')
    const name = String(amenityName || '').trim()
    if (!name) {
      setAmenityErr('Amenity name is required')
      return
    }
    setAmenityLoading(true)
    try {
      await createOwnerAmenity(ownerUsername, selectedCafeId, {
        name,
        functionType: amenityFunctionType || null,
        enabled: !!amenityEnabled
      })
      setAmenityMsg('Created')
      setAmenityName('')
      setAmenityEnabled(true)
      await refreshAmenities()
    } catch (e) {
      const msg = e?.response?.data
      setAmenityErr(typeof msg === 'string' ? msg : 'Failed to create amenity')
    } finally {
      setAmenityLoading(false)
    }
  }

  async function onDeleteAmenity(id) {
    if (!window.confirm('Delete this amenity?')) return
    setAmenityErr('')
    setAmenityMsg('')
    setAmenityLoading(true)
    try {
      await deleteOwnerAmenity(ownerUsername, selectedCafeId, id)
      setAmenityMsg('Deleted')
      await refreshAmenities()
    } catch (e) {
      const msg = e?.response?.data
      setAmenityErr(typeof msg === 'string' ? msg : 'Failed to delete amenity')
    } finally {
      setAmenityLoading(false)
    }
  }

  useEffect(() => {
    if (!hasCafe) return
    if (tab !== 'revenue') return
    const ownerUsername = session?.username
    if (!ownerUsername) return

    let alive = true
    ;(async () => {
      setRevErr('')
      setRevLoading(true)
      try {
        const [s, d] = await Promise.all([
          getOwnerAnalyticsSummary(ownerUsername, selectedCafeId),
          getOwnerAnalyticsDetails(ownerUsername, selectedCafeId)
        ])
        if (!alive) return
        setOwnerAnalyticsSummary(s || null)
        setOwnerAnalyticsDetails(d || null)
      } catch (e) {
        if (!alive) return
        const msg = e?.response?.data
        setRevErr(typeof msg === 'string' ? msg : 'Failed to load revenue')
        setOwnerAnalyticsSummary(null)
        setOwnerAnalyticsDetails(null)
      } finally {
        if (!alive) return
        setRevLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [hasCafe, session?.username, tab, revRefreshTick, selectedCafeId])

  function ImagesSection() {
    return (
      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Cafe images</div>
              <div className="mt-1 text-xs text-slate-600">Upload images visible to customers.</div>
            </div>
            <button
              type="button"
              className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm"
              onClick={() => refreshImages()}
              disabled={imgLoading}
            >
              Refresh
            </button>
          </div>

          {imgErr ? <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{imgErr}</div> : null}
          {imgMsg ? <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{imgMsg}</div> : null}

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field label="File">
              <input
                type="file"
                accept="image/*"
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </Field>
            <Field label="Cover">
              <select
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={String(uploadCover)}
                onChange={(e) => setUploadCover(e.target.value === 'true')}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                onClick={onUploadImage}
                disabled={imgLoading}
              >
                Upload
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
          <div className="text-sm font-semibold">Gallery</div>
          <div className="mt-1 text-xs text-slate-600">Click an image to open it in a new tab.</div>

          {imgLoading ? <div className="mt-4 text-sm text-slate-600">Loading...</div> : null}

          {images.length === 0 ? (
            <div className="mt-4 text-sm text-slate-600">No images yet.</div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {images.map((img) => (
                <div key={img.id} className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                  <a href={img.url} target="_blank" rel="noreferrer">
                    <img src={img.url} alt={img.filename} className="h-40 w-full object-cover" />
                  </a>
                  <div className="flex items-center justify-between gap-2 p-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 line-clamp-1">{img.filename}</div>
                      <div className="mt-1 text-xs text-slate-500">{img.cover ? 'Cover' : 'Image'}</div>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                      onClick={() => onDeleteImage(img.id)}
                      aria-label="Delete image"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  function PlaceholderSection({ title, subtitle }) {
    return (
      <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-6">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs text-slate-600">{subtitle}</div>
        <div className="mt-5 rounded-2xl border border-dashed border-black/10 bg-white/50 p-8 text-sm text-slate-600">
          No data yet.
        </div>
      </div>
    )
  }

  function StaffSection() {
    return (
      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Add staff</div>
              <div className="mt-1 text-xs text-slate-600">Create CHEF/WAITER accounts for your cafe.</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {newStaffSteps.map((s, i) => (
              <button
                key={s}
                type="button"
                className={
                  i === newStaffStep
                    ? 'rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white'
                    : i < newStaffStep
                      ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800'
                      : 'rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700'
                }
                onClick={() => {
                  if (i <= newStaffStep) setNewStaffStep(i)
                }}
              >
                {i + 1}. {s}
              </button>
            ))}
          </div>

          {staffErr ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{staffErr}</div> : null}
          {staffMsg ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{staffMsg}</div> : null}

          {newStaffStep === 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Field label="Role *">
                <select
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                >
                  <option value="WAITER">WAITER</option>
                  <option value="CHEF">CHEF</option>
                </select>
              </Field>
              <Field label="First name *">
                <input
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                  value={newStaffFirstName}
                  onChange={(e) => setNewStaffFirstName(e.target.value)}
                />
              </Field>
              <Field label="Last name *">
                <input
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                  value={newStaffLastName}
                  onChange={(e) => setNewStaffLastName(e.target.value)}
                />
              </Field>
              <Field label="Email *">
                <input
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                />
              </Field>
              <Field label="Phone *">
                <input
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                />
              </Field>
              <Field label="Contact no">
                <input
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                  value={newStaffContactNo}
                  onChange={(e) => setNewStaffContactNo(e.target.value)}
                />
              </Field>
              <Field label="Gender">
                <select
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                  value={newStaffGender}
                  onChange={(e) => setNewStaffGender(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Marital status">
                <select
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                  value={newStaffMaritalStatus}
                  onChange={(e) => setNewStaffMaritalStatus(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </Field>
            </div>
          ) : null}

          {newStaffStep === 1 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 text-xs font-semibold text-slate-600">Address *</div>
              <Field label="Street *">
                <input
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                  value={newStaffStreet}
                  onChange={(e) => setNewStaffStreet(e.target.value)}
                />
              </Field>
              <Field label="City *">
                <input
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                  value={newStaffCity}
                  onChange={(e) => setNewStaffCity(e.target.value)}
                />
              </Field>
              <Field label="State *">
                <input
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                  value={newStaffState}
                  onChange={(e) => setNewStaffState(e.target.value)}
                />
              </Field>
              <Field label="Pincode *">
                <input
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                  value={newStaffPincode}
                  onChange={(e) => setNewStaffPincode(e.target.value)}
                />
              </Field>
            </div>
          ) : null}

          {newStaffStep === 2 ? (
            <div className="mt-6 grid gap-4">
              <div className="text-xs font-semibold text-slate-600">Academic info (optional)</div>
              {newStaffAcademicInfoList.map((row, idx) => (
                <div key={idx} className="grid gap-4 rounded-2xl border border-black/10 bg-white/50 p-4 md:grid-cols-5">
                  <Field label="Institution">
                    <input
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                      value={row.institutionName}
                      onChange={(e) => updateStaffAcademic(idx, 'institutionName', e.target.value)}
                    />
                  </Field>
                  <Field label="Degree">
                    <input
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                      value={row.degree}
                      onChange={(e) => updateStaffAcademic(idx, 'degree', e.target.value)}
                    />
                  </Field>
                  <Field label="Passing year">
                    <input
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                      value={row.passingYear}
                      onChange={(e) => updateStaffAcademic(idx, 'passingYear', e.target.value)}
                      placeholder="2024"
                    />
                  </Field>
                  <Field label="Grade">
                    <input
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                      value={row.grade}
                      onChange={(e) => updateStaffAcademic(idx, 'grade', e.target.value)}
                    />
                  </Field>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Field label="%">
                        <input
                          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                          value={row.gradeInPercentage}
                          onChange={(e) => updateStaffAcademic(idx, 'gradeInPercentage', e.target.value)}
                          placeholder="0"
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
                      onClick={() => removeStaffAcademic(idx)}
                      disabled={newStaffAcademicInfoList.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div>
                <button
                  type="button"
                  className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm hover:bg-white"
                  onClick={addStaffAcademic}
                >
                  Add academic row
                </button>
              </div>
            </div>
          ) : null}

          {newStaffStep === 3 ? (
            <div className="mt-6 grid gap-4">
              <div className="text-xs font-semibold text-slate-600">Work experience (optional)</div>
              {newStaffWorkExperienceList.map((row, idx) => (
                <div key={idx} className="grid gap-4 rounded-2xl border border-black/10 bg-white/50 p-4 md:grid-cols-6">
                  <Field label="Start date">
                    <input
                      type="date"
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                      value={row.startDate}
                      onChange={(e) => updateStaffWork(idx, 'startDate', e.target.value)}
                    />
                  </Field>
                  <Field label="End date">
                    <input
                      type="date"
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                      value={row.endDate}
                      onChange={(e) => updateStaffWork(idx, 'endDate', e.target.value)}
                    />
                  </Field>
                  <Field label="Company">
                    <input
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                      value={row.companyName}
                      onChange={(e) => updateStaffWork(idx, 'companyName', e.target.value)}
                    />
                  </Field>
                  <Field label="Designation">
                    <input
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                      value={row.designation}
                      onChange={(e) => updateStaffWork(idx, 'designation', e.target.value)}
                    />
                  </Field>
                  <Field label="CTC">
                    <input
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                      value={row.ctc}
                      onChange={(e) => updateStaffWork(idx, 'ctc', e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Field label="Currently working">
                        <select
                          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                          value={String(!!row.currentlyWorking)}
                          onChange={(e) => updateStaffWork(idx, 'currentlyWorking', e.target.value === 'true')}
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </Field>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
                      onClick={() => removeStaffWork(idx)}
                      disabled={newStaffWorkExperienceList.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="md:col-span-6">
                    <Field label="Reason for leaving">
                      <input
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                        value={row.reasonForLeaving}
                        onChange={(e) => updateStaffWork(idx, 'reasonForLeaving', e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <div>
                <button
                  type="button"
                  className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm hover:bg-white"
                  onClick={addStaffWork}
                >
                  Add work row
                </button>
              </div>
            </div>
          ) : null}

          {newStaffStep === 4 ? (
            <div className="mt-6 grid gap-3">
              <div className="text-xs font-semibold text-slate-600">Documents *</div>
              <input
                type="file"
                multiple
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                onChange={(e) => setNewStaffDocuments(Array.from(e.target.files || []))}
              />
              <div className="text-xs text-slate-600">Upload one or more documents for the staff member.</div>
            </div>
          ) : null}

          <div className="mt-4 text-xs text-slate-600">
            Credentials are sent to the staff email address.
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm disabled:opacity-60"
              disabled={staffLoading || newStaffStep === 0}
              onClick={() => setNewStaffStep((s) => Math.max(0, s - 1))}
            >
              Back
            </button>

            <div className="flex gap-2">
              {newStaffStep < newStaffSteps.length - 1 ? (
                <button
                  type="button"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                  disabled={staffLoading || !canGoNextStaff}
                  onClick={() => setNewStaffStep((s) => Math.min(newStaffSteps.length - 1, s + 1))}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                  onClick={onCreateStaff}
                  disabled={staffLoading || !canCreateStaff}
                >
                  {staffLoading ? 'Creating...' : 'Create staff'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/70">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 p-5">
            <div>
              <div className="text-sm font-semibold">Staff list</div>
              <div className="mt-1 text-xs text-slate-600">Your cafe’s registered staff accounts.</div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span>Show</span>
                <select
                  value={staffPageSize}
                  onChange={(e) => {
                    setStaffPageSize(Number(e.target.value) || 10)
                    setStaffPage(1)
                  }}
                  className="rounded-lg border border-black/10 bg-white px-2 py-1"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span>Search:</span>
                <input
                  value={staffQ}
                  onChange={(e) => {
                    setStaffQ(e.target.value)
                    setStaffPage(1)
                  }}
                  className="w-56 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  placeholder="username / role / email"
                />
              </div>

              <button
                type="button"
                className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm hover:bg-white"
                onClick={() => refreshStaff()}
                disabled={staffLoading}
              >
                Refresh
              </button>
            </div>
          </div>

          {staffLoading ? <div className="p-5 text-sm text-slate-600">Loading...</div> : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/50 text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-slate-600" colSpan={7}>
                      No staff yet.
                    </td>
                  </tr>
                ) : (
                  pagedStaff.map((u) => (
                    <tr key={u.id} className="hover:bg-white">
                      <td className="px-5 py-3 text-slate-700">{u.id}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{u.username}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-emerald-600/15 px-2 py-1 text-xs font-semibold text-emerald-800">{u.role}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{u.approvalStatus || 'APPROVED'}</td>
                      <td className="px-5 py-3 text-slate-600">{u.email || '-'}</td>
                      <td className="px-5 py-3 text-slate-600">{u.phone || '-'}</td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                          onClick={() => onDeleteStaff(u.id)}
                          aria-label="Delete staff"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredStaff.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 p-4 text-sm text-slate-700">
              <div>
                Showing {(Math.min(Math.max(1, staffPage), staffTotalPages) - 1) * (Number(staffPageSize) || 10) + 1} to{' '}
                {Math.min(Math.min(Math.max(1, staffPage), staffTotalPages) * (Number(staffPageSize) || 10), filteredStaff.length)} of {filteredStaff.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  onClick={() => setStaffPage((p) => Math.max(1, p - 1))}
                  disabled={staffPage <= 1}
                >
                  Prev
                </button>
                <div className="text-xs">
                  Page {Math.min(Math.max(1, staffPage), staffTotalPages)} of {staffTotalPages}
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  onClick={() => setStaffPage((p) => Math.min(staffTotalPages, p + 1))}
                  disabled={staffPage >= staffTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EDE4DA] text-slate-900">
      <div className="w-full px-4 py-6 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500">Cafe Owner Dashboard</div>
            <h1 className="mt-1 text-3xl font-extrabold">Welcome, {session?.username || 'Owner'}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <div className="text-slate-600">Current cafe:</div>
              <select
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                value={selectedCafeId ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  const next = v ? Number(v) : null
                  setSelectedCafeId(next)
                  try {
                    if (next != null) window.localStorage.setItem('ownerSelectedCafeId', String(next))
                    else window.localStorage.removeItem('ownerSelectedCafeId')
                  } catch {
                    // ignore
                  }
                }}
                disabled={cafesLoading}
              >
                <option value="">Select cafe</option>
                {cafes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cafeName || `Cafe #${c.id}`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm"
                onClick={() => refreshCafes(selectedCafeId)}
                disabled={cafesLoading}
              >
                Reload cafes
              </button>
              <button
                type="button"
                className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm font-semibold"
                onClick={onAddCafe}
                disabled={cafeLoading}
              >
                Add cafe
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex h-[calc(100vh-140px)] min-h-0 gap-4 overflow-hidden">
          <aside className="min-h-0 w-[260px] shrink-0 rounded-2xl border border-black/10 bg-white/70 p-4 sticky top-6 h-[calc(100vh-48px)] overflow-y-auto">
            <div className="text-xs font-semibold uppercase text-slate-500">Navigation</div>
            <div className="mt-3 grid gap-1">
              {sidebarItems.map((item) => (
                <SidebarButton key={item.key} item={item} />
              ))}
            </div>
            {!hasCafe ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                Create your cafe profile first to unlock Staff, Menu, Tables/Functions, Images, Bookings and Orders.
              </div>
            ) : null}

            <div className="mt-4">
              <SidebarLogoutButton />
            </div>
          </aside>

          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">
            {hasCafe ? (
              <>
                {tab === 'myProfile' ? <ProfilePage titlePrefix="Owner / Profile" /> : null}
                {tab === 'profile' ? (
                  <ProfileSection
                    cafe={cafe}
                    setCafe={setCafe}
                    cafeSteps={cafeSteps}
                    cafeStep={cafeStep}
                    setCafeStep={setCafeStep}
                    canGoNextCafe={canGoNextCafe}
                    canSubmitCafe={canSubmitCafe}
                    cafeLoading={cafeLoading}
                    cafeErr={cafeErr}
                    cafeMsg={cafeMsg}
                    canSaveCafe={canSaveCafe}
                    refreshCafe={refreshCafe}
                    onSaveCafe={onSaveCafe}
                    onDeleteCafe={onDeleteCafe}
                  />
                ) : null}

                {tab === 'staff' ? <StaffSection /> : null}
                {tab === 'menu' ? <MenuSection /> : null}
                {tab === 'capacities' ? <CapacitiesSection /> : null}
                {tab === 'images' ? <ImagesSection /> : null}
                {tab === 'bookings' ? <BookingsSection /> : null}
                {tab === 'orders' ? <OrdersSection /> : null}
                {tab === 'revenue' ? <RevenueSection /> : null}
                {tab === 'amenities' ? <AmenitiesSection /> : null}
              </>
            ) : (
              <>
                <OnboardingSection
                  cafe={cafe}
                  setCafe={setCafe}
                  cafeSteps={cafeSteps}
                  cafeStep={cafeStep}
                  setCafeStep={setCafeStep}
                  canGoNextCafe={canGoNextCafe}
                  canSubmitCafe={canSubmitCafe}
                  cafeLoading={cafeLoading}
                  cafeErr={cafeErr}
                  cafeMsg={cafeMsg}
                  canSaveCafe={canSaveCafe}
                  refreshCafe={refreshCafe}
                  onSaveCafe={onSaveCafe}
                />
              </>
            )}

            {addCafeOpen ? (
              <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
                <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
                    <div>
                      <div className="text-sm font-semibold">Add cafe</div>
                      <div className="mt-1 text-xs text-slate-600">Complete the 3-step cafe registration.</div>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm"
                      onClick={closeAddCafe}
                      disabled={cafeLoading}
                    >
                      Close
                    </button>
                  </div>
                  <div className="px-5 pb-6">
                    <ProfileSection
                      cafe={addCafeDraft}
                      setCafe={setAddCafeDraft}
                      cafeSteps={cafeSteps}
                      cafeStep={addCafeStep}
                      setCafeStep={setAddCafeStep}
                      canGoNextCafe={canGoNextAddCafe}
                      canSubmitCafe={canSubmitAddCafe}
                      cafeLoading={cafeLoading}
                      cafeErr={cafeErr}
                      cafeMsg={cafeMsg}
                      canSaveCafe={canSaveAddCafe}
                      refreshCafe={() => {}}
                      onSaveCafe={onSaveAddCafe}
                      onDeleteCafe={() => {}}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  )
}
