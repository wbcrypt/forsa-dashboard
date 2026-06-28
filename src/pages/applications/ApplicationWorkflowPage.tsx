// src/pages/applications/ApplicationWorkflowPage.tsx
// V2 approval workflow: Applied → AI Interview → Internal Review → Pre-Approved → 
// Document Verification → Contracts Signed → Approved → University Payment → Active Student

import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi } from '../../lib/api'
import { Card, Badge, Alert, Modal, Spinner, ErrorState } from '../../components/ui'
import { AIReportPanel } from '../../components/AIReportPanel'
import { ActivationChecklist } from '../../components/ActivationChecklist'
import {
  ArrowLeft, CheckCircle, Clock, ChevronRight, Brain,
  FileText, Shield, Building2, GraduationCap, Loader2,
  AlertTriangle, Lock, Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { useToastContext } from '../../context/ToastContext'

// V2 workflow stages
const WORKFLOW_STAGES = [
  {
    key: 'applied',
    label: 'Applied',
    desc: 'Student submitted application through FORSA portal',
    icon: FileText,
    color: 'bg-gray-100 text-gray-600',
    activeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    statuses: ['new_lead', 'applied', 'contacted'],
  },
  {
    key: 'ai_interview_completed',
    label: 'AI Interview',
    desc: 'Student completed the FORSA readiness interview',
    icon: Brain,
    color: 'bg-gray-100 text-gray-600',
    activeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    statuses: ['ai_interview_completed'],
  },
  {
    key: 'internal_review',
    label: 'Internal Review',
    desc: 'FORSA team reviewing application and AI report',
    icon: Shield,
    color: 'bg-gray-100 text-gray-600',
    activeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    statuses: ['internal_review', 'under_review', 'waiting_for_documents', 'documents_received'],
  },
  {
    key: 'pre_approved',
    label: 'Pre-Approved',
    desc: 'Application approved — documents requested',
    icon: CheckCircle,
    color: 'bg-gray-100 text-gray-600',
    activeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    statuses: ['pre_approved'],
  },
  {
    key: 'activation_meeting',
    label: 'Activation Meeting',
    desc: 'In-person meeting: identity, guarantor, contract & lettres de change signing',
    icon: Calendar,
    color: 'bg-gray-100 text-gray-600',
    activeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    statuses: ['activation_meeting'],
  },

  {
    key: 'contracts_signed',
    label: 'Contract Signed',
    desc: 'Financing agreement signed by all parties',
    icon: Lock,
    color: 'bg-gray-100 text-gray-600',
    activeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    statuses: ['contract_sent', 'contracts_signed', 'contract_signed'],
  },
  {
    key: 'approved',
    label: 'Approved',
    desc: 'Final approval — ready for university payment',
    icon: CheckCircle,
    color: 'bg-gray-100 text-gray-600',
    activeColor: 'bg-green-50 text-green-700 border-green-200',
    statuses: ['approved_level1', 'approved_level2', 'approved_level3'],
  },
  {
    key: 'university_payment',
    label: 'University Payment',
    desc: 'Tuition payment sent to university',
    icon: Building2,
    color: 'bg-gray-100 text-gray-600',
    activeColor: 'bg-green-50 text-green-700 border-green-200',
    statuses: ['university_paid', 'university_payment'],
  },
  {
    key: 'active_student',
    label: 'Active Student',
    desc: 'Student enrolled and repaying on schedule',
    icon: GraduationCap,
    color: 'bg-gray-100 text-gray-600',
    activeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    statuses: ['active_student', 'completed'],
  },
]

const STATUS_TO_STAGE_INDEX: Record<string, number> = {}
WORKFLOW_STAGES.forEach((stage, i) => {
  stage.statuses.forEach(s => { STATUS_TO_STAGE_INDEX[s] = i })
})

function WorkflowTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = STATUS_TO_STAGE_INDEX[currentStatus] ?? 0

  return (
    <div className="space-y-0">
      {WORKFLOW_STAGES.map((stage, i) => {
        const Icon = stage.icon
        const isCompleted = i < currentIdx
        const isCurrent = i === currentIdx
        const isPending = i > currentIdx
        const isRejected = currentStatus === 'rejected' && i > 0

        return (
          <div key={stage.key} className="flex gap-4">
            {/* Connector */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all ${
                isCompleted ? 'bg-teal-500 border-teal-500' :
                isCurrent ? 'bg-navy-800 border-navy-800' :
                'bg-gray-100 border-gray-200'
              }`}>
                {isCompleted
                  ? <CheckCircle size={16} className="text-white" />
                  : isCurrent
                  ? <Icon size={16} className="text-white" />
                  : <Icon size={16} className="text-gray-400" />
                }
              </div>
              {i < WORKFLOW_STAGES.length - 1 && (
                <div className={`w-0.5 flex-1 my-1 transition-all ${isCompleted ? 'bg-teal-400' : 'bg-gray-100'}`}
                  style={{ minHeight: '24px' }} />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-5 ${i === WORKFLOW_STAGES.length - 1 ? '' : ''}`}>
              <div className={`p-3 rounded-xl border transition-all ${
                isCurrent ? 'border-navy-200 bg-navy-50/50' :
                isCompleted ? 'border-teal-100 bg-teal-50/30' :
                'border-transparent'
              }`}>
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${
                    isCurrent ? 'text-navy-800' :
                    isCompleted ? 'text-teal-700' :
                    'text-gray-400'
                  }`}>{stage.label}</p>
                  {isCurrent && (
                    <span className="text-xs bg-navy-800 text-white px-2 py-0.5 rounded-full font-medium">
                      Current
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-xs text-teal-500 font-medium">✓ Done</span>
                  )}
                </div>
                {(isCurrent || isCompleted) && (
                  <p className={`text-xs mt-0.5 ${isCurrent ? 'text-navy-600' : 'text-teal-600'}`}>
                    {stage.desc}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ApplicationWorkflowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { toast } = useToastContext()
  const [showAdvance, setShowAdvance] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [notes, setNotes] = useState('')
  const [tab, setTab] = useState<'workflow' | 'ai_report' | 'details'>('workflow')

  const { data: app, isLoading, isError, refetch } = useQuery({
    queryKey: ['application-workflow', id],
    queryFn: () => applicationsApi.get(id!).then(r => r.data),
    enabled: !!id,
  })

  const advanceMutation = useMutation({
    mutationFn: (newStatus: string) =>
      applicationsApi.updateStatus(id!, { status: newStatus, notes }),
    onSuccess: (_, newStatus) => {
      toast(`Status updated to ${newStatus.replace(/_/g, ' ')}`, 'success')
      qc.invalidateQueries({ queryKey: ['application-workflow', id] })
      setShowAdvance(false)
      setNotes('')
    },
    onError: () => toast('Failed to update status', 'error'),
  })

  const rejectMutation = useMutation({
    mutationFn: () => applicationsApi.updateStatus(id!, { status: 'rejected', notes }),
    onSuccess: () => {
      toast('Student placed in Bronze pathway', 'success')
      qc.invalidateQueries({ queryKey: ['application-workflow', id] })
      setShowReject(false)
      setNotes('')
    },
    onError: () => toast('Failed to update pathway', 'error'),
  })

  if (isLoading) return <Spinner className="h-64" />
  if (isError) return (
    <div className="space-y-4">
      <button onClick={() => navigate('/applications')} className="flex items-center gap-2 text-sm text-gray-500">
        <ArrowLeft size={15} /> Back
      </button>
      <ErrorState onRetry={refetch} />
    </div>
  )
  if (!app) return null

  const currentIdx = STATUS_TO_STAGE_INDEX[app.current_status] ?? 0
  const isRejected = app.current_status === 'rejected'
  const isCompleted = app.current_status === 'active_student' || app.current_status === 'completed'
  const nextStage = WORKFLOW_STAGES[currentIdx + 1]
  const canAdvance = !isRejected && !isCompleted && nextStage

  // Next status to transition to
  const getNextStatus = () => {
    const transitions: Record<string, string> = {
      'new_lead': 'ai_interview_completed',
      'applied': 'ai_interview_completed',
      'ai_interview_completed': 'internal_review',
      'internal_review': 'pre_approved',
      'under_review': 'pre_approved',
      'pre_approved': 'document_verification',
      'document_verification': 'contracts_signed',
      'contracts_signed': 'approved_level2',
      'contract_signed': 'approved_level2',
      'approved_level1': 'university_payment',
      'approved_level2': 'university_payment',
      'university_paid': 'active_student',
      'university_payment': 'active_student',
    }
    return transitions[app.current_status] || nextStage?.key
  }

  const aiReport = (() => {
    try { return app.ai_report ? JSON.parse(app.ai_report) : null } catch { return null }
  })()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to={`/applications/${id}`} className="p-2 hover:bg-gray-100 rounded-lg mt-0.5">
          <ArrowLeft size={15} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-11 h-11 bg-navy-800 rounded-xl flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {app.first_name?.[0]}{app.last_name?.[0]}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{app.first_name} {app.last_name}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge status={app.current_status} />
                <span className="text-xs text-gray-400">{app.university_name} · {app.program_name}</span>
                {app.interview_language && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    🧠 AI: {app.interview_language?.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-shrink-0">
          {canAdvance && (
            <button onClick={() => setShowAdvance(true)} className="btn-teal text-sm">
              <ChevronRight size={14} /> Advance to {nextStage?.label}
            </button>
          )}
          {!isRejected && !isCompleted && (
            <button onClick={() => setShowReject(true)} className="btn-secondary text-sm text-gray-600 hover:text-gray-700">
              Assign Bronze
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-400">Tuition</p>
          <p className="text-lg font-bold text-gray-900">{parseFloat(app.tuition_amount || '0').toLocaleString()} TND</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-400">AI Score</p>
          <p className="text-lg font-bold text-gray-900">{aiReport?.scores?.overall_forsa_score ?? '—'}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-400">Stage</p>
          <p className="text-lg font-bold text-gray-900">{currentIdx + 1}/9</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-100">
        {[
          { id: 'workflow', label: 'Workflow' },
          { id: 'ai_report', label: '🧠 AI Report' },
          { id: 'details', label: 'Details' },
          { id: 'activation', label: '✅ Activation Checklist' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              tab === t.id ? 'text-navy-800 border-navy-800' : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Workflow tab */}
      {tab === 'workflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-5">
              Application Pipeline
            </p>
            {isRejected ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🥉</span>
                  <p className="text-sm font-semibold text-amber-800">🥉 Bronze Member</p>
                </div>
                <p className="text-xs text-amber-600 mt-1">Applicant has been placed in the FORSA Bronze pathway.</p>
              </div>
            ) : isCompleted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <p className="text-sm font-semibold text-green-800">Student is Active</p>
                </div>
              </div>
            ) : null}
            <WorkflowTimeline currentStatus={app.current_status} />
          </Card>

          {/* Status history */}
          <Card>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Timeline</p>
            <StatusHistory applicationId={id!} />
          </Card>
        </div>
      )}

      {/* AI Report tab */}
      {tab === 'ai_report' && (
        <AIReportPanel
          report={aiReport}
          transcript={app.interview_transcript}
          interviewLanguage={app.interview_language}
          applicationId={id!}
        />
      )}

      {/* Activation checklist tab */}
      {tab === 'activation' && (
        <ActivationChecklist
          applicationId={id!}
          savedChecklist={(() => {
            try {
              const h = (app as any).activation_checklist
              return h ? JSON.parse(h) : {}
            } catch { return {} }
          })()}
          meetingNotes={(app as any).activation_notes || ''}
        />
      )}

      {/* Details tab */}
      {tab === 'details' && (
        <Card>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Student', value: `${app.first_name} ${app.last_name}` },
              { label: 'Email', value: app.email || '—' },
              { label: 'University', value: app.university_name || '—' },
              { label: 'Program', value: app.program_name || '—' },
              { label: 'Academic Year', value: app.academic_year },
              { label: 'Tuition', value: `${parseFloat(app.tuition_amount || '0').toLocaleString()} TND` },
              { label: 'Applied', value: app.lead_date ? format(new Date(app.lead_date), 'dd MMM yyyy') : '—' },
              { label: 'Interview Lang', value: app.interview_language?.toUpperCase() || '—' },
              { label: 'AI Score', value: aiReport?.scores?.overall_forsa_score || '—' },
              { label: 'AI Recommendation', value: aiReport?.recommendation || '—' },
            ].map(item => (
              <div key={item.label} className="flex gap-2">
                <dt className="text-xs text-gray-400 w-28 flex-shrink-0">{item.label}</dt>
                <dd className="text-sm text-gray-700">{item.value}</dd>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Advance Modal */}
      <Modal open={showAdvance} onClose={() => setShowAdvance(false)} title={`Advance to ${nextStage?.label}`}>
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <p className="text-sm font-medium text-teal-800">
              Moving: <Badge status={app.current_status} /> → <span className="font-semibold">{nextStage?.label}</span>
            </p>
            <p className="text-xs text-teal-600 mt-1">{nextStage?.desc}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Notes (optional)</label>
            <textarea className="input h-20 resize-none text-sm" value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any notes about this status change…" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAdvance(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => advanceMutation.mutate(getNextStatus())}
              disabled={advanceMutation.isPending} className="btn-teal flex-1">
              {advanceMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
              Confirm
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal open={showReject} onClose={() => setShowReject(false)} title="Assign to Bronze Pathway">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">The student will be placed in the <strong>FORSA Bronze pathway</strong>. They will keep their account, their FORSA Score, and priority consideration in the next financing cycle. They will be notified with a positive Bronze membership message.</div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Notes for internal record (optional)</label>
            <textarea className="input h-24 resize-none text-sm" value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Internal note — why Bronze? (not shown to student)" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowReject(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
              className="flex-1 py-2 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50">
              {rejectMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              🥉 Assign to Bronze
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function StatusHistory({ applicationId }: { applicationId: string }) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['app-status-history', applicationId],
    queryFn: () => applicationsApi.getStatusHistory(applicationId).then(r => r.data),
  })

  if (isLoading) return <Spinner className="h-20" />
  if (!history?.length) return <p className="text-sm text-gray-400">No history yet</p>

  return (
    <div className="space-y-3">
      {history.map((h: any, i: number) => (
        <div key={h.id || i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 bg-navy-800 rounded-full mt-1.5 flex-shrink-0" />
            {i < history.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
          </div>
          <div className="pb-3">
            {h.to_status && <Badge status={h.to_status} />}
            {h.notes && <p className="text-xs text-gray-500 mt-1">{h.notes}</p>}
            <p className="text-xs text-gray-400 mt-0.5">
              {h.changed_at ? format(new Date(h.changed_at), 'dd MMM yyyy · HH:mm') : ''}
              {h.changed_by_name ? ` · ${h.changed_by_name}` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
