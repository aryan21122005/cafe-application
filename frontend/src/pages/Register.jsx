import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../lib/api.js'

function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <div className="text-sm text-slate-700">{label}</div>
      {children}
    </label>
  )
}

export default function Register() {
  const navigate = useNavigate()

  const steps = ['Role', 'Personal details', 'Address', 'Academic info', 'Work experience', 'Documents']
  const [step, setStep] = useState(0)
  const [role, setRole] = useState('CUSTOMER')
  const [documents, setDocuments] = useState([])

  const [personalDetails, setPersonalDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    contactNo: '',
    gender: '',
    maritalStatus: ''
  })

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: ''
  })

  const [academicInfoList, setAcademicInfoList] = useState([
    {
      institutionName: '',
      degree: '',
      passingYear: '',
      grade: '',
      gradeInPercentage: ''
    }
  ])

  const [workExperienceList, setWorkExperienceList] = useState([
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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canGoNext = useMemo(() => {
    if (step === 0) {
      return !!role
    }

    if (step === 1) {
      return (
        personalDetails.firstName.trim().length > 0 &&
        personalDetails.lastName.trim().length > 0 &&
        personalDetails.email.trim().length > 0 &&
        personalDetails.phone.trim().length > 0
      )
    }

    if (step === 2) {
      return (
        address.street.trim().length > 0 &&
        address.city.trim().length > 0 &&
        address.state.trim().length > 0 &&
        address.pincode.trim().length > 0
      )
    }

    if (step === 3) {
      return true
    }

    if (step === 4) {
      return true
    }

    if (step === 5) {
      return documents.length > 0
    }

    return false
  }, [step, role, personalDetails, address, documents.length])

  const canSubmit = useMemo(() => {
    return (
      role &&
      personalDetails.firstName.trim() &&
      personalDetails.lastName.trim() &&
      personalDetails.email.trim() &&
      personalDetails.phone.trim() &&
      address.street.trim() &&
      address.city.trim() &&
      address.state.trim() &&
      address.pincode.trim() &&
      documents.length > 0
    )
  }, [role, personalDetails, address, documents.length])

  function updateAcademic(idx, key, value) {
    setAcademicInfoList((prev) => prev.map((row, i) => (i === idx ? { ...row, [key]: value } : row)))
  }

  function addAcademic() {
    setAcademicInfoList((prev) => [
      ...prev,
      { institutionName: '', degree: '', passingYear: '', grade: '', gradeInPercentage: '' }
    ])
  }

  function removeAcademic(idx) {
    setAcademicInfoList((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateWork(idx, key, value) {
    setWorkExperienceList((prev) => prev.map((row, i) => (i === idx ? { ...row, [key]: value } : row)))
  }

  function addWork() {
    setWorkExperienceList((prev) => [
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

  function removeWork(idx) {
    setWorkExperienceList((prev) => prev.filter((_, i) => i !== idx))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!canSubmit) {
      setError('Please complete all steps before submitting.')
      return
    }

    setLoading(true)
    try {
      const cleanedAcademic = academicInfoList
        .map((a) => ({
          institutionName: a.institutionName.trim(),
          degree: a.degree.trim(),
          passingYear: a.passingYear === '' ? 0 : Number(a.passingYear),
          grade: a.grade.trim(),
          gradeInPercentage: a.gradeInPercentage === '' ? 0 : Number(a.gradeInPercentage)
        }))
        .filter((a) => a.institutionName || a.degree || a.passingYear || a.grade || a.gradeInPercentage)

      const cleanedWork = workExperienceList
        .map((w) => ({
          startDate: w.startDate.trim(),
          endDate: w.endDate.trim(),
          currentlyWorking: !!w.currentlyWorking,
          companyName: w.companyName.trim(),
          designation: w.designation.trim(),
          ctc: w.ctc === '' ? 0 : Number(w.ctc),
          reasonForLeaving: w.reasonForLeaving.trim()
        }))
        .filter((w) => w.startDate || w.endDate || w.companyName || w.designation || w.ctc || w.reasonForLeaving)

      const msg = await registerUser(
        {
          role,
          personalDetails: {
            firstName: personalDetails.firstName.trim(),
            lastName: personalDetails.lastName.trim(),
            email: personalDetails.email.trim(),
            phone: personalDetails.phone.trim(),
            contactNo: personalDetails.contactNo.trim(),
            gender: personalDetails.gender.trim(),
            maritalStatus: personalDetails.maritalStatus.trim()
          },
          address: {
            street: address.street.trim(),
            city: address.city.trim(),
            state: address.state.trim(),
            pincode: address.pincode.trim()
          },
          academicInfoList: cleanedAcademic,
          workExperienceList: cleanedWork
        },
        documents
      )
      setSuccess(typeof msg === 'string' ? msg : 'Registration successful')
      setTimeout(() => navigate('/login'), 800)
    } catch (err) {
      console.error('Registration error:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data
      })
      const apiMsg = err?.response?.data
      if (typeof apiMsg === 'string' && apiMsg.trim()) {
        setError(apiMsg)
      } else if (apiMsg && typeof apiMsg === 'object') {
        const msg = apiMsg.message || apiMsg.error || apiMsg.details
        if (typeof msg === 'string' && msg.trim()) {
          setError(msg)
        } else {
          setError('Registration failed')
        }
      } else {
        setError('Registration failed')
      }
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

        <h2 className="mt-4 text-3xl font-extrabold text-slate-900">Create your account</h2>
        <p className="mt-2 text-sm text-slate-600">Register to start using Digital Cafe.</p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-4 rounded-2xl border border-black/10 bg-white/70 p-6">
          <div className="grid gap-2">
            <div className="text-sm font-semibold text-slate-900">Step {step + 1} of {steps.length}</div>
            <div className="text-xs text-slate-600">{steps[step]}</div>
            <div className="h-2 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${Math.round(((step + 1) / steps.length) * 100)}%` }}
              />
            </div>
          </div>

          {step === 0 ? (
            <>
              <Field label="Select Role">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={
                      role === 'CUSTOMER'
                        ? 'rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white'
                        : 'rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50'
                    }
                  >
                    Customer
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('OWNER')}
                    className={
                      role === 'OWNER'
                        ? 'rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white'
                        : 'rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50'
                    }
                  >
                    Cafe Owner
                  </button>
                </div>
              </Field>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Field label="First name">
                <input
                  value={personalDetails.firstName}
                  onChange={(e) => setPersonalDetails((p) => ({ ...p, firstName: e.target.value }))}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  placeholder="First name"
                />
              </Field>

              <Field label="Last name">
                <input
                  value={personalDetails.lastName}
                  onChange={(e) => setPersonalDetails((p) => ({ ...p, lastName: e.target.value }))}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  placeholder="Last name"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={personalDetails.email}
                  onChange={(e) => setPersonalDetails((p) => ({ ...p, email: e.target.value }))}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  placeholder="you@example.com"
                />
              </Field>

              <Field label="Phone">
                <input
                  value={personalDetails.phone}
                  onChange={(e) => setPersonalDetails((p) => ({ ...p, phone: e.target.value }))}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  placeholder="Phone"
                />
              </Field>

              <Field label="Contact no">
                <input
                  value={personalDetails.contactNo}
                  onChange={(e) => setPersonalDetails((p) => ({ ...p, contactNo: e.target.value }))}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  placeholder="Contact number"
                />
              </Field>

              <Field label="Gender">
                <select
                  value={personalDetails.gender}
                  onChange={(e) => setPersonalDetails((p) => ({ ...p, gender: e.target.value }))}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </Field>

              <Field label="Marital status">
                <select
                  value={personalDetails.maritalStatus}
                  onChange={(e) => setPersonalDetails((p) => ({ ...p, maritalStatus: e.target.value }))}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                >
                  <option value="">Select status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </Field>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Field label="Street">
                <input
                  value={address.street}
                  onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  placeholder="Street"
                />
              </Field>

              <Field label="City">
                <input
                  value={address.city}
                  onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  placeholder="City"
                />
              </Field>

              <Field label="State">
                <input
                  value={address.state}
                  onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  placeholder="State"
                />
              </Field>

              <Field label="Pincode">
                <input
                  value={address.pincode}
                  onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value }))}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  placeholder="Pincode"
                />
              </Field>
            </>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-3">
              {academicInfoList.map((row, idx) => (
                <div key={idx} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                  <div className="grid gap-3">
                    <Field label="Institution name">
                      <input
                        value={row.institutionName}
                        onChange={(e) => updateAcademic(idx, 'institutionName', e.target.value)}
                        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </Field>
                    <Field label="Degree">
                      <input
                        value={row.degree}
                        onChange={(e) => updateAcademic(idx, 'degree', e.target.value)}
                        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </Field>
                    <Field label="Passing year">
                      <input
                        type="number"
                        value={row.passingYear}
                        onChange={(e) => updateAcademic(idx, 'passingYear', e.target.value)}
                        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </Field>
                    <Field label="Grade">
                      <input
                        value={row.grade}
                        onChange={(e) => updateAcademic(idx, 'grade', e.target.value)}
                        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </Field>
                    <Field label="Grade in percentage">
                      <input
                        type="number"
                        step="0.01"
                        value={row.gradeInPercentage}
                        onChange={(e) => updateAcademic(idx, 'gradeInPercentage', e.target.value)}
                        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </Field>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <button type="button" onClick={addAcademic} className="text-sm font-semibold text-emerald-700 hover:text-emerald-600">
                      + Add another
                    </button>
                    <button
                      type="button"
                      disabled={academicInfoList.length === 1}
                      onClick={() => removeAcademic(idx)}
                      className="text-sm font-semibold text-red-700 hover:text-red-600 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="grid gap-3">
              {workExperienceList.map((row, idx) => (
                <div key={idx} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                  <div className="grid gap-3">
                    <Field label="Company name">
                      <input
                        value={row.companyName}
                        onChange={(e) => updateWork(idx, 'companyName', e.target.value)}
                        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </Field>
                    <Field label="Designation">
                      <input
                        value={row.designation}
                        onChange={(e) => updateWork(idx, 'designation', e.target.value)}
                        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </Field>
                    <Field label="Start date">
                      <input
                        type="date"
                        value={row.startDate}
                        onChange={(e) => updateWork(idx, 'startDate', e.target.value)}
                        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </Field>
                    <Field label="End date">
                      <input
                        type="date"
                        value={row.endDate}
                        onChange={(e) => updateWork(idx, 'endDate', e.target.value)}
                        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!row.currentlyWorking}
                        onChange={(e) => updateWork(idx, 'currentlyWorking', e.target.checked)}
                        className="h-4 w-4"
                      />
                      Currently working
                    </label>
                    <Field label="CTC">
                      <input
                        type="number"
                        step="0.01"
                        value={row.ctc}
                        onChange={(e) => updateWork(idx, 'ctc', e.target.value)}
                        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </Field>
                    <Field label="Reason for leaving">
                      <input
                        value={row.reasonForLeaving}
                        onChange={(e) => updateWork(idx, 'reasonForLeaving', e.target.value)}
                        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </Field>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <button type="button" onClick={addWork} className="text-sm font-semibold text-emerald-700 hover:text-emerald-600">
                      + Add another
                    </button>
                    <button
                      type="button"
                      disabled={workExperienceList.length === 1}
                      onClick={() => removeWork(idx)}
                      className="text-sm font-semibold text-red-700 hover:text-red-600 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {step === 5 ? (
            <Field label="Documents (required)">
              <input
                type="file"
                multiple
                onChange={(e) => setDocuments(Array.from(e.target.files || []))}
                className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-700 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-900 hover:file:bg-slate-200"
              />
              <div className="text-xs text-slate-500">Upload PDF/images like ID proof (Aadhar/PAN).</div>
            </Field>
          ) : null}

          {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
          {success ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{success}</div> : null}

          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={loading || step === 0}
              onClick={() => {
                setError('')
                setSuccess('')
                setStep((s) => Math.max(0, s - 1))
              }}
              className="rounded-xl border border-black/10 bg-white/5 px-4 py-3 text-sm font-semibold text-black/70 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                disabled={loading || !canGoNext}
                onClick={() => {
                  setError('')
                  setSuccess('')
                  if (!canGoNext) {
                    setError('Please complete this step to continue.')
                    return
                  }
                  setStep((s) => Math.min(steps.length - 1, s + 1))
                }}
                className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            ) : (
              <button
                disabled={loading || !canSubmit}
                className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
              >
                {loading ? 'Creating...' : 'Register'}
              </button>
            )}
          </div>

          <div className="text-sm text-gray-300">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-300 hover:text-emerald-200">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
