import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { universitiesApi } from '../../lib/api'
import { Card, Badge, StatCard, Tabs, LoadingSpinner, Modal, FormField, Alert, ErrorState, EmptyState } from '../../components/ui'
import { ArrowLeft, Plus, CheckCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'

export default function UniversityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [tab, setTab] = useState('overview')
  const [showAgreementModal, setShowAgreementModal] = useState(false)
  const [showProgramModal, setShowProgramModal] = useState(false)
  const [agreeForm, setAgreeForm] = useState({ paymentModel: 'concurrent', effectiveDate: format(new Date(), 'yyyy-MM-dd'), maxFinancingAmount: '', currency: 'TND' })
  const [programForm, setProgramForm] = useState({ name: '', code: '', level: 'licence', durationYears: '3', tuitionMin: '', tuitionMax: '', currency: 'TND', accreditationStatus: 'accredited' })
  const [error, setError] = useState('')

  const { data: university, isLoading, isError, refetch } = useQuery({
    queryKey: ['university', id],
    queryFn: () => universitiesApi.get(id!).then(r => r.data),
  })

  const { data: programs } = useQuery({
    queryKey: ['programs', id],
    queryFn: () => universitiesApi.getPrograms(id!).then(r => r.data),
    enabled: tab === 'programs',
  })

  const { data: perf } = useQuery({
    queryKey: ['university-perf', id],
    queryFn: () => universitiesApi.getPerformance(id!).then(r => r.data),
    enabled: tab === 'overview',
  })

  const agreementMutation = useMutation({
    mutationFn: (data: unknown) => universitiesApi.createAgreement(id!, data),
    onSuccess: async (res) => {
      await universitiesApi.approveAgreement(res.data.id)
      qc.invalidateQueries({ queryKey: ['university', id] })
      setShowAgreementModal(false)
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Failed to create agreement'),
  })

  const programMutation = useMutation({
    mutationFn: (data: unknown) => universitiesApi.createProgram(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programs', id] })
      setShowProgramModal(false)
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Failed to create program'),
  })

  if (isLoading) return <LoadingSpinner className="h-64" />
  if (isError) return <ErrorState onRetry={refetch} message="Could not load university data" />
  if (!university) return <div className="text-sm text-gray-500">University not found</div>

  const activeAgreement = university.agreements?.find((a: any) => a.status === 'active')

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <Link to="/universities" className="p-2 hover:bg-gray-100 rounded-lg mt-0.5">
          <ArrowLeft size={16} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">{university.name}</h1>
            <Badge status={university.status} />
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{university.city} · {university.country_code}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowProgramModal(true)} className="btn-secondary text-sm">
            <Plus size={14} /> Program
          </button>
          <button onClick={() => setShowAgreementModal(true)} className="btn-primary text-sm">
            <Plus size={14} /> Agreement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Applications" value={perf?.total_applications || 0} color="navy" />
        <StatCard label="Active Students" value={perf?.active_students || 0} color="teal" />
        <StatCard label="Total Disbursed" value={`${parseFloat(perf?.total_disbursed || 0).toLocaleString()} TND`} color="green" />
        <StatCard label="Risk Level" value={university.risk_level || '—'} color={university.risk_level === 'low' ? 'green' : university.risk_level === 'elevated' ? 'red' : 'navy'} />
      </div>

      <Card padding={false}>
        <Tabs
          tabs={[{ id: 'overview', label: 'Overview' }, { id: 'agreements', label: 'Agreements' }, { id: 'programs', label: 'Programs' }, { id: 'contacts', label: 'Contacts' }]}
          active={tab}
          onChange={setTab}
        />
        <div className="p-5">
          {tab === 'overview' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Details</h3>
                <dl className="space-y-3">
                  {[
                    { label: 'Full Name', value: university.name },
                    { label: 'Short Name', value: university.short_name || '—' },
                    { label: 'City', value: university.city || '—' },
                    { label: 'Website', value: university.website || '—' },
                    { label: 'Partnership', value: university.is_founding_partner ? '⭐ Founding Partner' : 'Standard Partner' },
                    { label: 'Accreditation', value: university.accreditation_status || '—' },
                    { label: 'Accreditation Body', value: university.accreditation_body || '—' },
                  ].map(item => (
                    <div key={item.label} className="flex gap-3">
                      <dt className="text-xs text-gray-400 w-32 flex-shrink-0 pt-0.5">{item.label}</dt>
                      <dd className="text-sm text-gray-700">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {activeAgreement && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Agreement</h3>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-sm font-medium text-green-800">Agreement Active</span>
                    </div>
                    <dl className="space-y-2">
                      {[
                        { label: 'Payment Model', value: activeAgreement.payment_model },
                        { label: 'Max Amount', value: activeAgreement.max_financing_amount ? `${parseFloat(activeAgreement.max_financing_amount).toLocaleString()} TND` : '—' },
                        { label: 'Levels', value: (activeAgreement.financing_levels || []).join(', ') },
                        { label: 'Effective', value: activeAgreement.effective_date ? format(new Date(activeAgreement.effective_date), 'dd MMM yyyy') : '—' },
                      ].map(item => (
                        <div key={item.label} className="flex gap-3">
                          <dt className="text-xs text-gray-500 w-28 flex-shrink-0">{item.label}</dt>
                          <dd className="text-xs font-medium text-gray-700 capitalize">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'agreements' && (
            <div className="space-y-3">
              {university.agreements?.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-500">No agreements yet</p>
                  <button onClick={() => setShowAgreementModal(true)} className="btn-primary mt-3 text-sm">
                    <Plus size={14} /> Create Agreement
                  </button>
                </div>
              )}
              {(university.agreements || []).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 capitalize">{a.payment_model} model</p>
                      <Badge status={a.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Effective {a.effective_date ? format(new Date(a.effective_date), 'dd MMM yyyy') : '—'}
                      {a.expiration_date ? ` · Expires ${format(new Date(a.expiration_date), 'dd MMM yyyy')}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {a.max_financing_amount ? `${parseFloat(a.max_financing_amount).toLocaleString()} ${a.currency}` : 'No limit'}
                    </p>
                    <p className="text-xs text-gray-400">max financing</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'programs' && (
            <div className="space-y-3">
              {(!programs || programs.length === 0) && (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-500">No programs yet</p>
                  <button onClick={() => setShowProgramModal(true)} className="btn-primary mt-3 text-sm">
                    <Plus size={14} /> Add Program
                  </button>
                </div>
              )}
              {(programs || []).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.code} · {p.level} · {p.duration_years} years</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {parseFloat(p.tuition_min || 0).toLocaleString()} – {parseFloat(p.tuition_max || 0).toLocaleString()} {p.currency}
                    </p>
                    <Badge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'contacts' && (
            <div className="space-y-3">
              {(university.contacts || []).map((c: any) => (
                <div key={c.id} className="p-4 rounded-xl border border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{c.full_name}</p>
                  <p className="text-xs text-gray-500">{c.title} · {c.role}</p>
                  <p className="text-xs text-gray-400 mt-1">{c.email} · {c.phone}</p>
                </div>
              ))}
              {(!university.contacts || university.contacts.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-8">No contacts added</p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Agreement Modal */}
      <Modal open={showAgreementModal} onClose={() => setShowAgreementModal(false)} title="Create Agreement">
        {error && <Alert type="error" message={error} className="mb-4" />}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Payment Model">
              <select className="input" value={agreeForm.paymentModel} onChange={e => setAgreeForm(f => ({ ...f, paymentModel: e.target.value }))}>
                <option value="concurrent">Concurrent (Monthly)</option>
                <option value="advance">Advance</option>
                <option value="tranche">Tranche</option>
              </select>
            </FormField>
            <FormField label="Effective Date">
              <input type="date" className="input" value={agreeForm.effectiveDate} onChange={e => setAgreeForm(f => ({ ...f, effectiveDate: e.target.value }))} />
            </FormField>
            <FormField label="Max Financing Amount">
              <input type="number" className="input" value={agreeForm.maxFinancingAmount} onChange={e => setAgreeForm(f => ({ ...f, maxFinancingAmount: e.target.value }))} placeholder="50000" />
            </FormField>
            <FormField label="Currency">
              <select className="input" value={agreeForm.currency} onChange={e => setAgreeForm(f => ({ ...f, currency: e.target.value }))}>
                <option value="TND">TND</option>
                <option value="EUR">EUR</option>
              </select>
            </FormField>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowAgreementModal(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => agreementMutation.mutate({
                ...agreeForm,
                maxFinancingAmount: parseFloat(agreeForm.maxFinancingAmount) || undefined,
                financingLevels: ['level1', 'level2', 'level3'],
              })}
              disabled={agreementMutation.isPending}
              className="btn-primary"
            >
              {agreementMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Create & Approve
            </button>
          </div>
        </div>
      </Modal>

      {/* Program Modal */}
      <Modal open={showProgramModal} onClose={() => setShowProgramModal(false)} title="Add Program">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Program Name" required>
              <input className="input" value={programForm.name} onChange={e => setProgramForm(f => ({ ...f, name: e.target.value }))} placeholder="Licence en Informatique" />
            </FormField>
            <FormField label="Code">
              <input className="input" value={programForm.code} onChange={e => setProgramForm(f => ({ ...f, code: e.target.value }))} placeholder="LI-UTM" />
            </FormField>
            <FormField label="Level">
              <select className="input" value={programForm.level} onChange={e => setProgramForm(f => ({ ...f, level: e.target.value }))}>
                <option value="licence">Licence</option>
                <option value="master">Master</option>
                <option value="ingenieur">Ingénieur</option>
                <option value="doctorat">Doctorat</option>
              </select>
            </FormField>
            <FormField label="Duration (years)">
              <input type="number" className="input" value={programForm.durationYears} onChange={e => setProgramForm(f => ({ ...f, durationYears: e.target.value }))} />
            </FormField>
            <FormField label="Min Tuition">
              <input type="number" className="input" value={programForm.tuitionMin} onChange={e => setProgramForm(f => ({ ...f, tuitionMin: e.target.value }))} placeholder="2000" />
            </FormField>
            <FormField label="Max Tuition">
              <input type="number" className="input" value={programForm.tuitionMax} onChange={e => setProgramForm(f => ({ ...f, tuitionMax: e.target.value }))} placeholder="4000" />
            </FormField>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowProgramModal(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => programMutation.mutate({ ...programForm, durationYears: parseFloat(programForm.durationYears), tuitionMin: parseFloat(programForm.tuitionMin), tuitionMax: parseFloat(programForm.tuitionMax) })}
              disabled={programMutation.isPending || !programForm.name}
              className="btn-primary"
            >
              {programMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Add Program
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
