import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi, pipelineApi, documentsApi, paymentsApi } from '../../lib/api'
import { Card, Badge, Tabs, LoadingSpinner, Alert, Modal, FormField, ErrorState, EmptyState } from '../../components/ui'
import { ArrowLeft, Play, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, CreditCard, Loader2, FileText } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { AIReportPanel } from '../../components/AIReportPanel'
import { useToastContext } from '../../context/ToastContext'

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { hasPermission } = useAuth()
  const { toast } = useToastContext()
  const [tab, setTab] = useState('overview')
  const [runError, setRunError] = useState('')
  const [runResult, setRunResult] = useState<any>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'bank_transfer', referenceNumber: '', paymentDate: format(new Date(), 'yyyy-MM-dd'), notes: '' })
  const [selectedInstallment, setSelectedInstallment] = useState<string>('')
  const [paymentError, setPaymentError] = useState('')

  const { data: app, isLoading, isError, refetch } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.get(id!).then(r => r.data),
  })

  const { data: checklist } = useQuery({
    queryKey: ['doc-checklist', id],
    queryFn: () => documentsApi.getChecklist(id!).then(r => r.data),
    enabled: tab === 'documents' || tab === 'overview',
  })

  const { data: schedule } = useQuery({
    queryKey: ['payment-schedule', id],
    queryFn: () => paymentsApi.getSchedule(id!).then(r => r.data),
    enabled: tab === 'payments',
  })

  const { data: statusHistory } = useQuery({
    queryKey: ['app-status-history', id],
    queryFn: () => applicationsApi.getStatusHistory(id!).then(r => r.data),
    enabled: tab === 'timeline',
  })

  // Run pipeline
  const runMutation = useMutation({
    mutationFn: () => pipelineApi.run(id!),
    onSuccess: (res) => {
      setRunResult(res.data)
      qc.invalidateQueries({ queryKey: ['application', id] })
      if (res.data.decisionResult?.includes('approved')) {
        toast(`Application approved — ${res.data.decisionResult?.replace(/_/g, ' ')}`, 'success')
      }
    },
    onError: (err: any) => setRunError(err?.response?.data?.message || 'Pipeline failed'),
  })

  // Generate schedule
  const scheduleMutation = useMutation({
    mutationFn: () => paymentsApi.generateSchedule({ applicationId: id }),
    onSuccess: () => {
      toast('Payment schedule generated', 'success')
      qc.invalidateQueries({ queryKey: ['payment-schedule', id] })
      setTab('payments')
    },
    onError: () => toast('Failed to generate schedule', 'error'),
  })

  // Record payment
  const paymentMutation = useMutation({
    mutationFn: (data: unknown) => paymentsApi.record(data),
    onSuccess: () => {
      toast('Payment recorded successfully', 'success')
      qc.invalidateQueries({ queryKey: ['payment-schedule', id] })
      setShowPaymentModal(false)
      setSelectedInstallment('')
      setPaymentForm({ amount: '', paymentMethod: 'bank_transfer', referenceNumber: '', paymentDate: format(new Date(), 'yyyy-MM-dd'), notes: '' })
    },
    onError: (err: any) => setPaymentError(err?.response?.data?.message || 'Payment failed'),
  })

  if (isLoading) return <LoadingSpinner className="h-64" />
  if (isError) return (
    <div className="space-y-4">
      <button onClick={() => navigate('/applications')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back to Applications
      </button>
      <ErrorState onRetry={refetch} message="Could not load application data" />
    </div>
  )
  if (!app) return <div className="text-sm text-gray-500">Application not found</div>

  const docsComplete = checklist?.every((d: any) => d.status === 'verified' || d.status === 'under_review')
  const isApproved = ['approved_level1', 'approved_level2', 'approved_level3'].includes(app.current_status)
  const canRunPipeline = ['new_lead', 'contacted', 'documents_received', 'under_review', 'waiting_for_documents'].includes(app.current_status)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/applications" className="p-2 hover:bg-gray-100 rounded-lg mt-0.5">
          <ArrowLeft size={16} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900">
              {app.first_name} {app.last_name}
            </h1>
            <Badge status={app.current_status} />
            {app.current_financing_level && (
              <Badge status={app.current_financing_level} label={app.current_financing_level.toUpperCase()} />
            )}
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            {app.university_name} · {app.program_name || 'No program'} · {app.academic_year}
          </p>
        </div>

        <div className="flex gap-2">
          <Link to={`/applications/${id}/workflow`} className="btn-secondary text-sm">
            🔄 V2 Workflow
          </Link>
          {canRunPipeline && (
            <button
              onClick={() => { setRunError(''); setRunResult(null); runMutation.mutate() }}
              disabled={runMutation.isPending}
              className="btn-teal"
            >
              {runMutation.isPending
                ? <><Loader2 size={14} className="animate-spin" /> Running...</>
                : <><Play size={14} /> Run Pipeline</>
              }
            </button>
          )}
          {isApproved && !schedule && (
            <button
              onClick={() => scheduleMutation.mutate()}
              disabled={scheduleMutation.isPending}
              className="btn-primary"
            >
              {scheduleMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
              Generate Schedule
            </button>
          )}
        </div>
      </div>

      {/* Pipeline result */}
      {runResult && (
        <PipelineResult result={runResult} onClose={() => setRunResult(null)} />
      )}
      {runError && <Alert type="error" message={runError} onClose={() => setRunError('')} />}

      {/* T-213/T-214/T-217 — the actual "Admin decision flow" action panel.
          Was entirely missing before this pass: pipelineApi.submitDecision
          existed in lib/api.ts but no page anywhere ever called it, so a
          pipeline run pausing at Stage 8 for human review had no UI path
          to actually submit that decision. */}
      {app.current_status === 'under_review' && app.current_pipeline_run_id && (
        <HumanDecisionPanel
          pipelineRunId={app.current_pipeline_run_id}
          hasPermission={hasPermission}
          onDecided={() => {
            qc.invalidateQueries({ queryKey: ['application', id] })
            toast('Decision submitted', 'success')
          }}
        />
      )}

      {/* Key info row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Tuition</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">
            {parseFloat(app.tuition_amount || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">{app.currency}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide">FORSA Score</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">{app.aggregate_score || 500}</p>
          <p className="text-xs text-gray-400">{app.score_band?.replace(/_/g, ' ')}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Decision</p>
          <p className="text-sm font-semibold text-gray-900 mt-1 capitalize">
            {app.decision_result?.replace(/_/g, ' ') || 'Pending'}
          </p>
          {app.approved_amount && (
            <p className="text-xs text-teal-600">{parseFloat(app.approved_amount).toLocaleString()} TND</p>
          )}
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Documents</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">
            {checklist?.filter((d: any) => d.status !== 'absent').length || 0}/{checklist?.length || 0}
          </p>
          <p className="text-xs text-gray-400">uploaded</p>
        </div>
      </div>

      {/* Tabs */}
      <Card padding={false}>
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'documents', label: 'Documents', count: checklist?.filter((d: any) => d.status !== 'absent').length },
            { id: 'payments', label: 'Payments' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'ai_report', label: '🧠 AI Report' },
          ]}
          active={tab}
          onChange={setTab}
        />
        <div className="p-5">
          {tab === 'overview' && (
            <div className="space-y-6">
              {app.adminStage && <AdminPipelineTracker stage={app.adminStage} />}
              {app.completeness && <CompletenessChecklist completeness={app.completeness} />}
              <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Application Details</h3>
                <dl className="space-y-3">
                  {[
                    { label: 'Student', value: `${app.first_name} ${app.last_name}` },
                    { label: 'University', value: app.university_name },
                    { label: 'Program', value: app.program_name || '—' },
                    { label: 'Academic Year', value: app.academic_year },
                    { label: 'Is Renewal', value: app.is_renewal ? 'Yes' : 'No' },
                    { label: 'Lead Date', value: app.lead_date ? format(new Date(app.lead_date), 'dd MMM yyyy') : '—' },
                    { label: 'Assigned To', value: app.assigned_to || '—' },
                    { label: 'Referral Source', value: app.referral_source_name || '—' },
                  ].map(item => (
                    <div key={item.label} className="flex gap-3">
                      <dt className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{item.label}</dt>
                      <dd className="text-sm text-gray-700">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Decision</h3>
                {app.decision_result ? (
                  <dl className="space-y-3">
                    {[
                      { label: 'Result', value: <Badge status={app.decision_result} /> },
                      { label: 'Level', value: app.approved_level?.toUpperCase() || '—' },
                      { label: 'Amount', value: app.approved_amount ? `${parseFloat(app.approved_amount).toLocaleString()} TND` : '—' },
                      { label: 'Explanation', value: app.decision_explanation || '—' },
                    ].map(item => (
                      <div key={item.label} className="flex gap-3">
                        <dt className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{item.label}</dt>
                        <dd className="text-sm text-gray-700">{item.value as any}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-500">No decision yet</p>
                    <p className="text-xs text-gray-400 mt-1">Run the pipeline to generate a Tuition Facilitation decision</p>
                    {canRunPipeline && (
                      <button
                        onClick={() => runMutation.mutate()}
                        className="btn-teal mt-3 text-xs"
                        disabled={runMutation.isPending}
                      >
                        <Play size={12} /> Run Pipeline
                      </button>
                    )}
                  </div>
                )}
              </div>
              </div>
            </div>
          )}

          {tab === 'documents' && (
            <div className="space-y-2">
              {(checklist || []).map((doc: any) => (
                <div key={doc.documentTypeCode} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    {doc.status === 'verified' ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : doc.status === 'absent' ? (
                      <XCircle size={16} className="text-gray-300" />
                    ) : (
                      <Clock size={16} className="text-yellow-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {doc.documentTypeCode.replace(/_/g, ' ')}
                      </p>
                      {doc.fileName && <p className="text-xs text-gray-400">{doc.fileName}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={doc.status} />
                    {doc.required && !doc.uploaded && (
                      <span className="text-xs text-red-500 font-medium">Required</span>
                    )}
                  </div>
                </div>
              ))}
              {(!checklist || checklist.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-8">No document requirements defined</p>
              )}
            </div>
          )}

          {tab === 'payments' && (
            <div>
              {schedule ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Payment Schedule</p>
                      <p className="text-xs text-gray-400">
                        {schedule.installment_count} installments · {parseFloat(schedule.total_amount).toLocaleString()} {schedule.currency}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="btn-primary text-xs"
                    >
                      <CreditCard size={13} /> Record Payment
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(schedule.installments || []).map((inst: any) => (
                      <div
                        key={inst.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-semibold text-gray-600">
                              {inst.sequence_number || inst.sequence}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {parseFloat(inst.amount).toLocaleString()} {schedule.currency}
                            </p>
                            <p className="text-xs text-gray-400">
                              Due {inst.due_date ? format(new Date(inst.due_date), 'dd MMM yyyy') : '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {parseFloat(inst.amount_paid) > 0 && (
                            <span className="text-xs text-teal-600 font-medium">
                              Paid {parseFloat(inst.amount_paid).toLocaleString()}
                            </span>
                          )}
                          <Badge status={inst.status} />
                          {inst.status !== 'paid' && (
                            <button
                              onClick={() => {
                                setSelectedInstallment(inst.id)
                                setPaymentForm(f => ({ ...f, amount: inst.amount.toString() }))
                                setShowPaymentModal(true)
                              }}
                              className="text-xs text-navy-700 hover:text-navy-900 font-medium"
                            >
                              Pay
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">No payment schedule yet</p>
                  {isApproved && (
                    <button
                      onClick={() => scheduleMutation.mutate()}
                      className="btn-primary mt-4"
                      disabled={scheduleMutation.isPending}
                    >
                      {scheduleMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                      Generate Payment Schedule
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'ai_report' && (
            <AIReportPanel
              report={(() => {
                try { return app.ai_report ? JSON.parse(app.ai_report) : null } catch { return null }
              })()}
              overallScore={app.ai_score_overall}
              transcript={app.interview_transcript}
              interviewLanguage={app.interview_language}
              applicationId={id!}
            />
          )}

          {tab === 'timeline' && (
            <div className="space-y-4">
              {(statusHistory || []).map((h: any, i: number) => (
                <div key={h.id || i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-navy-800 rounded-full mt-1.5" />
                    {i < (statusHistory?.length - 1) && (
                      <div className="w-px flex-1 bg-gray-100 mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2">
                      {h.to_status && <Badge status={h.to_status} />}
                      {h.changed_by_name && (
                        <span className="text-xs text-gray-400">by {h.changed_by_name}</span>
                      )}
                    </div>
                    {h.notes && <p className="text-xs text-gray-500 mt-1">{h.notes}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {h.changed_at ? format(new Date(h.changed_at), 'dd MMM yyyy · HH:mm') : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Record Payment Modal */}
      <Modal
        open={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setPaymentError('') }}
        title="Record Payment"
      >
        {paymentError && <Alert type="error" message={paymentError} className="mb-4" />}
        <div className="space-y-4">
          {!selectedInstallment && (
            <FormField label="Installment">
              <select
                className="input"
                value={selectedInstallment}
                onChange={e => setSelectedInstallment(e.target.value)}
              >
                <option value="">Select installment...</option>
                {(schedule?.installments || [])
                  .filter((i: any) => i.status !== 'paid')
                  .map((inst: any) => (
                    <option key={inst.id} value={inst.id}>
                      #{inst.sequence_number || inst.sequence} — {parseFloat(inst.amount).toLocaleString()} TND (due {inst.due_date ? format(new Date(inst.due_date), 'dd MMM') : '—'})
                    </option>
                  ))
                }
              </select>
            </FormField>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount" required>
              <input
                type="number"
                className="input"
                value={paymentForm.amount}
                onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="350"
              />
            </FormField>
            <FormField label="Payment Method">
              <select
                className="input"
                value={paymentForm.paymentMethod}
                onChange={e => setPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="online">Online</option>
              </select>
            </FormField>
            <FormField label="Reference Number">
              <input
                className="input"
                value={paymentForm.referenceNumber}
                onChange={e => setPaymentForm(f => ({ ...f, referenceNumber: e.target.value }))}
                placeholder="VIR-2026-001"
              />
            </FormField>
            <FormField label="Payment Date">
              <input
                type="date"
                className="input"
                value={paymentForm.paymentDate}
                onChange={e => setPaymentForm(f => ({ ...f, paymentDate: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <input
              className="input"
              value={paymentForm.notes}
              onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes"
            />
          </FormField>
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => paymentMutation.mutate({
                installmentId: selectedInstallment,
                amount: parseFloat(paymentForm.amount),
                currency: 'TND',
                paymentMethod: paymentForm.paymentMethod,
                referenceNumber: paymentForm.referenceNumber,
                paymentDate: paymentForm.paymentDate,
                notes: paymentForm.notes,
              })}
              disabled={paymentMutation.isPending || !selectedInstallment || !paymentForm.amount}
              className="btn-teal"
            >
              {paymentMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
              Record Payment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// T-213/T-214/T-217 — the full outcome set + CEO override + fraud flag.
// Three distinct actions, three distinct permissions:
// - Normal decision (pipeline.review, enforced server-side): any of the
//   outcomes below, subject to K-12's dual/executive-approver consensus.
// - CEO override (financing.override): bypasses that consensus entirely —
//   only shown to a user actually holding the permission, not just hidden
//   via CSS (the real gate is server-side regardless).
// - Fraud (fraud.flag): a separate, more restrictive action — permanently
//   blacklists the student, not just this one financing decision.
function HumanDecisionPanel({ pipelineRunId, hasPermission, onDecided }: {
  pipelineRunId: string
  hasPermission: (p: string) => boolean
  onDecided: () => void
}) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'on_hold' | 'needs_more_documents' | 'waiting_list'>('approved')
  const [approvedAmount, setApprovedAmount] = useState('')
  const [financingTier, setFinancingTier] = useState<'' | 'silver' | 'gold'>('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [showFraudModal, setShowFraudModal] = useState(false)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [fraudReason, setFraudReason] = useState('')

  const decisionMutation = useMutation({
    mutationFn: () => pipelineApi.submitDecision(pipelineRunId, {
      decision,
      approvedAmount: approvedAmount ? parseFloat(approvedAmount) : undefined,
      notes: notes || undefined,
      financingTier: decision === 'approved' && financingTier ? financingTier : undefined,
    }),
    onSuccess: (res) => {
      if (res.data?.status === 'awaiting_additional_approver') {
        setError(res.data.message)
      } else {
        setNotes(''); setApprovedAmount(''); setFinancingTier('')
        onDecided()
      }
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Submission failed'),
  })

  const fraudMutation = useMutation({
    mutationFn: () => pipelineApi.flagFraud(pipelineRunId, fraudReason),
    onSuccess: () => { setShowFraudModal(false); setFraudReason(''); onDecided() },
    onError: (err: any) => setError(err?.response?.data?.message || 'Fraud flag failed'),
  })

  const overrideMutation = useMutation({
    mutationFn: () => pipelineApi.overrideDecision(pipelineRunId, {
      decision: decision === 'rejected' ? 'rejected' : 'approved',
      approvedAmount: approvedAmount ? parseFloat(approvedAmount) : undefined,
      notes: notes || 'CEO override',
      financingTier: financingTier || undefined,
    }),
    onSuccess: () => { setShowOverrideModal(false); onDecided() },
    onError: (err: any) => setError(err?.response?.data?.message || 'Override failed'),
  })

  return (
    <Card className="border-2 border-navy-100">
      <p className="text-sm font-semibold text-gray-900 mb-1">Submit Decision</p>
      <p className="text-xs text-gray-400 mb-4">This application is awaiting human review (Stage 8).</p>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="space-y-3">
        <FormField label="Outcome" required>
          <select className="input" value={decision} onChange={e => setDecision(e.target.value as any)}>
            <option value="approved">Approved</option>
            <option value="rejected">Not Approved At This Time</option>
            <option value="on_hold">On Hold</option>
            <option value="needs_more_documents">More Information Required</option>
            <option value="waiting_list">Waiting List</option>
          </select>
        </FormField>

        {decision === 'approved' && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Approved Amount">
              <input type="number" className="input" value={approvedAmount} onChange={e => setApprovedAmount(e.target.value)} placeholder="Optional — defaults to requested amount" />
            </FormField>
            <FormField label="Facilitation Tier">
              <select className="input" value={financingTier} onChange={e => setFinancingTier(e.target.value as any)}>
                <option value="">Not set</option>
                <option value="silver">Silver (semester)</option>
                <option value="gold">Gold (academic year)</option>
              </select>
            </FormField>
          </div>
        )}

        <FormField label="Notes">
          <textarea className="input h-20 resize-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reviewer notes (visible in the audit trail)" />
        </FormField>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => decisionMutation.mutate()} disabled={decisionMutation.isPending} className="btn-teal">
            {decisionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Submit Decision
          </button>
          {hasPermission('fraud.flag') && (
            <button onClick={() => setShowFraudModal(true)} className="btn-secondary text-red-600">
              🚩 Flag Fraud
            </button>
          )}
          {hasPermission('financing.override') && (
            <button onClick={() => setShowOverrideModal(true)} className="btn-secondary text-amber-700">
              ⚡ CEO Override
            </button>
          )}
        </div>
      </div>

      <Modal open={showFraudModal} onClose={() => setShowFraudModal(false)} title="Flag Confirmed Fraud">
        <div className="space-y-4">
          <Alert type="warning" message="This permanently blacklists the student — forged documents, false identity, false guarantor, or material misrepresentation. This cannot be undone from this screen." />
          <FormField label="Reason" required>
            <textarea className="input h-24 resize-none" value={fraudReason} onChange={e => setFraudReason(e.target.value)} placeholder="Describe the confirmed fraud…" />
          </FormField>
          <div className="flex gap-3">
            <button onClick={() => setShowFraudModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => fraudMutation.mutate()} disabled={fraudMutation.isPending || !fraudReason.trim()}
              className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50">
              Confirm Fraud
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showOverrideModal} onClose={() => setShowOverrideModal(false)} title="CEO Override">
        <div className="space-y-4">
          <Alert type="warning" message="This finalizes the decision immediately, bypassing the dual/executive-approver requirement. Always distinctly audited." />
          <p className="text-sm text-gray-600">Outcome: <strong>{decision === 'rejected' ? 'Rejected' : 'Approved'}</strong> (set above)</p>
          <div className="flex gap-3">
            <button onClick={() => setShowOverrideModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => overrideMutation.mutate()} disabled={overrideMutation.isPending || !notes.trim()}
              className="flex-1 py-2 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 disabled:opacity-50">
              Confirm Override
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

function PipelineResult({ result, onClose }: { result: any; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false)

  const isApproved = result.decisionResult?.includes('approved')
  const isBlocked = !!result.blockedAtStage

  return (
    <div className={`rounded-2xl border p-4 ${isApproved ? 'bg-green-50 border-green-200' : isBlocked ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {isApproved ? (
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          ) : isBlocked ? (
            <XCircle size={20} className="text-orange-600 flex-shrink-0" />
          ) : (
            <Clock size={20} className="text-blue-600 flex-shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold">
              {isApproved
                ? `Approved — ${result.decisionResult?.replace(/_/g, ' ').toUpperCase()}`
                : isBlocked
                ? `Blocked at Stage ${result.blockedAtStage}: ${result.blockedAtStage === 1 ? 'Completeness Gate' : result.blockedAtStage === 2 ? 'Eligibility Gate' : result.blockedAtStage === 3 ? 'University Gate' : `Stage ${result.blockedAtStage}`}`
                : 'Pipeline Complete'
              }
            </p>
            {result.blockReason && (
              <p className="text-xs text-gray-600 mt-0.5">{result.blockReason}</p>
            )}
            {result.approvedAmount && (
              <p className="text-xs text-green-700 mt-0.5 font-medium">
                Amount: {parseFloat(result.approvedAmount).toLocaleString()} TND
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {result.trace?.length} stages
          </button>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 ml-2">✕</button>
        </div>
      </div>

      {expanded && result.trace && (
        <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
          {result.trace.map((stage: any) => (
            <div key={stage.stage} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                stage.status === 'passed' ? 'bg-green-100 text-green-700' :
                stage.status === 'blocked' ? 'bg-red-100 text-red-700' :
                stage.status === 'needs_review' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {stage.stage}
              </div>
              <span className="text-xs text-gray-700">{stage.stageName}</span>
              <Badge status={stage.status} />
              <span className="text-xs text-gray-400 ml-auto">{stage.durationMs}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Workflow architecture redesign — "the admin pipeline should represent
// the internal operational process." This is the internal-operations
// vocabulary (Draft → Submitted → Completeness Verification → Guarantor →
// AI Review → Internal Review → Pre-Approval → Contract → University
// Confirmation → Approved → University Payment → Active Student),
// computed server-side (applications.service.ts#findOneForAdmin ->
// application-stages.util.ts#computeAdminStage) from the same underlying
// data the student-facing Timeline uses — never a second stored status,
// so the two views can never silently disagree with each other.
// Tailwind's JIT scanner needs complete, literal class strings to include
// them in the generated CSS — `bg-${color}-50` interpolated at runtime
// would silently produce no styling at all in a real build. A static
// lookup keeps every class name literal in the source.
const EXCEPTION_STYLES: Record<string, { card: string; badge: string }> = {
  rejected: { card: 'border-amber-200 bg-amber-50/30', badge: 'bg-amber-100 text-amber-700' },
  fraud_flagged: { card: 'border-red-200 bg-red-50/30', badge: 'bg-red-100 text-red-700' },
  withdrawn: { card: 'border-gray-200 bg-gray-50/30', badge: 'bg-gray-100 text-gray-600' },
}

function AdminPipelineTracker({ stage }: { stage: any }) {
  if (stage.isException) {
    const styles = EXCEPTION_STYLES[stage.currentKey] || EXCEPTION_STYLES.withdrawn
    return (
      <Card className={styles.card}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin Pipeline</h3>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles.badge}`}>{stage.currentLabel}</span>
        </div>
      </Card>
    )
  }
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin Pipeline</h3>
        <div className="flex items-center gap-2">
          {stage.isWaitingList && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">Waiting List</span>}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-navy-100 text-navy-700">{stage.currentLabel}</span>
        </div>
      </div>
      <div className="flex items-center overflow-x-auto pb-1 -mx-1 px-1">
        {stage.stages.map((s: any, i: number) => (
          <div key={s.key} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1 w-20">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
                s.status === 'done' ? 'bg-teal-500 text-white' :
                s.status === 'current' ? 'bg-navy-800 text-white ring-2 ring-navy-200' :
                'bg-gray-100 text-gray-400'
              }`}>
                {s.status === 'done' ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] text-center leading-tight ${s.status === 'current' ? 'text-navy-800 font-semibold' : s.status === 'done' ? 'text-gray-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < stage.stages.length - 1 && (
              <div className={`h-0.5 w-4 flex-shrink-0 -mt-4 ${s.status === 'done' ? 'bg-teal-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// Workflow alignment fix — requirement 5: "Admin application page should
// show a clear completeness checklist." Mirrors exactly what Stage 1 of
// the pipeline checks (applications.service.ts#getCompleteness), so an
// admin sees precisely why an application is or isn't ready to clear the
// gate, instead of guessing from a raw pipeline error string.
const DOCUMENT_LABELS: Record<string, string> = {
  national_id: 'National ID Card',
  bac_diploma: 'Bac Diploma',
  university_acceptance: 'University Acceptance Letter',
  income_proof: 'Income Proof',
}

function CompletenessRow({ done, label, sub }: { done: boolean; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {done
        ? <CheckCircle size={16} className="text-teal-500 flex-shrink-0" />
        : <XCircle size={16} className="text-gray-300 flex-shrink-0" />}
      <span className={`text-sm ${done ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
      {sub && <span className="text-xs text-gray-400 ml-1">— {sub}</span>}
    </div>
  )
}

function CompletenessChecklist({ completeness }: { completeness: any }) {
  const guarantorLabel: Record<string, string> = {
    active: 'Accepted', pending_invitation: 'Pending', declined: 'Declined',
  }
  const guarantorDone = completeness.guarantor && ['active', 'pending_invitation'].includes(completeness.guarantor.status)

  return (
    <Card className={completeness.allComplete ? 'border-teal-200 bg-teal-50/30' : 'border-amber-200 bg-amber-50/30'}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Completeness Checklist</h3>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${completeness.allComplete ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
          {completeness.allComplete ? 'Ready for Stage 1' : 'Incomplete'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-6">
        <div>
          <CompletenessRow done={completeness.programSelected} label="Program selected" />
          {completeness.documents.map((d: any) => (
            <CompletenessRow key={d.type} done={['verified', 'under_review'].includes(d.status)}
              label={DOCUMENT_LABELS[d.type] || d.type}
              sub={d.status !== 'absent' ? d.status.replace(/_/g, ' ') : undefined} />
          ))}
        </div>
        <div>
          <CompletenessRow done={!!guarantorDone}
            label={completeness.guarantor ? `Guarantor: ${completeness.guarantor.name}` : 'Guarantor invited'}
            sub={completeness.guarantor ? guarantorLabel[completeness.guarantor.status] || completeness.guarantor.status : 'not added yet'} />
        </div>
      </div>
    </Card>
  )
}
