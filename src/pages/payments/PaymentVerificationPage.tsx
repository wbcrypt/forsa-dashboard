// src/pages/payments/PaymentVerificationPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { paymentsApi } from '../../lib/api'
import api from '../../lib/api'
import { Card, Badge, Table, Pagination, EmptyState, ErrorState, Modal, Alert, Spinner, Tabs } from '../../components/ui'
import {
  CreditCard, CheckCircle, XCircle, Clock, AlertTriangle,
  Download, Search, X, Eye, Filter, FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { useToastContext } from '../../context/ToastContext'
import clsx from 'clsx'

const PAYMENT_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-gray-100 text-gray-600', label: 'Pending' },
  receipt_uploaded: { color: 'bg-blue-50 text-blue-700', label: 'Receipt Uploaded' },
  under_verification: { color: 'bg-purple-50 text-purple-700', label: 'Under Verification' },
  verified: { color: 'bg-green-50 text-green-700', label: 'Verified ✓' },
  late: { color: 'bg-red-50 text-red-600', label: 'Late' },
  rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
  paid: { color: 'bg-green-50 text-green-700', label: 'Paid' },
}

export default function PaymentVerificationPage() {
  const { toast } = useToastContext()
  const qc = useQueryClient()
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [showVerify, setShowVerify] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [verifyNotes, setVerifyNotes] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['payment-receipts', tab, page, search],
    queryFn: () => api.get('/api/v1/payments/receipts', {
      params: { status: tab === 'all' ? undefined : tab, page, limit: 20, search: search || undefined }
    }).then(r => r.data).catch(() => ({ data: [], meta: { total: 0, totalPages: 1 } })),
  })

  const payments = data?.data || []
  const meta = data?.meta || { total: 0, totalPages: 1 }

  const verifyMutation = useMutation({
    mutationFn: (paymentId: string) =>
      api.patch(`/api/v1/payments/${paymentId}/verify`, { status: 'verified', notes: verifyNotes }),
    onSuccess: () => {
      toast('Payment verified', 'success')
      qc.invalidateQueries({ queryKey: ['payment-receipts'] })
      setShowVerify(false); setVerifyNotes('')
    },
    onError: () => toast('Verification failed', 'error'),
  })

  const rejectMutation = useMutation({
    mutationFn: (paymentId: string) =>
      api.patch(`/api/v1/payments/${paymentId}/verify`, { status: 'rejected', reason: rejectReason }),
    onSuccess: () => {
      toast('Payment rejected', 'error')
      qc.invalidateQueries({ queryKey: ['payment-receipts'] })
      setShowReject(false); setRejectReason('')
    },
    onError: () => toast('Rejection failed', 'error'),
  })

  const exportCSV = () => {
    const headers = ['Student', 'Amount', 'Due Date', 'Paid Date', 'Method', 'Reference', 'Status', 'Bank']
    const rows = payments.map((p: any) => [
      `${p.student_first_name || ''} ${p.student_last_name || ''}`,
      p.amount || '', p.due_date || '', p.payment_date || '',
      p.payment_method || '', p.reference_number || '',
      p.status || '', p.bank_name || '',
    ])
    const csv = [headers.join(','), ...rows.map((r: any[]) => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `forsa-payments-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click()
  }

  const lateCount = payments.filter((p: any) => p.status === 'late' || p.status === 'default_risk').length
  const pendingVerification = payments.filter((p: any) => p.status === 'receipt_uploaded').length

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Payment Verification</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Traditional payment management — bank transfer & cash deposit
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary text-sm">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Alert badges */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending Verification', value: pendingVerification, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Late Payments', value: lateCount, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Total', value: meta.total || payments.length, color: 'text-gray-700', bg: 'bg-gray-50' },
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
            { id: 'all', label: 'All' },
            { id: 'receipt_uploaded', label: 'Receipt Uploaded', count: pendingVerification },
            { id: 'under_verification', label: 'Under Verification' },
            { id: 'verified', label: 'Verified' },
            { id: 'late', label: 'Late', count: lateCount },
            { id: 'rejected', label: 'Rejected' },
          ]}
          active={tab}
          onChange={t => { setTab(t); setPage(1) }}
        />

        <div className="flex items-center gap-3 p-4 border-b border-gray-50">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search student name…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} className="input pl-9 text-sm" />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {isLoading ? <Spinner className="h-40" />
          : payments.length === 0 ? (
            <EmptyState icon={CreditCard} title="No payments yet"
              description="Payments will appear here once students submit payment receipts." />
          ) : (
            <Table headers={['Student', 'Amount', 'Due Date', 'Payment Date', 'Method', 'Bank Ref', 'Status', 'Actions']} loading={false}>
              {payments.map((p: any) => {
                const statusCfg = PAYMENT_STATUS_CONFIG[p.status] || PAYMENT_STATUS_CONFIG.pending
                const hasReceipt = p.status === 'receipt_uploaded' || p.receipt_url
                return (
                  <tr key={p.id} className={clsx('table-row', p.status === 'late' && 'bg-red-50/20')}>
                    <td className="table-td pl-5">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {p.student_first_name} {p.student_last_name}
                        </p>
                        {p.application_id && (
                          <Link to={`/applications/${p.application_id}`}
                            className="text-xs text-teal-600 hover:text-teal-700">
                            View application →
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="table-td text-sm font-semibold text-gray-900">
                      {parseFloat(p.amount || '0').toLocaleString()} {p.currency || 'TND'}
                    </td>
                    <td className="table-td text-xs text-gray-500">
                      {p.due_date ? format(new Date(p.due_date), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="table-td text-xs text-gray-500">
                      {p.payment_date ? format(new Date(p.payment_date), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="table-td text-xs text-gray-500 capitalize">
                      {p.payment_method?.replace(/_/g, ' ') || '—'}
                    </td>
                    <td className="table-td text-xs font-mono text-gray-500">
                      {p.reference_number || '—'}
                    </td>
                    <td className="table-td">
                      <span className={clsx('badge', statusCfg.color)}>{statusCfg.label}</span>
                    </td>
                    <td className="table-td pr-5">
                      <div className="flex gap-1">
                        {hasReceipt && (
                          <button onClick={() => setSelectedPayment(p)}
                            className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-colors"
                            title="View receipt">
                            <Eye size={14} />
                          </button>
                        )}
                        {(p.status === 'receipt_uploaded' || p.status === 'under_verification' || p.status === 'pending') && (
                          <>
                            <button onClick={() => { setSelectedPayment(p); setShowVerify(true) }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Verify payment">
                              <CheckCircle size={14} />
                            </button>
                            <button onClick={() => { setSelectedPayment(p); setShowReject(true) }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject payment">
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </Table>
          )}

        <Pagination page={page} totalPages={meta.totalPages || 1} onPageChange={setPage} total={meta.total || payments.length} />
      </Card>

      {/* Receipt view modal */}
      {selectedPayment && !showVerify && !showReject && (
        <Modal open={true} onClose={() => setSelectedPayment(null)} title="Payment Details">
          <div className="space-y-3">
            {[
              { label: 'Student', value: `${selectedPayment.student_first_name} ${selectedPayment.student_last_name}` },
              { label: 'Amount', value: `${parseFloat(selectedPayment.amount || '0').toLocaleString()} ${selectedPayment.currency || 'TND'}` },
              { label: 'Payment Date', value: selectedPayment.payment_date ? format(new Date(selectedPayment.payment_date), 'dd MMM yyyy') : '—' },
              { label: 'Method', value: selectedPayment.payment_method?.replace(/_/g, ' ') || '—' },
              { label: 'Bank', value: selectedPayment.bank_name || '—' },
              { label: 'Reference', value: selectedPayment.reference_number || '—' },
              { label: 'Status', value: <span className={clsx('badge', (PAYMENT_STATUS_CONFIG[selectedPayment.status] || {}).color)}>{selectedPayment.status}</span> },
            ].map(item => (
              <div key={item.label} className="flex gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <dt className="text-xs text-gray-400 w-28 flex-shrink-0">{item.label}</dt>
                <dd className="text-sm text-gray-700">{item.value as any}</dd>
              </div>
            ))}
            {selectedPayment.notes && (
              <div className="mt-2 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">{selectedPayment.notes}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowVerify(true) }} className="btn-teal flex-1 text-sm">
                <CheckCircle size={14} /> Verify
              </button>
              <button onClick={() => { setShowReject(true) }} className="btn-secondary flex-1 text-sm text-red-600">
                <XCircle size={14} /> Reject
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Verify modal */}
      <Modal open={showVerify} onClose={() => { setShowVerify(false); setVerifyNotes('') }} title="Verify Payment">
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-medium text-green-800">
              Confirm payment of {parseFloat(selectedPayment?.amount || '0').toLocaleString()} TND
              {selectedPayment?.payment_date && ` on ${format(new Date(selectedPayment.payment_date), 'dd MMM yyyy')}`}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Verification notes</label>
            <textarea className="input h-20 resize-none text-sm" value={verifyNotes}
              onChange={e => setVerifyNotes(e.target.value)}
              placeholder="Add any verification notes (optional)…" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowVerify(false); setVerifyNotes('') }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => verifyMutation.mutate(selectedPayment?.id)}
              disabled={verifyMutation.isPending}
              className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
              ✓ Mark as Verified
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal open={showReject} onClose={() => { setShowReject(false); setRejectReason('') }} title="Reject Payment">
        <div className="space-y-4">
          <Alert type="warning" message="The student will be notified that their payment receipt was rejected." />
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Reason for rejection *</label>
            <textarea className="input h-24 resize-none text-sm" value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Wrong reference number, amount doesn't match, receipt unclear…" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowReject(false); setRejectReason('') }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => rejectMutation.mutate(selectedPayment?.id)}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
              Reject Payment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
