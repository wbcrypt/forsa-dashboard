import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentsApi, documentsApi } from '../../lib/api'
import { Card, Badge, StatCard, Tabs, LoadingSpinner, EmptyState, ErrorState, Modal, FormField, Alert, TIER_STYLE, TierBadge } from '../../components/ui'
import { ArrowLeft, FileText, CreditCard, Star, Upload, Loader2, Plus, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { useToastContext } from '../../context/ToastContext'

const SCORE_BAND_COLOR: Record<string, string> = {
  high_risk: 'bg-red-500',
  medium_trust: 'bg-yellow-400',
  good_trust: 'bg-blue-500',
  very_good_trust: 'bg-green-500',
  elite_trust: 'bg-teal-500',
}

const REQUIRED_DOCS = [
  { code: 'national_id', label: 'National ID Card' },
  { code: 'bac_diploma', label: 'Bac Diploma' },
  { code: 'university_acceptance', label: 'University Acceptance Letter' },
  { code: 'income_proof', label: 'Income Proof' },
]

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { toast } = useToastContext()
  const qc = useQueryClient()
  const [tab, setTab] = useState('overview')
  const [showGuarantorModal, setShowGuarantorModal] = useState(false)
  const [guarantorForm, setGuarantorForm] = useState({ fullName: '', relationship: '', phone: '', employmentStatus: 'employed', monthlyIncome: '' })
  const [guarantorError, setGuarantorError] = useState('')
  const [uploadingDoc, setUploadingDoc] = useState('')

  const { data: student, isLoading, isError, refetch } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsApi.get(id!).then(r => r.data),
    enabled: !!id,
  })

  const { data: score, isLoading: scoreLoading } = useQuery({
    queryKey: ['student-score', id],
    queryFn: () => studentsApi.getScore(id!).then(r => r.data),
    enabled: !!id,
  })

  const { data: applications } = useQuery({
    queryKey: ['student-applications', id],
    queryFn: () => studentsApi.getApplications(id!).then(r => r.data),
    enabled: tab === 'applications' && !!id,
  })

  const { data: payments } = useQuery({
    queryKey: ['student-payments', id],
    queryFn: () => studentsApi.getPayments(id!).then(r => r.data),
    enabled: tab === 'payments' && !!id,
  })

  const { data: docs } = useQuery({
    queryKey: ['student-docs', id],
    queryFn: () => documentsApi.getForEntity('student', id!).then(r => r.data),
    enabled: tab === 'documents' && !!id,
  })

  const guarantorMutation = useMutation({
    mutationFn: (data: unknown) => studentsApi.addGuarantor(id!, data),
    onSuccess: () => {
      toast('Guarantor added', 'success')
      qc.invalidateQueries({ queryKey: ['student', id] })
      setShowGuarantorModal(false)
      setGuarantorForm({ fullName: '', relationship: '', phone: '', employmentStatus: 'employed', monthlyIncome: '' })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setGuarantorError(e?.response?.data?.message || 'Failed to add guarantor')
    },
  })

  const handleDocUpload = async (docTypeCode: string, file: File) => {
    setUploadingDoc(docTypeCode)
    try {
      const urlRes = await documentsApi.getUploadUrl({
        entityType: 'student',
        entityId: id,
        documentTypeCode: docTypeCode,
        fileName: file.name,
        contentType: file.type || 'application/pdf',
      })
      const { documentId, uploadUrl } = urlRes.data

      if (uploadUrl) {
        await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/pdf' } })
      }

      await documentsApi.confirmUpload(documentId, file.size)
      toast(`${docTypeCode.replace(/_/g, ' ')} uploaded`, 'success')
      qc.invalidateQueries({ queryKey: ['student-docs', id] })
    } catch {
      toast('Upload failed. Please try again.', 'error')
    } finally {
      setUploadingDoc('')
    }
  }

  if (isLoading) return <LoadingSpinner className="h-64" />
  if (isError) return (
    <div className="space-y-4">
      <button onClick={() => navigate('/students')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back to Students
      </button>
      <ErrorState onRetry={refetch} message="Could not load student data" />
    </div>
  )
  if (!student) return null

  const aggregateScore = score?.aggregate_score ?? student.aggregate_score ?? 500
  const scoreBand = score?.score_band ?? student.score_band ?? 'medium_trust'
  const scorePercent = Math.max(0, Math.min(100, ((aggregateScore - 300) / 700) * 100))
  const bandColor = SCORE_BAND_COLOR[scoreBand] || 'bg-gray-400'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/students" className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1 flex-shrink-0">
          <ArrowLeft size={16} className="text-gray-500" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${TIER_STYLE[student.membership_status]?.bg || 'bg-navy-800'}`}>
              <span className={`font-semibold text-lg ${TIER_STYLE[student.membership_status] ? TIER_STYLE[student.membership_status].text : 'text-white'}`}>
                {student.first_name?.[0]}{student.last_name?.[0]}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {student.first_name} {student.last_name}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <TierBadge tier={student.membership_status} />
                <Badge status={student.status} />
                <span className="text-xs text-gray-400">{student.email || 'No email'}</span>
                {student.phone_primary && <span className="text-xs text-gray-400">{student.phone_primary}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {hasPermission('application.create') && (
            <Link to={`/applications/new?studentId=${id}`} className="btn-primary text-sm">
              <FileText size={14} /> New Application
            </Link>
          )}
        </div>
      </div>

      {/* Score + stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card lg:col-span-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">FORSA Score</p>
          {scoreLoading ? (
            <div className="skeleton h-8 w-20 mt-2 rounded" />
          ) : (
            <>
              <div className="flex items-end gap-1 mt-1">
                <p className="text-3xl font-bold text-gray-900">{aggregateScore}</p>
                <p className="text-xs text-gray-400 mb-1">/1000</p>
              </div>
              <Badge status={scoreBand} />
              <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${bandColor} rounded-full transition-all duration-500`}
                  style={{ width: `${scorePercent}%` }} />
              </div>
            </>
          )}
        </div>
        <StatCard label="City" value={student.city || '—'} color="navy" />
        <StatCard label="Nationality" value={student.nationality || '—'} color="teal" />
        <StatCard label="Member Since" value={student.created_at ? format(new Date(student.created_at), 'MMM yyyy') : '—'} color="navy" />
      </div>

      {/* Tabs */}
      <Card padding={false}>
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'applications', label: 'Applications' },
            { id: 'documents', label: 'Documents' },
            { id: 'payments', label: 'Payments' },
            { id: 'guarantors', label: 'Guarantors', count: student.guarantors?.length },
          ]}
          active={tab}
          onChange={setTab}
        />

        <div className="p-5">
          {/* Overview */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Personal Details</h3>
                <dl className="space-y-3">
                  {[
                    { label: 'Full Name', value: `${student.first_name} ${student.last_name}` },
                    { label: 'Email', value: student.email || '—' },
                    { label: 'Phone', value: student.phone_primary || '—' },
                    { label: 'City', value: student.city || '—' },
                    { label: 'Governorate', value: student.governorate || '—' },
                    { label: 'Date of Birth', value: student.date_of_birth ? format(new Date(student.date_of_birth), 'dd MMM yyyy') : '—' },
                    { label: 'Gender', value: student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : '—' },
                    { label: 'Nationality', value: student.nationality || '—' },
                    { label: 'National ID', value: student.national_id_encrypted ? '••••••••' : '—' },
                    { label: 'Academic Level', value: student.academic_level?.replace(/_/g, ' ') || '—' },
                    { label: 'Bac Year', value: student.bac_year || '—' },
                    { label: 'Bac Mention', value: student.bac_mention?.replace(/_/g, ' ') || '—' },
                  ].map(item => (
                    <div key={item.label} className="flex gap-3">
                      <dt className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{item.label}</dt>
                      <dd className="text-sm text-gray-700 capitalize">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Score Dimensions</h3>
                {score?.dimension_balances && Object.keys(score.dimension_balances).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(score.dimension_balances as Record<string, number>).map(([dim, val]) => {
                      const pct = Math.max(0, Math.min(100, ((Math.round(val) - 300) / 700) * 100))
                      return (
                        <div key={dim}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500 capitalize">{dim.replace(/_/g, ' ')}</span>
                            <span className="font-semibold text-gray-700">{Math.round(val)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-500">No score data yet</p>
                    <p className="text-xs text-gray-400 mt-1">Score will appear after first application is processed</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Applications */}
          {tab === 'applications' && (
            <div className="space-y-3">
              {!applications ? (
                <LoadingSpinner className="h-32" />
              ) : applications.length === 0 ? (
                <EmptyState icon={FileText} title="No applications"
                  description="This student has no Tuition Facilitation applications yet."
                  action={hasPermission('application.create')
                    ? <Link to={`/applications/new?studentId=${id}`} className="btn-primary text-sm">Create application</Link>
                    : undefined} />
              ) : (
                applications.map((app: Record<string, unknown>) => (
                  <Link key={app.id as string} to={`/applications/${app.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-navy-200 hover:bg-navy-50/20 transition-all">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {(app.university_name as string) || 'Unknown University'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(app.program_name as string) || 'No program'} · {app.academic_year as string}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">
                        {parseFloat((app.tuition_amount as string) || '0').toLocaleString()} TND
                      </span>
                      <Badge status={app.current_status as string} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Documents */}
          {tab === 'documents' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-4">Upload documents to satisfy application requirements.</p>
              {REQUIRED_DOCS.map(doc => {
                const uploaded = (docs || []).find((d: Record<string, unknown>) => d.document_type_code === doc.code)
                return (
                  <div key={doc.code} className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        uploaded?.status === 'verified' ? 'bg-green-500' :
                        uploaded?.status === 'under_review' ? 'bg-yellow-400' :
                        uploaded ? 'bg-blue-400' : 'bg-gray-200'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.label}</p>
                        {uploaded && (
                          <p className="text-xs text-gray-400">{uploaded.file_name as string} · {uploaded.status as string}</p>
                        )}
                      </div>
                    </div>
                    {hasPermission('document.upload') && (
                      <label className="btn-secondary text-xs cursor-pointer">
                        {uploadingDoc === doc.code ? (
                          <><Loader2 size={12} className="animate-spin" /> Uploading...</>
                        ) : (
                          <><Upload size={12} /> {uploaded ? 'Replace' : 'Upload'}</>
                        )}
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) handleDocUpload(doc.code, file)
                            e.target.value = ''
                          }}
                          disabled={uploadingDoc !== ''} />
                      </label>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Payments */}
          {tab === 'payments' && (
            <div className="space-y-3">
              {!payments ? (
                <LoadingSpinner className="h-32" />
              ) : payments.length === 0 ? (
                <EmptyState icon={CreditCard} title="No payments" description="No payments recorded for this student yet." />
              ) : (
                payments.map((p: Record<string, unknown>) => (
                  <div key={p.id as string} className="flex items-center justify-between p-4 rounded-xl border border-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {parseFloat((p.amount as string) || '0').toLocaleString()} {p.currency as string}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {(p.payment_method as string)?.replace(/_/g, ' ')} · {(p.reference_number as string) || 'No reference'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge status={p.status as string} />
                      <p className="text-xs text-gray-400 mt-1">
                        {p.payment_date ? format(new Date(p.payment_date as string), 'dd MMM yyyy') : '—'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Guarantors */}
          {tab === 'guarantors' && (
            <div className="space-y-3">
              {hasPermission('student.edit') && (
                <div className="flex justify-end mb-2">
                  <button onClick={() => setShowGuarantorModal(true)} className="btn-secondary text-sm">
                    <Plus size={14} /> Add Guarantor
                  </button>
                </div>
              )}
              {(!student.guarantors || student.guarantors.length === 0) ? (
                <EmptyState icon={Star} title="No guarantors"
                  description="Add guarantors to strengthen the application risk profile."
                  action={hasPermission('student.edit')
                    ? <button onClick={() => setShowGuarantorModal(true)} className="btn-secondary text-sm">Add guarantor</button>
                    : undefined} />
              ) : (
                student.guarantors.map((g: Record<string, unknown>) => (
                  <div key={g.guarantor_id as string} className="p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{g.full_name as string}</p>
                      <Badge status={(g.status as string) || 'active'} />
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>{(g.role as string)?.replace(/_/g, ' ')}</span>
                      <span>{(g.employment_status as string)?.replace(/_/g, ' ')}</span>
                      {g.monthly_income && <span>{parseFloat(g.monthly_income as string).toLocaleString()} TND/mo</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Add Guarantor Modal */}
      <Modal open={showGuarantorModal} onClose={() => { setShowGuarantorModal(false); setGuarantorError('') }} title="Add Guarantor">
        {guarantorError && <Alert type="error" message={guarantorError} />}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Full Name" required>
              <input className="input" value={guarantorForm.fullName}
                onChange={e => setGuarantorForm(f => ({ ...f, fullName: e.target.value }))}
                placeholder="Ahmed Ben Amor" />
            </FormField>
            <FormField label="Relationship">
              <select className="input" value={guarantorForm.relationship}
                onChange={e => setGuarantorForm(f => ({ ...f, relationship: e.target.value }))}>
                <option value="">Select</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="spouse">Spouse</option>
                <option value="uncle_aunt">Uncle / Aunt</option>
                <option value="employer">Employer</option>
                <option value="other">Other</option>
              </select>
            </FormField>
            <FormField label="Phone">
              <input className="input" value={guarantorForm.phone}
                onChange={e => setGuarantorForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+216 XX XXX XXX" />
            </FormField>
            <FormField label="Employment Status">
              <select className="input" value={guarantorForm.employmentStatus}
                onChange={e => setGuarantorForm(f => ({ ...f, employmentStatus: e.target.value }))}>
                <option value="employed">Employed</option>
                <option value="self_employed">Self-employed</option>
                <option value="retired">Retired</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </FormField>
            <div className="col-span-2">
              <FormField label="Monthly Income (TND)" hint="Optional">
                <input type="number" className="input" value={guarantorForm.monthlyIncome}
                  onChange={e => setGuarantorForm(f => ({ ...f, monthlyIncome: e.target.value }))}
                  placeholder="2500" min="0" />
              </FormField>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowGuarantorModal(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => guarantorMutation.mutate({
                fullName: guarantorForm.fullName,
                relationship: guarantorForm.relationship,
                phone: guarantorForm.phone,
                employmentStatus: guarantorForm.employmentStatus,
                monthlyIncome: guarantorForm.monthlyIncome ? parseFloat(guarantorForm.monthlyIncome) : undefined,
                role: 'guarantor',
              })}
              disabled={guarantorMutation.isPending || !guarantorForm.fullName}
              className="btn-primary">
              {guarantorMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Guarantor
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
