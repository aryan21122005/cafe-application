import { useEffect, useState } from 'react'
import { getSession } from '../../lib/auth.js'
import { getMyProfile, updateMyProfile } from '../../lib/api.js'

function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      {children}
    </label>
  )
}

export default function ProfilePage({ titlePrefix }) {
  const session = getSession()
  const username = session?.username

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const [pd, setPd] = useState({ firstName: '', lastName: '', email: '', phone: '', contactNo: '', gender: '', maritalStatus: '' })
  const [addr, setAddr] = useState({ street: '', city: '', state: '', pincode: '' })
  const [academics, setAcademics] = useState([{ institutionName: '', degree: '', passingYear: '', grade: '', gradeInPercentage: '' }])
  const [work, setWork] = useState([
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

  async function load() {
    if (!username) return
    setErr('')
    setMsg('')
    setLoading(true)
    try {
      const res = await getMyProfile(username)
      const p = res?.personalDetails || {}
      const a = res?.address || {}
      const ac = Array.isArray(res?.academicInfoList) ? res.academicInfoList : []
      const we = Array.isArray(res?.workExperienceList) ? res.workExperienceList : []
      setPd({
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        email: p.email || '',
        phone: p.phone || '',
        contactNo: p.contactNo || '',
        gender: p.gender || '',
        maritalStatus: p.maritalStatus || ''
      })
      setAddr({
        street: a.street || '',
        city: a.city || '',
        state: a.state || '',
        pincode: a.pincode || ''
      })
      setAcademics(
        ac.length
          ? ac.map((x) => ({
              institutionName: x?.institutionName || '',
              degree: x?.degree || '',
              passingYear: x?.passingYear ?? '',
              grade: x?.grade || '',
              gradeInPercentage: x?.gradeInPercentage ?? ''
            }))
          : [{ institutionName: '', degree: '', passingYear: '', grade: '', gradeInPercentage: '' }]
      )
      setWork(
        we.length
          ? we.map((x) => ({
              startDate: x?.startDate || '',
              endDate: x?.endDate || '',
              currentlyWorking: !!x?.currentlyWorking,
              companyName: x?.companyName || '',
              designation: x?.designation || '',
              ctc: x?.ctc ?? '',
              reasonForLeaving: x?.reasonForLeaving || ''
            }))
          : [
              {
                startDate: '',
                endDate: '',
                currentlyWorking: false,
                companyName: '',
                designation: '',
                ctc: '',
                reasonForLeaving: ''
              }
            ]
      )
    } catch (e) {
      const d = e?.response?.data
      const m = typeof d === 'string' ? d : (d?.message || d?.error || null)
      setErr(m || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [username])

  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
      <div className="text-xs text-slate-500">{titlePrefix || (session?.role ? `${session.role} / Profile` : 'Profile')}</div>
      <div className="mt-1 text-2xl font-extrabold">Profile Management</div>

      {err ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}
      {msg ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{msg}</div> : null}
      {loading ? <div className="mt-4 text-sm text-slate-600">Loading...</div> : null}

      {!loading ? (
        <div className="mt-6 grid gap-6">
          <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
            <div className="text-sm font-semibold">Personal details</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="First name *">
                <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={pd.firstName} onChange={(e) => setPd((x) => ({ ...x, firstName: e.target.value }))} />
              </Field>
              <Field label="Last name *">
                <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={pd.lastName} onChange={(e) => setPd((x) => ({ ...x, lastName: e.target.value }))} />
              </Field>
              <Field label="Email *">
                <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={pd.email} onChange={(e) => setPd((x) => ({ ...x, email: e.target.value }))} />
              </Field>
              <Field label="Phone *">
                <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={pd.phone} onChange={(e) => setPd((x) => ({ ...x, phone: e.target.value }))} />
              </Field>
              <Field label="Contact no">
                <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={pd.contactNo} onChange={(e) => setPd((x) => ({ ...x, contactNo: e.target.value }))} />
              </Field>
              <Field label="Gender">
                <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={pd.gender} onChange={(e) => setPd((x) => ({ ...x, gender: e.target.value }))} />
              </Field>
              <Field label="Marital status">
                <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={pd.maritalStatus} onChange={(e) => setPd((x) => ({ ...x, maritalStatus: e.target.value }))} />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold">Academic details</div>
              <button
                type="button"
                className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs"
                onClick={() => setAcademics((x) => [...x, { institutionName: '', degree: '', passingYear: '', grade: '', gradeInPercentage: '' }])}
              >
                Add
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              {academics.map((row, idx) => (
                <div key={idx} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-600">Entry #{idx + 1}</div>
                    <button
                      type="button"
                      className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs disabled:opacity-60"
                      disabled={academics.length <= 1}
                      onClick={() => setAcademics((x) => x.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <Field label="Institution name">
                      <input
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                        value={row.institutionName}
                        onChange={(e) =>
                          setAcademics((x) => x.map((r, i) => (i === idx ? { ...r, institutionName: e.target.value } : r)))
                        }
                      />
                    </Field>
                    <Field label="Degree">
                      <input
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                        value={row.degree}
                        onChange={(e) => setAcademics((x) => x.map((r, i) => (i === idx ? { ...r, degree: e.target.value } : r)))}
                      />
                    </Field>
                    <Field label="Passing year">
                      <input
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                        value={row.passingYear}
                        onChange={(e) =>
                          setAcademics((x) => x.map((r, i) => (i === idx ? { ...r, passingYear: e.target.value } : r)))
                        }
                      />
                    </Field>
                    <Field label="Grade">
                      <input
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                        value={row.grade}
                        onChange={(e) => setAcademics((x) => x.map((r, i) => (i === idx ? { ...r, grade: e.target.value } : r)))}
                      />
                    </Field>
                    <Field label="Grade in percentage">
                      <input
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                        value={row.gradeInPercentage}
                        onChange={(e) =>
                          setAcademics((x) => x.map((r, i) => (i === idx ? { ...r, gradeInPercentage: e.target.value } : r)))
                        }
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold">Work experience</div>
              <button
                type="button"
                className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs"
                onClick={() =>
                  setWork((x) => [
                    ...x,
                    { startDate: '', endDate: '', currentlyWorking: false, companyName: '', designation: '', ctc: '', reasonForLeaving: '' }
                  ])
                }
              >
                Add
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              {work.map((row, idx) => (
                <div key={idx} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-600">Entry #{idx + 1}</div>
                    <button
                      type="button"
                      className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs disabled:opacity-60"
                      disabled={work.length <= 1}
                      onClick={() => setWork((x) => x.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <Field label="Company name">
                      <input
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                        value={row.companyName}
                        onChange={(e) => setWork((x) => x.map((r, i) => (i === idx ? { ...r, companyName: e.target.value } : r)))}
                      />
                    </Field>
                    <Field label="Designation">
                      <input
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                        value={row.designation}
                        onChange={(e) =>
                          setWork((x) => x.map((r, i) => (i === idx ? { ...r, designation: e.target.value } : r)))
                        }
                      />
                    </Field>
                    <Field label="Start date">
                      <input
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                        value={row.startDate}
                        onChange={(e) => setWork((x) => x.map((r, i) => (i === idx ? { ...r, startDate: e.target.value } : r)))}
                      />
                    </Field>
                    <Field label="End date">
                      <input
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                        value={row.endDate}
                        onChange={(e) => setWork((x) => x.map((r, i) => (i === idx ? { ...r, endDate: e.target.value } : r)))}
                      />
                    </Field>
                    <Field label="CTC">
                      <input
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                        value={row.ctc}
                        onChange={(e) => setWork((x) => x.map((r, i) => (i === idx ? { ...r, ctc: e.target.value } : r)))}
                      />
                    </Field>
                    <Field label="Reason for leaving">
                      <input
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                        value={row.reasonForLeaving}
                        onChange={(e) =>
                          setWork((x) => x.map((r, i) => (i === idx ? { ...r, reasonForLeaving: e.target.value } : r)))
                        }
                      />
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!row.currentlyWorking}
                        onChange={(e) => setWork((x) => x.map((r, i) => (i === idx ? { ...r, currentlyWorking: e.target.checked } : r)))}
                      />
                      Currently working
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
            <div className="text-sm font-semibold">Address</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Street *">
                <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={addr.street} onChange={(e) => setAddr((x) => ({ ...x, street: e.target.value }))} />
              </Field>
              <Field label="City *">
                <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={addr.city} onChange={(e) => setAddr((x) => ({ ...x, city: e.target.value }))} />
              </Field>
              <Field label="State *">
                <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={addr.state} onChange={(e) => setAddr((x) => ({ ...x, state: e.target.value }))} />
              </Field>
              <Field label="Pincode *">
                <input className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none" value={addr.pincode} onChange={(e) => setAddr((x) => ({ ...x, pincode: e.target.value }))} />
              </Field>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm" onClick={load} disabled={saving}>
              Reload
            </button>
            <button
              type="button"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              disabled={saving}
              onClick={async () => {
                if (!username) {
                  setErr('Session expired. Please login again.')
                  return
                }
                setErr('')
                setMsg('')
                setSaving(true)
                try {
                  const payload = {
                    personalDetails: pd,
                    address: addr,
                    academicInfoList: (academics || []).map((x) => ({
                      institutionName: x.institutionName,
                      degree: x.degree,
                      passingYear: x.passingYear === '' ? 0 : Number(x.passingYear),
                      grade: x.grade,
                      gradeInPercentage: x.gradeInPercentage === '' ? 0 : Number(x.gradeInPercentage)
                    })),
                    workExperienceList: (work || []).map((x) => ({
                      startDate: x.startDate,
                      endDate: x.endDate,
                      currentlyWorking: !!x.currentlyWorking,
                      companyName: x.companyName,
                      designation: x.designation,
                      ctc: x.ctc === '' ? 0 : Number(x.ctc),
                      reasonForLeaving: x.reasonForLeaving
                    }))
                  }
                  await updateMyProfile(username, payload)
                  setMsg('Saved')
                  await load()
                } catch (e) {
                  const d = e?.response?.data
                  const m = typeof d === 'string' ? d : (d?.message || d?.error || null)
                  setErr(m || 'Failed to save')
                } finally {
                  setSaving(false)
                }
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
