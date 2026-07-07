import React from 'react'
import clsx from 'clsx'
import { AlertCircle, CheckCircle, Info, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

// ─── Status Colors ────────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  new_lead: 'bg-gray-100 text-gray-600',
  contacted: 'bg-blue-50 text-blue-600',
  waiting_for_documents: 'bg-yellow-50 text-yellow-700',
  documents_received: 'bg-blue-50 text-blue-600',
  under_review: 'bg-purple-50 text-purple-600',
  more_info_required: 'bg-amber-50 text-amber-700',
  approved_level1: 'bg-green-50 text-green-700',
  approved_level2: 'bg-emerald-50 text-emerald-700',
  approved_level3: 'bg-teal-50 text-teal-700',
  rejected: 'bg-amber-50 text-amber-700',
  on_hold: 'bg-orange-50 text-orange-600',
  capital_queue: 'bg-yellow-50 text-yellow-700',
  fraud_flagged: 'bg-red-50 text-red-700',
  contract_sent: 'bg-blue-50 text-blue-600',
  contract_signed: 'bg-indigo-50 text-indigo-600',
  university_confirmed: 'bg-cyan-50 text-cyan-700',
  university_paid: 'bg-teal-50 text-teal-700',
  active_student: 'bg-green-50 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  withdrawn: 'bg-gray-100 text-gray-500',
  appealing: 'bg-orange-50 text-orange-600',
  // Application Workflow V2 vocabulary (ApplicationWorkflowPage) — kept alongside
  // the core 16-status machine above until they're unified (see D-004)
  applied: 'bg-blue-50 text-blue-700',
  ai_interview_completed: 'bg-purple-50 text-purple-700',
  internal_review: 'bg-amber-50 text-amber-700',
  pre_approved: 'bg-teal-50 text-teal-700',
  activation_meeting: 'bg-teal-50 text-teal-700',
  document_verification: 'bg-teal-50 text-teal-700',
  contracts_signed: 'bg-indigo-50 text-indigo-700',
  university_payment: 'bg-green-50 text-green-700',
  // Payment
  pending: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-green-50 text-green-700',
  reversed: 'bg-red-50 text-red-600',
  paid: 'bg-green-50 text-green-700',
  partial: 'bg-blue-50 text-blue-600',
  late: 'bg-red-50 text-red-600',
  due_soon: 'bg-yellow-50 text-yellow-600',
  due_today: 'bg-orange-50 text-orange-700',
  default_risk: 'bg-red-100 text-red-700',
  defaulted: 'bg-red-900/10 text-red-800',
  waived: 'bg-gray-100 text-gray-500',
  // Guarantor invitation lifecycle
  pending_invitation: 'bg-amber-50 text-amber-700',
  declined: 'bg-red-50 text-red-600',
  // University / Partner
  active: 'bg-green-50 text-green-700',
  prospect: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-50 text-red-600',
  terminated: 'bg-gray-100 text-gray-500',
  inactive: 'bg-gray-100 text-gray-500',
  negotiation: 'bg-blue-50 text-blue-600',
  contact: 'bg-purple-50 text-purple-600',
  // Score bands
  high_risk: 'bg-red-50 text-red-700',
  medium_trust: 'bg-yellow-50 text-yellow-700',
  good_trust: 'bg-blue-50 text-blue-700',
  very_good_trust: 'bg-green-50 text-green-700',
  elite_trust: 'bg-teal-50 text-teal-700',
  // Documents
  uploaded: 'bg-blue-50 text-blue-600',
  verified: 'bg-green-50 text-green-700',
  absent: 'bg-gray-100 text-gray-500',
  expired: 'bg-orange-50 text-orange-600',
  superseded: 'bg-gray-100 text-gray-400',
  // Pipeline stages
  passed: 'bg-green-50 text-green-700',
  blocked: 'bg-red-50 text-red-600',
  needs_review: 'bg-yellow-50 text-yellow-700',
  // Users
  pending_verification: 'bg-yellow-50 text-yellow-700',
  deactivated: 'bg-gray-100 text-gray-400',
  // Commissions
  lead: 'bg-gray-100 text-gray-500',
  eligible: 'bg-blue-50 text-blue-600',
  approved: 'bg-green-50 text-green-700',
  payable: 'bg-teal-50 text-teal-700',
  clawed_back: 'bg-red-50 text-red-600',
  cancelled: 'bg-gray-100 text-gray-400',
  // Contracts
  draft: 'bg-gray-100 text-gray-500',
  sent_for_signature: 'bg-blue-50 text-blue-600',
  partially_signed: 'bg-indigo-50 text-indigo-600',
  fully_signed: 'bg-green-50 text-green-700',
  amended: 'bg-orange-50 text-orange-600',
  voided: 'bg-red-50 text-red-500',
}

const statusLabels: Record<string, string> = {
  pending_invitation: 'Pending Invitation',
  declined: 'Declined',
  new_lead: 'New Lead',
  rejected: '🥉 Bronze Pathway',
  waiting_for_documents: 'Waiting for Docs',
  documents_received: 'Docs Received',
  under_review: 'Under Review',
  more_info_required: 'More Info Required',
  approved_level1: 'Approved L1',
  approved_level2: 'Approved L2',
  approved_level3: 'Approved L3',
  active_student: 'Active',
  capital_queue: 'Waiting List',
  fraud_flagged: 'Fraud — Blacklisted',
  contract_sent: 'Contract Sent',
  contract_signed: 'Signed',
  university_confirmed: 'University Confirmed',
  university_paid: 'University Paid',
  default_risk: 'Default Risk',
  pending_verification: 'Pending Verification',
  sent_for_signature: 'Sent for Signature',
  partially_signed: 'Partially Signed',
  fully_signed: 'Fully Signed',
  high_risk: 'High Risk',
  medium_trust: 'Medium',
  good_trust: 'Good',
  very_good_trust: 'Very Good',
  elite_trust: 'Elite',
  due_soon: 'Due Soon',
  due_today: 'Due Today',
  // Application Workflow V2 vocabulary
  applied: 'Applied',
  ai_interview_completed: 'AI Interview',
  internal_review: 'Internal Review',
  pre_approved: 'Pre-Approved',
  activation_meeting: 'Activation Meeting',
  document_verification: 'Activation Meeting',
  contracts_signed: 'Contract Signed',
  university_payment: 'University Payment',
}

export function Badge({ status, label }: { status: string; label?: string }) {
  const color = statusColors[status] || 'bg-gray-100 text-gray-600'
  const displayLabel = label || statusLabels[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return (
    <span className={clsx('badge', color)}>{displayLabel}</span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className, padding = true }: {
  children: React.ReactNode; className?: string; padding?: boolean
}) {
  return (
    <div className={clsx('card', padding && 'p-5', className)}>
      {children}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'navy', subValue }: {
  label: string; value: string | number; icon?: React.ElementType
  color?: 'navy' | 'teal' | 'green' | 'red' | 'orange'; subValue?: string
}) {
  const colors = {
    navy: 'bg-navy-50 text-navy-700',
    teal: 'bg-teal-50 text-teal-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    orange: 'bg-orange-50 text-orange-700',
  }
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1 truncate">{value}</p>
          {subValue && <p className="text-xs text-gray-400 mt-0.5 truncate">{subValue}</p>}
        </div>
        {Icon && (
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3', colors[color])}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title: string
  children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-modal w-full animate-fade-in max-h-[90vh] flex flex-col', sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ headers, children, empty, loading }: {
  headers: string[]; children?: React.ReactNode; empty?: string; loading?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {headers.map(h => <th key={h} className="table-th first:pl-5 last:pr-5">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {headers.map((_, j) => (
                    <td key={j} className="table-td first:pl-5 last:pr-5">
                      <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            : children
          }
        </tbody>
      </table>
      {!loading && !children && empty && (
        <div className="text-center py-16 text-sm text-gray-400">{empty}</div>
      )}
      {!loading && React.Children.count(children) === 0 && !empty && (
        <div className="text-center py-16 text-sm text-gray-400">No records found</div>
      )}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPageChange, total }: {
  page: number; totalPages: number; onPageChange: (p: number) => void; total: number
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-500">{total.toLocaleString()} records</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft size={15} />
        </button>
        <span className="text-xs text-gray-500 px-2">{page} / {totalPages}</span>
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Alert ────────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', message, onClose, className }: {
  type?: 'success' | 'error' | 'warning' | 'info'; message: string; onClose?: () => void; className?: string
}) {
  const styles = {
    success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', Icon: CheckCircle },
    error: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', Icon: AlertCircle },
    warning: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', Icon: AlertCircle },
    info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', Icon: Info },
  }
  const { bg, text, Icon } = styles[type]
  return (
    <div className={clsx('flex items-start gap-3 p-4 rounded-xl border text-sm mb-4', bg, text, className)}>
      <Icon size={16} className="mt-0.5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onClose && <button onClick={onClose} aria-label="Dismiss" className="opacity-60 hover:opacity-100 flex-shrink-0"><X size={14} /></button>}
    </div>
  )
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <Loader2 size={24} className="text-navy-800 animate-spin" />
    </div>
  )
}

// ─── ErrorState ───────────────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-red-400" />
      </div>
      <p className="text-sm font-medium text-gray-700">Something went wrong</p>
      <p className="text-xs text-gray-400 mt-1">{message || 'Failed to load data. Please try again.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-4 text-xs">Try again</button>
      )}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }: {
  icon?: React.ElementType; title: string; description?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      {Icon && (
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={24} className="text-gray-400" />
        </div>
      )}
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── FormField ────────────────────────────────────────────────────────────────
export function FormField({ label, error, required, hint, children }: {
  label: string; error?: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }: {
  tabs: { id: string; label: string; count?: number }[]
  active: string; onChange: (id: string) => void
}) {
  return (
    <div className="flex border-b border-gray-100 overflow-x-auto">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={clsx(
            'px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap',
            active === tab.id
              ? 'text-navy-800 border-navy-800'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-200'
          )}>
          {tab.label}
          {tab.count !== undefined && (
            <span className={clsx('text-xs px-1.5 py-0.5 rounded-full',
              active === tab.id ? 'bg-navy-100 text-navy-700' : 'bg-gray-100 text-gray-500')}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void
  title: string; message: string; confirmLabel?: string; danger?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-5">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>{confirmLabel}</button>
      </div>
    </Modal>
  )
}
export const Spinner = ({ className = '' }: { className?: string }) => <div className={className} />

// ─── Membership Tier Badge ──────────────────────────────────────────────────
// Students/StudentDetail pages both only ever showed the generic lifecycle
// `status` (active/lead/etc, "active" for nearly every real member) — the
// actual Bronze/Silver/Gold membership_status was never rendered anywhere in
// the admin dashboard's student views, so every row/header looked identical
// regardless of tier.
export const TIER_STYLE: Record<string, { label: string; icon: string; text: string; bg: string }> = {
  gold: { label: 'Gold', icon: '🥇', text: 'text-amber-700', bg: 'bg-amber-50' },
  silver: { label: 'Silver', icon: '🥈', text: 'text-gray-600', bg: 'bg-gray-100' },
  bronze: { label: 'Bronze', icon: '🥉', text: 'text-orange-700', bg: 'bg-orange-50' },
}

export function TierBadge({ tier }: { tier?: string }) {
  const style = tier ? TIER_STYLE[tier] : undefined
  if (!style) return <span className="text-xs text-gray-300">—</span>
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
      {style.icon} {style.label}
    </span>
  )
}
