import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { partnersApi } from '../../lib/api'
import { Card, Badge, Table, Pagination, EmptyState, ErrorState, Modal, FormField, Alert, Tabs } from '../../components/ui'
import { Plus, Search, Briefcase, X, Loader2, Star } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToastContext } from '../../context/ToastContext'
import { format } from 'date-fns'

interface PartnerForm {
  name: string; type: string; countryCode: string; website: string
  isFoundingPartner: boolean; notes: string
}

const initialForm: PartnerForm = {
  name: '', type: 'platform', countryCode: 'TN',
  website: '', isFoundingPartner: false, notes: ''
}

function validate(form: PartnerForm): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.name.trim()) errors.name = 'Partner name is required'
  if (form.website && !/^https?:\/\/.+/.test(form.website)) errors.website = 'Must start with https://'
  return errors
}

export default function PartnersPage() {
  const [tab, setTab] = useState('partners')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<PartnerForm>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const { hasPermission } = useAuth()
  const { toast } = useToastContext()
  const qc = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['partners', page, search],
    queryFn: () => partnersApi.list({ page, limit: 20 }).then(r => r.data),
    enabled: tab === 'partners',
  })

  const { data: commissionsData, isLoading: commLoading, isError: commError } = useQuery({
    queryKey: ['commissions'],
    queryFn: () => partnersApi.getCommissions().then(r => r.data),
    enabled: tab === 'commissions',
  })

  const createMutation = useMutation({
    mutationFn: (data: unknown) => partnersApi.create(data),
    onSuccess: () => {
      toast('Partner added successfully', 'success')
      qc.invalidateQueries({ queryKey: ['partners'] })
      setShowModal(false)
      setForm(initialForm)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setServerError(e?.response?.data?.message || 'Failed to create partner')
    },
  })

  const set = (field: keyof PartnerForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const handleSubmit = () => {
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setServerError('')
    createMutation.mutate(form)
  }

  const partners = data?.data || []
  const meta = data?.meta || {}
  const commissions = Array.isArray(commissionsData) ? commissionsData : (commissionsData?.data || [])

  const foundingPartners = partners.filter((p: Record<string, unknown>) => p.is_founding_partner)
  const regularPartners = partners.filter((p: Record<string, unknown>) => !p.is_founding_partner)

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Partners & Referrals</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total || 0} referral partners</p>
        </div>
        {hasPermission('partner.create') && (
          <button onClick={() => { setShowModal(true); setErrors({}); setServerError('') }} className="btn-primary">
            <Plus size={15} /> Add Partner
          </button>
        )}
      </div>

      {isError && tab === 'partners' && <ErrorState onRetry={refetch} />}

      <Card padding={false}>
        <Tabs
          tabs={[
            { id: 'partners', label: 'All Partners', count: meta.total },
            { id: 'founding', label: 'Founding Partners', count: foundingPartners.length },
            { id: 'commissions', label: 'Commissions' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* Partners list */}
        {(tab === 'partners' || tab === 'founding') && (
          <>
            <div className="flex items-center gap-3 p-4 border-b border-gray-50">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search partners..." value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }} className="input pl-9 text-sm" />
                {search && (
                  <button onClick={() => { setSearch(''); setPage(1) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Founding partners banner */}
            {tab === 'founding' && foundingPartners.length > 0 && (
              <div className="mx-5 mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={15} className="text-amber-500 fill-amber-500" />
                  <p className="text-sm font-semibold text-amber-800">Founding Partners</p>
                </div>
                <p className="text-xs text-amber-700">
                  Founding partners receive preferential commission rates and early access to new features.
                  They are displayed prominently in the partner portal.
                </p>
              </div>
            )}

            <Table
              headers={['Partner', 'Type', 'Country', 'Referrals', 'Accepted', 'Total Earned', 'Status']}
              loading={isLoading}
            >
              {(tab === 'founding' ? foundingPartners : partners).map((p: Record<string, unknown>) => (
                <tr key={p.id as string} className="table-row">
                  <td className="table-td pl-5">
                    <div className="flex items-center gap-2">
                      {p.is_founding_partner && (
                        <Star size={13} className="text-amber-400 fill-amber-400 flex-shrink-0" title="Founding Partner" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name as string}</p>
                        {p.website && <p className="text-xs text-gray-400 truncate max-w-32">{p.website as string}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="text-xs capitalize text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">
                      {(p.type as string) || '—'}
                    </span>
                  </td>
                  <td className="table-td text-gray-500 text-sm">{p.country_code as string}</td>
                  <td className="table-td text-gray-700">{(p.total_referrals as number) || 0}</td>
                  <td className="table-td text-gray-700">{(p.accepted as number) || 0}</td>
                  <td className="table-td">
                    <span className="text-sm font-semibold text-teal-700">
                      {parseFloat((p.total_earned as string) || '0').toLocaleString()} TND
                    </span>
                  </td>
                  <td className="table-td pr-5"><Badge status={p.status as string} /></td>
                </tr>
              ))}
            </Table>

            {!isLoading && !isError && (tab === 'founding' ? foundingPartners : partners).length === 0 && (
              <EmptyState
                icon={tab === 'founding' ? Star : Briefcase}
                title={tab === 'founding' ? 'No founding partners' : 'No partners yet'}
                description={tab === 'founding'
                  ? 'Mark a partner as a Founding Partner when adding them.'
                  : 'Add referral partners to track commissions and leads.'}
                action={hasPermission('partner.create')
                  ? <button onClick={() => setShowModal(true)} className="btn-primary text-sm">Add partner</button>
                  : undefined}
              />
            )}

            {tab === 'partners' && (
              <Pagination page={page} totalPages={meta.totalPages || 1} onPageChange={setPage} total={meta.total || 0} />
            )}
          </>
        )}

        {/* Commissions */}
        {tab === 'commissions' && (
          <div className="p-5">
            {commLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={24} className="animate-spin text-navy-800" />
              </div>
            ) : commError ? (
              <ErrorState message="Could not load commissions" />
            ) : commissions.length === 0 ? (
              <EmptyState icon={Briefcase} title="No commissions yet"
                description="Commissions are created automatically when partners refer students whose applications are approved." />
            ) : (
              <Table headers={['Partner', 'Student', 'Amount', 'Status', 'Created']} loading={false}>
                {commissions.map((c: Record<string, unknown>) => (
                  <tr key={c.id as string} className="table-row">
                    <td className="table-td pl-5 text-sm font-medium text-gray-900">{(c.partner_name as string) || '—'}</td>
                    <td className="table-td text-sm text-gray-600">
                      {c.student_first_name as string} {c.student_last_name as string}
                    </td>
                    <td className="table-td">
                      <span className="text-sm font-semibold text-teal-700">
                        {parseFloat((c.amount as string) || '0').toLocaleString()} TND
                      </span>
                    </td>
                    <td className="table-td"><Badge status={c.status as string} /></td>
                    <td className="table-td pr-5 text-xs text-gray-400">
                      {c.created_at ? format(new Date(c.created_at as string), 'dd MMM yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </div>
        )}
      </Card>

      {/* Add Partner Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Partner" size="lg">
        {serverError && <Alert type="error" message={serverError} />}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Partner Name" required error={errors.name}>
                <input className="input" value={form.name}
                  onChange={set('name')} placeholder="EduLead Tunisia" autoFocus />
              </FormField>
            </div>
            <FormField label="Partner Type">
              <select className="input" value={form.type} onChange={set('type')}>
                <option value="platform">Platform / App</option>
                <option value="ambassador">Student Ambassador</option>
                <option value="agency">Agency</option>
                <option value="university">University Internal</option>
                <option value="corporate">Corporate</option>
                <option value="ngo">NGO / Association</option>
              </select>
            </FormField>
            <FormField label="Country Code" hint="ISO 2-letter (e.g. TN, FR)">
              <input className="input uppercase" value={form.countryCode}
                onChange={set('countryCode')} maxLength={2} placeholder="TN" />
            </FormField>
            <div className="col-span-2">
              <FormField label="Website" error={errors.website}>
                <input className="input" value={form.website}
                  onChange={set('website')} placeholder="https://partner.tn" />
              </FormField>
            </div>
            <div className="col-span-2">
              <FormField label="Notes" hint="Internal notes about this partnership">
                <textarea className="input h-20 resize-none" value={form.notes}
                  onChange={set('notes')} placeholder="Partnership details, commission terms, etc.' />
              </FormField>
            </div>
          </div>

          {/* Founding partner toggle */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <input type="checkbox" id="founding" checked={form.isFoundingPartner}
              onChange={e => setForm(f => ({ ...f, isFoundingPartner: e.target.checked }))}
              className="rounded mt-0.5" />
            <label htmlFor="founding" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium text-amber-800">Founding Partner</span>
              </div>
              <p className="text-xs text-amber-700 mt-0.5">
                Founding partners receive preferential commission rates, co-branding opportunities,
                and are featured in FORSA promotional materials.
              </p>
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={createMutation.isPending || !form.name} className="btn-primary">
              {createMutation.isPending
                ? <><Loader2 size={14} className="animate-spin" /> Adding...</>
                : <><Plus size={14} /> Add Partner</>
              }
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
