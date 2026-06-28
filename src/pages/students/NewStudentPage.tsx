import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { studentsApi } from '../../lib/api'
import { Card, Alert, FormField } from '../../components/ui'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useToastContext } from '../../context/ToastContext'

interface FormData {
  firstName: string; lastName: string; email: string; phonePrimary: string
  dateOfBirth: string; gender: string; nationality: string; nationalId: string
  city: string; governorate: string; academicLevel: string; bacYear: string
  bacMention: string; employmentStatus: string
}

const initialForm: FormData = {
  firstName: '', lastName: '', email: '', phonePrimary: '',
  dateOfBirth: '', gender: '', nationality: 'TN', nationalId: '',
  city: '', governorate: '', academicLevel: '', bacYear: '',
  bacMention: '', employmentStatus: ''
}

function validate(form: FormData): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.firstName.trim()) errors.firstName = 'First name is required'
  if (!form.lastName.trim()) errors.lastName = 'Last name is required'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email'
  if (form.phonePrimary && !/^\+?[\d\s\-]{8,15}$/.test(form.phonePrimary)) errors.phonePrimary = 'Invalid phone number'
  if (form.dateOfBirth) {
    const age = (Date.now() - new Date(form.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)
    if (age < 15 || age > 60) errors.dateOfBirth = 'Date of birth seems incorrect'
  }
  return errors
}

export default function NewStudentPage() {
  const navigate = useNavigate()
  const { toast } = useToastContext()
  const [form, setForm] = useState<FormData>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')

  const mutation = useMutation({
    mutationFn: (data: unknown) => studentsApi.create(data),
    onSuccess: (res) => {
      toast('Student created successfully', 'success')
      navigate(`/students/${res.data.id}`)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setServerError(e?.response?.data?.message || 'Failed to create student. Please try again.')
    },
  })

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setServerError('')
    mutation.mutate(form)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={16} className="text-gray-500" />
        </button>
        <div>
          <h1 className="page-title">New Student</h1>
          <p className="text-sm text-gray-500">Add a new student to FORSA OS</p>
        </div>
      </div>

      {serverError && <Alert type="error" message={serverError} onClose={() => setServerError('')} />}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" required error={errors.firstName}>
              <input className="input" value={form.firstName} onChange={set('firstName')} placeholder="Mohamed Ali" />
            </FormField>
            <FormField label="Last Name" required error={errors.lastName}>
              <input className="input" value={form.lastName} onChange={set('lastName')} placeholder="Ben Salah" />
            </FormField>
            <FormField label="Date of Birth" error={errors.dateOfBirth}>
              <input type="date" className="input" value={form.dateOfBirth} onChange={set('dateOfBirth')} max={new Date().toISOString().split('T')[0]} />
            </FormField>
            <FormField label="Gender">
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="">Select gender</option>
                <option value="male">Male / Homme / ذكر</option>
                <option value="female">Female / Femme / أنثى</option>
              </select>
            </FormField>
            <FormField label="Nationality" hint="ISO country code e.g. TN, FR">
              <input className="input uppercase" value={form.nationality} onChange={set('nationality')} placeholder="TN" maxLength={2} />
            </FormField>
            <FormField label="National ID" error={errors.nationalId}>
              <input className="input" value={form.nationalId} onChange={set('nationalId')} placeholder="12345678" />
            </FormField>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" error={errors.email}>
              <input type="email" className="input" value={form.email} onChange={set('email')} placeholder="student@email.com" />
            </FormField>
            <FormField label="Phone" error={errors.phonePrimary} hint="+216 XX XXX XXX">
              <input className="input" value={form.phonePrimary} onChange={set('phonePrimary')} placeholder="+21620123456" />
            </FormField>
            <FormField label="City">
              <input className="input" value={form.city} onChange={set('city')} placeholder="Tunis" />
            </FormField>
            <FormField label="Governorate">
              <select className="input" value={form.governorate} onChange={set('governorate')}>
                <option value="">Select governorate</option>
                {['Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte', 'Béja', 'Jendouba', 'Kef', 'Siliana', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Sousse', 'Monastir', 'Mahdia', 'Sfax', 'Gafsa', 'Tozeur', 'Kebili', 'Gabès', 'Médenine', 'Tataouine'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </FormField>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Academic Background</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Academic Level">
              <select className="input" value={form.academicLevel} onChange={set('academicLevel')}>
                <option value="">Select level</option>
                <option value="terminale">Terminale (Bac)</option>
                <option value="licence_1">Licence 1</option>
                <option value="licence_2">Licence 2</option>
                <option value="licence_3">Licence 3</option>
                <option value="master_1">Master 1</option>
                <option value="master_2">Master 2</option>
                <option value="ingenieur">Ingénieur</option>
                <option value="doctorat">Doctorat</option>
              </select>
            </FormField>
            <FormField label="Bac Year">
              <input type="number" className="input" value={form.bacYear} onChange={set('bacYear')} placeholder="2024" min="2000" max={new Date().getFullYear()} />
            </FormField>
            <FormField label="Bac Mention">
              <select className="input" value={form.bacMention} onChange={set('bacMention')}>
                <option value="">Select mention</option>
                <option value="passable">Passable (10–12)</option>
                <option value="assez_bien">Assez Bien (12–14)</option>
                <option value="bien">Bien (14–16)</option>
                <option value="tres_bien">Très Bien (16+)</option>
              </select>
            </FormField>
            <FormField label="Employment Status">
              <select className="input" value={form.employmentStatus} onChange={set('employmentStatus')}>
                <option value="">Select status</option>
                <option value="student">Full-time Student</option>
                <option value="employed">Employed</option>
                <option value="self_employed">Self-employed</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </FormField>
          </div>
        </Card>

        <div className="flex gap-3 justify-end pb-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Creating...</>
              : 'Create Student'
            }
          </button>
        </div>
      </form>
    </div>
  )
}
