import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clearSession, getSession } from '../../lib/auth.js'
import {
  createOwnerStaff,
  createOwnerMenuItem,
  deleteOwnerCapacity,
  deleteOwnerStaff,
  deleteOwnerImage,
  deleteOwnerMenuItem,
  getOwnerCafe,
  listOwnerCapacities,
  listOwnerImages,
  listOwnerMenu,
  listOwnerStaff,
  uploadOwnerImage,
  upsertOwnerCapacity,
  upsertOwnerCafe
} from '../../lib/api.js'

function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      {children}
    </label>
  )
}

function ProfileSection({
  cafe,
  setCafe,
  cafeLoading,
  cafeErr,
  cafeMsg,
  canSaveCafe,
  refreshCafe,
  onSaveCafe
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
          <button
            type="button"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            onClick={onSaveCafe}
            disabled={cafeLoading || !canSaveCafe}
          >
            Save
          </button>
        </div>
      </div>

      {cafeErr ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{cafeErr}</div> : null}
      {cafeMsg ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{cafeMsg}</div> : null}
      {cafeLoading ? <div className="mt-4 text-sm text-slate-600">Loading...</div> : null}

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

        <Field label="Phone">
          <input
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
            value={cafe?.phone || ''}
            onChange={(e) => setCafe((c) => ({ ...(c || {}), phone: e.target.value }))}
            placeholder="Cafe contact"
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
          <Field label="Address line">
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
    </div>
  )
}

function OnboardingSection({ cafe, setCafe, cafeLoading, cafeErr, cafeMsg, canSaveCafe, refreshCafe, onSaveCafe }) {
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
        cafeLoading={cafeLoading}
        cafeErr={cafeErr}
        cafeMsg={cafeMsg}
        canSaveCafe={canSaveCafe}
        refreshCafe={refreshCafe}
        onSaveCafe={onSaveCafe}
      />
    </div>
  )
}

export default function OwnerDashboard() {
  const session = getSession()

  const [tab, setTab] = useState('profile')

  const [cafe, setCafe] = useState(null)
  const [cafeLoading, setCafeLoading] = useState(false)
  const [cafeMsg, setCafeMsg] = useState('')
  const [cafeErr, setCafeErr] = useState('')

  const [hasCafe, setHasCafe] = useState(false)

  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffMsg, setStaffMsg] = useState('')
  const [staffErr, setStaffErr] = useState('')

  const [menu, setMenu] = useState([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuMsg, setMenuMsg] = useState('')
  const [menuErr, setMenuErr] = useState('')

  const [newMenuName, setNewMenuName] = useState('')
  const [newMenuPrice, setNewMenuPrice] = useState('')
  const [newMenuCategory, setNewMenuCategory] = useState('')
  const [newMenuDescription, setNewMenuDescription] = useState('')
  const [newMenuAvailable, setNewMenuAvailable] = useState(true)

  const [capacities, setCapacities] = useState([])
  const [capLoading, setCapLoading] = useState(false)
  const [capMsg, setCapMsg] = useState('')
  const [capErr, setCapErr] = useState('')

  const [capType, setCapType] = useState('DINE_IN')
  const [capTables, setCapTables] = useState('')
  const [capSeats, setCapSeats] = useState('')
  const [capPrice, setCapPrice] = useState('')
  const [capEnabled, setCapEnabled] = useState(true)

  const [images, setImages] = useState([])
  const [imgLoading, setImgLoading] = useState(false)
  const [imgMsg, setImgMsg] = useState('')
  const [imgErr, setImgErr] = useState('')

  const [uploadFile, setUploadFile] = useState(null)
  const [uploadCover, setUploadCover] = useState(false)

  const [newStaffRole, setNewStaffRole] = useState('WAITER')
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

  const ownerUsername = session?.username

  async function refreshCafe() {
    setCafeErr('')
    setCafeMsg('')
    setCafeLoading(true)
    try {
      const res = await getOwnerCafe(ownerUsername)
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

  async function refreshStaff() {
    setStaffErr('')
    setStaffMsg('')
    setStaffLoading(true)
    try {
      const res = await listOwnerStaff(ownerUsername)
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
      const res = await listOwnerMenu(ownerUsername)
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
      const res = await listOwnerCapacities(ownerUsername)
      setCapacities(Array.isArray(res) ? res : [])
    } catch (e) {
      const msg = e?.response?.data
      setCapErr(typeof msg === 'string' ? msg : 'Failed to load capacities')
    } finally {
      setCapLoading(false)
    }
  }

  async function refreshImages() {
    setImgErr('')
    setImgMsg('')
    setImgLoading(true)
    try {
      const res = await listOwnerImages(ownerUsername)
      setImages(Array.isArray(res) ? res : [])
    } catch (e) {
      const msg = e?.response?.data
      setImgErr(typeof msg === 'string' ? msg : 'Failed to load images')
    } finally {
      setImgLoading(false)
    }
  }

  useEffect(() => {
    if (!ownerUsername) return
    ;(async () => {
      const ok = await refreshCafe()
      if (ok) {
        await refreshStaff()
        await refreshMenu()
        await refreshCapacities()
        await refreshImages()
      }
    })()
  }, [ownerUsername])

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
      await createOwnerMenuItem(ownerUsername, {
        name,
        price: priceNum,
        category: newMenuCategory.trim() || null,
        description: newMenuDescription.trim() || null,
        available: !!newMenuAvailable
      })
      setNewMenuName('')
      setNewMenuPrice('')
      setNewMenuCategory('')
      setNewMenuDescription('')
      setNewMenuAvailable(true)
      setMenuMsg('Added')
      await refreshMenu()
    } catch (e) {
      const msg = e?.response?.data
      setMenuErr(typeof msg === 'string' ? msg : 'Failed to add menu item')
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
      await deleteOwnerMenuItem(ownerUsername, id)
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
    const seatsNum = capSeats === '' ? null : Number(capSeats)
    const priceNum = capPrice === '' ? null : Number(capPrice)
    if (!Number.isFinite(tablesNum) || tablesNum < 0) {
      setCapErr('Tables must be a valid number')
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
      await upsertOwnerCapacity(ownerUsername, {
        functionType: capType,
        tablesAvailable: tablesNum,
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
      await deleteOwnerCapacity(ownerUsername, id)
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
      await uploadOwnerImage(ownerUsername, uploadFile, uploadCover)
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
      await deleteOwnerImage(ownerUsername, id)
      setImgMsg('Deleted')
      await refreshImages()
    } catch (e) {
      const msg = e?.response?.data
      setImgErr(typeof msg === 'string' ? msg : 'Failed to delete image')
    } finally {
      setImgLoading(false)
    }
  }

  const canSaveCafe = useMemo(() => {
    return !!(cafe?.cafeName && String(cafe.cafeName).trim().length >= 2)
  }, [cafe])

  const canCreateStaff = useMemo(() => {
    return (
      String(newStaffRole || '').trim().length > 0 &&
      String(newStaffFirstName || '').trim().length > 0 &&
      String(newStaffLastName || '').trim().length > 0 &&
      String(newStaffEmail || '').trim().length > 0 &&
      String(newStaffPhone || '').trim().length > 0 &&
      String(newStaffStreet || '').trim().length > 0 &&
      String(newStaffCity || '').trim().length > 0 &&
      String(newStaffState || '').trim().length > 0 &&
      String(newStaffPincode || '').trim().length > 0
    )
  }, [
    newStaffRole,
    newStaffFirstName,
    newStaffLastName,
    newStaffEmail,
    newStaffPhone,
    newStaffStreet,
    newStaffCity,
    newStaffState,
    newStaffPincode
  ])

  function updateStaffAcademic(idx, key, value) {
    setNewStaffAcademicInfoList((prev) => prev.map((row, i) => (i === idx ? { ...row, [key]: value } : row)))
  }

  function addStaffAcademic() {
    setNewStaffAcademicInfoList((prev) => [
      ...prev,
      { institutionName: '', degree: '', passingYear: '', grade: '', gradeInPercentage: '' }
    ])
  }

  function removeStaffAcademic(idx) {
    setNewStaffAcademicInfoList((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateStaffWork(idx, key, value) {
    setNewStaffWorkExperienceList((prev) => prev.map((row, i) => (i === idx ? { ...row, [key]: value } : row)))
  }

  function addStaffWork() {
    setNewStaffWorkExperienceList((prev) => [
      ...prev,
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
  }

  function removeStaffWork(idx) {
    setNewStaffWorkExperienceList((prev) => prev.filter((_, i) => i !== idx))
  }

  async function onSaveCafe() {
    setCafeErr('')
    setCafeMsg('')
    if (!canSaveCafe) {
      setCafeErr('Cafe name is required')
      return
    }
    setCafeLoading(true)
    try {
      const payload = {
        cafeName: String(cafe.cafeName || '').trim(),
        description: cafe.description || '',
        phone: cafe.phone || '',
        email: cafe.email || '',
        addressLine: cafe.addressLine || '',
        city: cafe.city || '',
        state: cafe.state || '',
        pincode: cafe.pincode || '',
        openingTime: cafe.openingTime || '',
        closingTime: cafe.closingTime || '',
        active: cafe.active != null ? !!cafe.active : true
      }
      const res = await upsertOwnerCafe(ownerUsername, payload)
      setCafe(res)
      setHasCafe(true)
      setCafeMsg('Saved')
      await refreshStaff()
      await refreshMenu()
      await refreshCapacities()
      await refreshImages()
    } catch (e) {
      const msg = e?.response?.data
      setCafeErr(typeof msg === 'string' ? msg : 'Failed to save cafe profile')
    } finally {
      setCafeLoading(false)
    }
  }

  async function onCreateStaff() {
    setStaffErr('')
    setStaffMsg('')
    if (!canCreateStaff) {
      setStaffErr('Please fill all required staff fields')
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
      const res = await createOwnerStaff(ownerUsername, payload, newStaffDocuments)
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
      setNewStaffAcademicInfoList([
        { institutionName: '', degree: '', passingYear: '', grade: '', gradeInPercentage: '' }
      ])
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
      await refreshStaff()
    } catch (e) {
      const msg = e?.response?.data
      setStaffErr(typeof msg === 'string' ? msg : 'Failed to create staff')
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
      const res = await deleteOwnerStaff(ownerUsername, id)
      setStaffMsg(typeof res === 'string' ? res : 'Deleted')
      await refreshStaff()
    } catch (e) {
      const msg = e?.response?.data
      setStaffErr(typeof msg === 'string' ? msg : 'Failed to delete staff')
    } finally {
      setStaffLoading(false)
    }
  }

  function TabButton({ k, label, disabled }) {
    const active = tab === k
    return (
      <button
        type="button"
        onClick={() => {
          if (!disabled) setTab(k)
        }}
        disabled={disabled}
        className={
          active
            ? 'rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500'
            : disabled
              ? 'rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm text-slate-400 opacity-60'
              : 'rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm text-slate-700 hover:bg-white'
        }
      >
        {label}
      </button>
    )
  }

  function MenuSection() {
    return (
      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Menu</div>
              <div className="mt-1 text-xs text-slate-600">Add items visible to customers.</div>
            </div>
            <button
              type="button"
              className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm"
              onClick={() => refreshMenu()}
              disabled={menuLoading}
            >
              Refresh
            </button>
          </div>

          {menuErr ? <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{menuErr}</div> : null}
          {menuMsg ? <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{menuMsg}</div> : null}

          <div className="mt-5 grid gap-4 md:grid-cols-5">
            <Field label="Name *">
              <input
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
              />
            </Field>
            <Field label="Price *">
              <input
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={newMenuPrice}
                onChange={(e) => setNewMenuPrice(e.target.value)}
                placeholder="199"
              />
            </Field>
            <Field label="Category">
              <input
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={newMenuCategory}
                onChange={(e) => setNewMenuCategory(e.target.value)}
                placeholder="Beverages"
              />
            </Field>
            <Field label="Available">
              <select
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={String(newMenuAvailable)}
                onChange={(e) => setNewMenuAvailable(e.target.value === 'true')}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-60"
                onClick={onCreateMenuItem}
                disabled={menuLoading}
              >
                Add
              </button>
            </div>
            <div className="md:col-span-5">
              <Field label="Description">
                <input
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                  value={newMenuDescription}
                  onChange={(e) => setNewMenuDescription(e.target.value)}
                  placeholder="Optional"
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/70">
          <div className="border-b border-black/10 p-5">
            <div className="text-sm font-semibold">Items</div>
            <div className="mt-1 text-xs text-slate-600">Current menu items.</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/70 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Available</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {menu.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-slate-600" colSpan={5}>
                      No items yet.
                    </td>
                  </tr>
                ) : (
                  menu.map((m) => (
                    <tr key={m.id} className="hover:bg-black/5">
                      <td className="px-5 py-3 font-semibold text-slate-900">{m.name}</td>
                      <td className="px-5 py-3 text-slate-600">{m.category || '-'}</td>
                      <td className="px-5 py-3 text-slate-900">{m.price}</td>
                      <td className="px-5 py-3 text-slate-600">{m.available ? 'Yes' : 'No'}</td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/15"
                          onClick={() => onDeleteMenuItem(m.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
              <div className="text-sm font-semibold">Tables / Functions</div>
              <div className="mt-1 text-xs text-slate-600">Set tables availability for each function type.</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm"
                onClick={() => refreshCapacities()}
                disabled={capLoading}
              >
                Refresh
              </button>
              <button
                type="button"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                onClick={onUpsertCapacity}
                disabled={capLoading}
              >
                Save
              </button>
            </div>
          </div>

          {capErr ? <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{capErr}</div> : null}
          {capMsg ? <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{capMsg}</div> : null}

          <div className="mt-5 grid gap-4 md:grid-cols-5">
            <Field label="Function type">
              <select
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={capType}
                onChange={(e) => setCapType(e.target.value)}
              >
                <option value="DINE_IN">DINE_IN</option>
                <option value="BIRTHDAY">BIRTHDAY</option>
                <option value="CORPORATE">CORPORATE</option>
              </select>
            </Field>
            <Field label="Tables available *">
              <input
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={capTables}
                onChange={(e) => setCapTables(e.target.value)}
                placeholder="10"
              />
            </Field>
            <Field label="Seats available">
              <input
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={capSeats}
                onChange={(e) => setCapSeats(e.target.value)}
                placeholder="50"
              />
            </Field>
            <Field label="Price">
              <input
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={capPrice}
                onChange={(e) => setCapPrice(e.target.value)}
                placeholder="Optional"
              />
            </Field>
            <Field label="Enabled">
              <select
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={String(capEnabled)}
                onChange={(e) => setCapEnabled(e.target.value === 'true')}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/70">
          <div className="border-b border-black/10 p-5">
            <div className="text-sm font-semibold">Configured capacities</div>
            <div className="mt-1 text-xs text-slate-600">Each function type can be configured once.</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/70 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Function</th>
                  <th className="px-5 py-3">Tables</th>
                  <th className="px-5 py-3">Seats</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Enabled</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {capacities.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-slate-600" colSpan={6}>
                      No capacities yet.
                    </td>
                  </tr>
                ) : (
                  capacities.map((c) => (
                    <tr key={c.id} className="hover:bg-black/5">
                      <td className="px-5 py-3 font-semibold text-slate-900">{c.functionType}</td>
                      <td className="px-5 py-3 text-slate-900">{c.tablesAvailable}</td>
                      <td className="px-5 py-3 text-slate-600">{c.seatsAvailable ?? '-'}</td>
                      <td className="px-5 py-3 text-slate-600">{c.price ?? '-'}</td>
                      <td className="px-5 py-3 text-slate-600">{c.enabled ? 'Yes' : 'No'}</td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/15"
                          onClick={() => onDeleteCapacity(c.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

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
                    >
                      Delete
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
            <button
              type="button"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              onClick={onCreateStaff}
              disabled={staffLoading || !canCreateStaff}
            >
              Create staff
            </button>
          </div>

          {staffErr ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{staffErr}</div> : null}
          {staffMsg ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{staffMsg}</div> : null}

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
              <input
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={newStaffGender}
                onChange={(e) => setNewStaffGender(e.target.value)}
              />
            </Field>
            <Field label="Marital status">
              <input
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                value={newStaffMaritalStatus}
                onChange={(e) => setNewStaffMaritalStatus(e.target.value)}
              />
            </Field>
          </div>

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

          <div className="mt-6 grid gap-4">
            <div className="text-xs font-semibold text-slate-600">Work experience (optional)</div>
            {newStaffWorkExperienceList.map((row, idx) => (
              <div key={idx} className="grid gap-4 rounded-2xl border border-black/10 bg-white/50 p-4 md:grid-cols-6">
                <Field label="Start date">
                  <input
                    className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                    value={row.startDate}
                    onChange={(e) => updateStaffWork(idx, 'startDate', e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                </Field>
                <Field label="End date">
                  <input
                    className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                    value={row.endDate}
                    onChange={(e) => updateStaffWork(idx, 'endDate', e.target.value)}
                    placeholder="YYYY-MM-DD"
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

          <div className="mt-4 text-xs text-slate-600">
            Credentials are sent to the staff email address.
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/70">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 p-5">
            <div>
              <div className="text-sm font-semibold">Staff list</div>
              <div className="mt-1 text-xs text-slate-600">Your cafe’s registered staff accounts.</div>
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
                {staff.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-slate-600" colSpan={7}>
                      No staff yet.
                    </td>
                  </tr>
                ) : (
                  staff.map((u) => (
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
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EDE4DA] text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Cafe Owner Dashboard</div>
            <h1 className="mt-1 text-3xl font-extrabold">Welcome, {session?.username || 'Owner'}</h1>
          </div>
          <div className="flex gap-3">
            <Link className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm" to="/">Home</Link>
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

        {hasCafe ? (
          <>
            <div className="mt-8 flex flex-wrap gap-2">
              <TabButton k="profile" label="Cafe Profile" />
              <TabButton k="staff" label="Staff" />
              <TabButton k="menu" label="Menu" />
              <TabButton k="capacities" label="Tables/Functions" />
              <TabButton k="images" label="Images" />
              <TabButton k="bookings" label="Bookings" />
              <TabButton k="orders" label="Orders" />
            </div>

            {tab === 'profile' ? (
              <ProfileSection
                cafe={cafe}
                setCafe={setCafe}
                cafeLoading={cafeLoading}
                cafeErr={cafeErr}
                cafeMsg={cafeMsg}
                canSaveCafe={canSaveCafe}
                refreshCafe={refreshCafe}
                onSaveCafe={onSaveCafe}
              />
            ) : null}
            {tab === 'staff' ? StaffSection() : null}
            {tab === 'menu' ? MenuSection() : null}
            {tab === 'capacities' ? CapacitiesSection() : null}
            {tab === 'images' ? ImagesSection() : null}
            {tab === 'bookings' ? PlaceholderSection({ title: 'Bookings', subtitle: 'View upcoming and past bookings.' }) : null}
            {tab === 'orders' ? PlaceholderSection({ title: 'Orders', subtitle: 'Track dine-in and takeaway orders.' }) : null}
          </>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap gap-2">
              <TabButton k="profile" label="Register Cafe" />
              <TabButton k="staff" label="Staff" disabled />
              <TabButton k="menu" label="Menu" disabled />
              <TabButton k="capacities" label="Tables/Functions" disabled />
              <TabButton k="images" label="Images" disabled />
              <TabButton k="bookings" label="Bookings" disabled />
              <TabButton k="orders" label="Orders" disabled />
            </div>

            <OnboardingSection
              cafe={cafe}
              setCafe={setCafe}
              cafeLoading={cafeLoading}
              cafeErr={cafeErr}
              cafeMsg={cafeMsg}
              canSaveCafe={canSaveCafe}
              refreshCafe={refreshCafe}
              onSaveCafe={onSaveCafe}
            />
          </>
        )}
      </div>
    </div>
  )
}
