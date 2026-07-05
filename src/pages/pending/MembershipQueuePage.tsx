// Phase 2 T-203/T-204 — Membership Request -> Bronze issuance queue.
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membershipApi } from '../../lib/api'
import { Card, Table, Pagination, EmptyState, Modal, Alert, LoadingSpinner as Spinner, Tabs } from '../../components/ui'
import { UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { useToastContext } from '../../context/ToastContext'
import clsx from 'clsx'

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-amber-50 text-amber-700', label: 'Pending Review' },
  approved: { color: 'bg-green-50 text-green-700', label: 'Approved · Bronze' },
  rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
}

export default function MembershipQueuePage() {
  const { toast } = useToastContext()
  const qc = useQueryClient()
  const [tab, setTab] = useState('pending')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<any>(null)
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['membership-requests', tab],
    queryFn: () => membershipApi.list({ status: tab === 'all' ? undefined : tab }).then(r => r.data),
  })

  const requests: any[] = data || []
  const pageSize = 20
  const paged = requests.slice((page - 1) * pageSize, page * pageSize)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  const approveMutation = useMutation({
    mutationFn: (id: string) => membershipApi.approve(id),
    onSuccess: () => {
      toast('Membership approved — Bronze issued, set-password email sent', 'success')
      qc.invalidateQueries({ queryKey: ['membership-requests'] })
      setSelected(null)
    },
    onError: (err: any) => toast(err?.response?.data?.message || 'Approval failed', 'error'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => membershipApi.reject(id, rejectReason),
    onSuccess: () => {
      toast('Membership request rejected', 'error')
      qc.invalidateQueries({ queryKey: ['membership-requests'] })
      setShowReject(false); setRejectReason(''); setSelected(null)
    },
    onError: (err: any) => toast(err?.response?.data?.message || 'Rejection failed', 'error'),
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Membership Queue</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Review Membership Requests — approval issues Bronze membership and a set-password email
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending Review', value: pendingCount, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Total', value: requests.length, color: 'text-gray-700', bg: 'bg-gray-50' },
        ].map(s => (
          <div key={s.label} className={clsx('rounded-xl p-3 text-center', s.bg)}>
            <p className={clsx('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <Card padding={false}>
        <Tabs
          tabs={[
            { id: 'pending', label: 'Pending', count: pendingCount },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All' },
          ]}
          active={tab}
          onChange={t => { setTab(t); setPage(1) }}
        />

        {isLoading ? <Spinner className="h-40" />
          : requests.length === 0 ? (
            <EmptyState icon={UserPlus} title="No membership requests"
              description="New Membership Requests submitted through the public intake form will appear here." />
          ) : (
            <Table headers={['Name', 'Contact', 'University', 'Programme', 'Submitted', 'Status', 'Actions']} loading={false}>
              {paged.map((r: any) => {
                const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
                return (
                  <tr key={r.id} className="table-row">
                    <td className="table-td pl-5">
                      <p className="text-sm font-medium text-gray-900">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-gray-400 capitalize">{r.current_or_future_student} student</p>
                    </td>
                    <td className="table-td text-xs text-gray-500">
                      <p>{r.email}</p>
                      <p>{r.phone}</p>
                    </td>
                    <td className="table-td text-sm text-gray-700">{r.university_name || '—'}</td>
                    <td className="table-td text-sm text-gray-700">
                      {r.programme} <span className="text-gray-400">· {r.academic_year}</span>
                    </td>
                    <td className="table-td text-xs text-gray-500">
                      {r.created_at ? format(new Date(r.created_at), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="table-td">
                      <span className={clsx('badge', cfg.color)}>{cfg.label}</span>
                    </td>
                    <td className="table-td pr-5">
                      {r.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => approveMutation.mutate(r.id)}
                            disabled={approveMutation.isPending}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve — issue Bronze membership">
                            <CheckCircle size={14} />
                          </button>
                          <button onClick={() => { setSelected(r); setShowReject(true) }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject">
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
                      {r.status === 'rejected' && r.rejection_reason && (
                        <span className="text-xs text-gray-400" title={r.rejection_reason}>
                          <Clock size={12} className="inline me-1" />Reason on file
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </Table>
          )}

        <Pagination page={page} totalPages={Math.max(1, Math.ceil(requests.length / pageSize))} onPageChange={setPage} total={requests.length} />
      </Card>

      {/* Reject modal */}
      <Modal open={showReject} onClose={() => { setShowReject(false); setRejectReason('') }} title="Reject Membership Request">
        <div className="space-y-4">
          <Alert type="warning" message="This request will be marked rejected. No account is created." />
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Reason for rejection *</label>
            <textarea className="input h-24 resize-none text-sm" value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Duplicate request, ineligible university, incomplete information…" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowReject(false); setRejectReason('') }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => rejectMutation.mutate(selected?.id)}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
              Reject Request
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
