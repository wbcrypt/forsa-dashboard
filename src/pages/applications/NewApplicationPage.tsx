import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { applicationsApi, universitiesApi, studentsApi } from '../../lib/api'
import { Card, Alert, FormField, LoadingSpinner } from '../../components/ui'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useToastContext } from '../../context/ToastContext'

interface FormData {
  studentId: string; universityId: string; programId: string
  tuitionAmount: string; requestedSupportAmount: string
  currency: string; academicYear: string; isRenewal: boolean
}

function validate(form: FormData): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.studentId) errors.studentId = 'Please select a student'
  if (!form.universityId) errors.universityId = 'Please select a university'
  if (!form.tuitionAmount || parseFloat(form.tuitionAmount) <= 0) errors.tuitionAmount = 'Enter a valid tuition amount'
  if (!form.academicYear || !/^\d{4}-\d{4}$/.test(form.academicYear)) errors.academicYear = 'Use format YYYY-YYYY (e.g. 2026-2027)'
  if (form.requestedSupportAmount && parseFloat(form.requestedSupportAmount) > parseFloat(form.tuitionAmount)) {
    errors.requestedSupportAmount = 'Support amount cannot exceed tuition'
  }
  return errors
}

export default function NewApplicationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToastContext()
  const [form, setForm] = useState<FormData>({
    studentId: searchParams.get('studentId') || '',
    universityId: '', programId: '', tuitionAmount: '',
    requestedSupportAmount: '', currency: 'TND',
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    isRenewal: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-dropdown'],
    queryFn: () => studentsApi.list({ limit: 200 }).then(r => r.data.data || []),
  })

  const { data: universities, isLoading: unisLoading } = useQuery({
    queryKey: ['universities-dropdown'],
    queryFn: () => universitiesApi.list({ limit: 200, status: 'active' }).then(r => r.data.data || []),
  })

  const { data: programs } = useQuery({
    queryKey: ['programs-dropdown', form.universityId],
    queryFn: () => universitiesApi.getPrograms(form.universityId).then(r => r.data),
    enabled: !!form.universityId,
  })

  const mutation = useMutation({
    mutationFn: (data: unknown) => applicationsApi.create(data),
    onSuccess: (res) => {
      toast('Application created successfully', 'success')
      navigate(`/applications/${res.data.id}`)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setServerError(e?.response?.data?.message || 'Failed to create application. Please try again.')
    },
  })

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setForm(f => ({ ...f, [field]: value }))
    if (field in errors) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setServerError('')
    mutation.mutate({
      studentId: form.studentId,
      universityId: form.universityId,
      programId: form.programId || undefined,
      tuitionAmount: parseFloat(form.tuitionAmount),
      requestedSupportAmount: form.requestedSupportAmount ? parseFloat(form.requestedSupportAmount) : parseFloat(form.tuitionAmount),
      currency: form.currency,
      academicYear: form.academicYear,
      isRenewal: form.isRenewal,
    })
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={16} className="text-gray-500" />
        </button>
        <div>
          <h1 className="page-title">New Application</h1>
          <p className="text-sm text-gray-500">Create a new financing application</p>
        </div>
      </div>

      {serverError && <Alert type="error" message={serverError} onClose={() => setServerError('')} />}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Student & University</h3>
          <div className="space-y-4">
            <FormField label="Student" required error={errors.studentId}>
              {studentsLoading
                ? <div className="input flex items-center gap-2 text-gray-400"><LoadingSpinner className="h-4" /> Loading students...</div>
                : (
                  <select className="input" value={form.studentId} onChange={set('studentId')}>
                    <option value="">Select a student...</option>
                    {(students || []).map((s: Record<string, unknown>) => (
                      <option key={s.id as string} value={s.id as string}>
                        {s.first_name as string} {s.last_name as string} — {s.email as string}
                      </option>
                    ))}
                  </select>
                )
              }
            </FormField>
            <FormField label="University" required error={errors.universityId}>
              {unisLoading
                ? <div className="input flex items-center gap-2 text-gray-400"><LoadingSpinner className="h-4" /> Loading universities...</div>
                : (
                  <select className="input" value={form.universityId} onChange={e => {
                    setForm(f => ({ ...f, universityId: e.target.value, programId: '' }))
                    setErrors(prev => { const n = { ...prev }; delete n.universityId; return n })
                  }}>
                    <option value="">Select a university...</option>
                    {(universities || []).map((u: Record<string, unknown>) => (
                      <option key={u.id as string} value={u.id as string}>{u.name as string}</option>
                    ))}
                  </select>
                )
              }
            </FormField>
            {form.universityId && (
              <FormField label="Program" hint="Optional — required before pipeline can pass Stage 1">
                <select className="input" value={form.programId} onChange={set('programId')}>
                  <option value="">Select a program (optional)</option>
                  {(programs || []).map((p: Record<string, unknown>) => (
                    <option key={p.id as string} value={p.id as string}>
                      {p.name as string} — {p.level as string} ({p.duration_years as string}yr)
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Financing Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tuition Amount (TND)" required error={errors.tuitionAmount}>
              <input type="number" className="input" value={form.tuitionAmount} onChange={set('tuitionAmount')}
                placeholder="3500" min="100" max="100000" step="50" />
            </FormField>
            <FormField label="Requested Support" error={errors.requestedSupportAmount}
              hint="Leave blank to default to tuition amount">
              <input type="number" className="input" value={form.requestedSupportAmount} onChange={set('requestedSupportAmount')}
                placeholder="Same as tuition" min="0" step="50" />
            </FormField>
            <FormField label="Currency">
              <select className="input" value={form.currency} onChange={set('currency')}>
                <option value="TND">TND — Tunisian Dinar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — US Dollar</option>
              </select>
            </FormField>
            <FormField label="Academic Year" required error={errors.academicYear} hint="Format: YYYY-YYYY">
              <input className="input" value={form.academicYear} onChange={set('academicYear')} placeholder="2026-2027" />
            </FormField>
          </div>
          <div className="mt-4 flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
            <input type="checkbox" id="renewal" checked={form.isRenewal}
              onChange={e => setForm(f => ({ ...f, isRenewal: e.target.checked }))} className="rounded" />
            <label htmlFor="renewal" className="text-sm text-gray-700">
              This is a renewal application (existing FORSA student continuing studies)
            </label>
          </div>
        </Card>

        <div className="flex gap-3 justify-end pb-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Creating...</>
              : 'Create Application'
            }
          </button>
        </div>
      </form>
    </div>
  )
}
