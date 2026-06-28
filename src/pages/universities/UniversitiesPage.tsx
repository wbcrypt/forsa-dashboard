import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { universitiesApi } from '../../lib/api'
import { Card, Badge, Table, Pagination, EmptyState, ErrorState, Modal, FormField, Alert } from '../../components/ui'
import { Plus, Search, Building2, X, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToastContext } from '../../context/ToastContext'

interface UniversityForm {
  name: string; shortName: string; countryCode: string; city: string
  website: string; status: string; riskLevel: string; accreditationStatus: string; isFoundingPartner: boolean
}

const initialForm: UniversityForm = {
  name: '', shortName: '', countryCode: 'TN', city: '',
  website: '', status: 'active', riskLevel: 'low', accreditationStatus: '', isFoundingPartner: false
}

function validate(form: UniversityForm): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.name.trim()) errors.name = 'University name is required'
  if (!form.city.trim()) errors.city = 'City is required'
  if (form.website && !/^https?:\/\/.+/.test(form.website)) errors.website = 'Must start with http:// or https://'
  return errors
}

export default function UniversitiesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<UniversityForm>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const { hasPermission } = useAuth()
  const { toast } = useToastContext()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['universities', page, search],
    queryFn: () => universitiesApi.list({ page, limit: 20, search: search || undefined }).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: unknown) => universitiesApi.create(data),
    onSuccess: (res) => {
      toast('University added successfully', 'success')
      qc.invalidateQueries({ queryKey: ['universities'] })
      setShowModal(false)
      setForm(initialForm)
      navigate(`/universities/${res.data.id}`)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setServerError(e?.response?.data?.message || 'Failed to create university')
    },
  })

  const set = (field: keyof UniversityForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const handleSubmit = () => {
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setServerError('')
    createMutation.mutate(form)
  }

  const universities = data?.data || []
  const meta = data?.meta || {}

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Universities</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total?.toLocaleString() || 0} partner universities</p>
        </div>
        {hasPermission('university.create') && (
          <button onClick={() => { setShowModal(true); setErrors({}); setServerError('') }} className="btn-primary">
            <Plus size={15} /> Add University
          </button>
        )}
      </div>

      {isError && <ErrorState onRetry={refetch} />}

      <Card padding={false}>
        <div className="flex items-center gap-3 p-4 border-b border-gray-50">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search universities..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} className="input pl-9 text-sm" />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {!isError && (
          <Table headers={['University', 'City', 'Status', 'Risk Level', 'Accreditation']} loading={isLoading}>
            {universities.map((u: Record<string, unknown>) => (
              <tr key={u.id as string} className="table-row">
                <td className="table-td pl-5">
                  <Link to={`/universities/${u.id}`} className="block hover:opacity-80">
                    <p className="text-sm font-medium text-gray-900">{u.name as string}</p>
                    <p className="text-xs text-gray-400">{u.short_name as string} · {u.country_code as string}</p>
                  </Link>
                </td>
                <td className="table-td text-gray-500">{(u.city as string) || '—'}</td>
                <td className="table-td"><Badge status={u.status as string} /></td>
                <td className="table-td">
                  <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${
                    u.risk_level === 'low' ? 'bg-green-50 text-green-700' :
                    u.risk_level === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                    u.risk_level === 'elevated' ? 'bg-orange-50 text-orange-700' :
                    u.risk_level === 'high' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>{(u.risk_level as string) || 'unknown'}</span>
                </td>
                <td className="table-td pr-5">
                  {u.accreditation_status
                    ? <Badge status={u.accreditation_status as string} />
                    : <span className="text-xs text-gray-300">Not set</span>
                  }
                </td>
              </tr>
            ))}
          </Table>
        )}

        {!isLoading && !isError && universities.length === 0 && (
          <EmptyState icon={Building2} title="No universities yet"
            description="Add partner universities to enable applications."
            action={hasPermission('university.create')
              ? <button onClick={() => setShowModal(true)} className="btn-primary text-sm">Add university</button>
              : undefined} />
        )}
        <Pagination page={page} totalPages={meta.totalPages || 1} onPageChange={setPage} total={meta.total || 0} />
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add University" size="lg">
        {serverError && <Alert type="error" message={serverError} />}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="University Name" required error={errors.name}>
              <input className="input" value={form.name} onChange={set('name')} placeholder="Université de Tunis El Manar" />
            </FormField>
          </div>
          <FormField label="Short Name / Acronym">
            <input className="input" value={form.shortName} onChange={set('shortName')} placeholder="UTM" />
          </FormField>
          <FormField label="Country Code" hint="ISO 2-letter code">
            <input className="input uppercase" value={form.countryCode} onChange={set('countryCode')} maxLength={2} placeholder="TN" />
          </FormField>
          <FormField label="City" required error={errors.city}>
            <input className="input" value={form.city} onChange={set('city')} placeholder="Tunis" />
          </FormField>
          <FormField label="Website" error={errors.website}>
            <input className="input" value={form.website} onChange={set('website')} placeholder="https://utm.tn" />
          </FormField>
          <FormField label="Status">
            <select className="input" value={form.status} onChange={set('status')}>
              <option value="active">Active</option>
              <option value="prospect">Prospect</option>
              <option value="suspended">Suspended</option>
            </select>
          </FormField>
          <FormField label="Risk Level">
            <select className="input" value={form.riskLevel} onChange={set('riskLevel')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="elevated">Elevated</option>
              <option value="high">High</option>
            </select>
          </FormField>
          <div className="col-span-2">
            <FormField label="Accreditation Status">
              <select className="input" value={form.accreditationStatus} onChange={set('accreditationStatus')}>
                <option value="">Not specified</option>
                <option value="accredited">Accredited</option>
                <option value="provisional">Provisional Accreditation</option>
                <option value="pending">Pending Review</option>
                <option value="not_accredited">Not Accredited</option>
              </select>
            </FormField>
          </div>
        </div>
        {/* Founding Partner */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl mt-4">
          <input type="checkbox" id="uni-founding" checked={form.isFoundingPartner}
            onChange={e => setForm(f => ({ ...f, isFoundingPartner: e.target.checked }))}
            className="rounded mt-0.5" />
          <label htmlFor="uni-founding" className="cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-800">⭐ Founding Partner University</span>
            </div>
            <p className="text-xs text-amber-700 mt-0.5">
              Founding partner universities receive priority in the matching algorithm, featured placement in the student portal,
              and co-branded marketing materials.
            </p>
          </label>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={createMutation.isPending} className="btn-primary">
            {createMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : 'Add University'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
