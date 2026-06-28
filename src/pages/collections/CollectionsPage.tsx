import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collectionsApi } from '../../lib/api'
import { Card, StatCard, Badge, Table, Pagination, Tabs, LoadingSpinner, ErrorState, Modal, FormField, Alert } from '../../components/ui'
import { AlertTriangle, PhoneCall, TrendingDown, MessageSquare, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { useToastContext } from '../../context/ToastContext'

export default function CollectionsPage() {
  const [tab, setTab] = useState('worklist')
  const [page, setPage] = useState(1)
  const [contactModal, setContactModal] = useState<{ installmentId: string; studentName: string } | null>(null)
  const [contactForm, setContactForm] = useState({ method: 'phone', outcome: 'no_answer', notes: '', nextContactDate: '' })
  const { toast } = useToastContext()
  const qc = useQueryClient()

  const { data: dashboard, isError: dashError, refetch: refetchDash } = useQuery({
    queryKey: ['collections', 'dashboard'],
    queryFn: () => collectionsApi.getDashboard().then(r => r.data),
  })

  const { data: lateData, isLoading: lateLoading, isError: lateError } = useQuery({
    queryKey: ['collections', 'late', page],
    queryFn: () => collectionsApi.getLate({ page, limit: 20 }).then(r => r.data),
    enabled: tab === 'late',
  })

  const { data: worklist, isLoading: worklistLoading, isError: worklistError } = useQuery({
    queryKey: ['collections', 'worklist'],
    queryFn: () => collectionsApi.getWorklist().then(r => r.data),
    enabled: tab === 'worklist',
  })

  const logContactMutation = useMutation({
    mutationFn: (data: unknown) => collectionsApi.logContact(data),
    onSuccess: () => {
      toast('Contact logged successfully', 'success')
      qc.invalidateQueries({ queryKey: ['collections'] })
      setContactModal(null)
      setContactForm({ method: 'phone', outcome: 'no_answer', notes: '', nextContactDate: '' })
    },
    onError: () => toast('Failed to log contact', 'error'),
  })

  const late = lateData?.data || []
  const lateMeta = lateData?.meta || {}

  const urgencyClass = (days: number) => {
    if (days >= 30) return 'text-red-600 font-bold'
    if (days >= 15) return 'text-orange-600 font-semibold'
    if (days >= 7) return 'text-yellow-600 font-medium'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Collections</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overdue installments and follow-up management</p>
        </div>
      </div>

      {dashError && <ErrorState onRetry={refetchDash} message="Could not load collections overview" />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Late Installments" value={dashboard?.late_count || 0} icon={AlertTriangle} color="orange"
          subValue={`${parseFloat(dashboard?.late_amount || 0).toLocaleString()} TND`} />
        <StatCard label="At-Risk" value={dashboard?.default_risk_count || 0} icon={TrendingDown} color="red"
          subValue={`${parseFloat(dashboard?.default_risk_amount || 0).toLocaleString()} TND`} />
        <StatCard label="Defaulted" value={dashboard?.defaulted_count || 0} icon={AlertTriangle} color="red"
          subValue={`${parseFloat(dashboard?.defaulted_amount || 0).toLocaleString()} TND`} />
        <StatCard label="Total Overdue"
          value={`${(parseFloat(dashboard?.late_amount || '0') + parseFloat(dashboard?.default_risk_amount || '0')).toLocaleString()} TND`}
          color="red" />
      </div>

      <Card padding={false}>
        <Tabs
          tabs={[
            { id: 'worklist', label: 'Priority Worklist', count: (worklist || []).length },
            { id: 'late', label: 'Late Installments', count: lateMeta.total },
          ]}
          active={tab}
          onChange={setTab}
        />

        <div className="p-5">
          {tab === 'worklist' && (
            worklistLoading ? <LoadingSpinner className="h-48" />
            : worklistError ? <ErrorState message="Could not load worklist" />
            : (worklist || []).length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} className="text-green-500" />
                </div>
                <p className="text-sm font-medium text-gray-700">All clear — no overdue payments!</p>
                <p className="text-xs text-gray-400 mt-1">All students are paying on time.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(worklist || []).map((item: Record<string, unknown>, i: number) => (
                  <div key={(item.id as string) || i}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i < 3 ? 'bg-red-100 text-red-700' : i < 7 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{i + 1}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.first_name as string} {item.last_name as string}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(item.phone_primary as string) || 'No phone'} · Score: {(item.aggregate_score as number) || 500}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {parseFloat((item.outstanding as string) || '0').toLocaleString()} TND
                        </p>
                        <p className={`text-xs ${urgencyClass(item.days_overdue as number)}`}>
                          {item.days_overdue as number} days overdue
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{(item.contact_attempts as number) || 0} contacts</p>
                        {item.last_contact_at && (
                          <p className="text-xs text-gray-400">
                            Last: {format(new Date(item.last_contact_at as string), 'dd MMM')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setContactModal({ installmentId: item.id as string, studentName: `${item.first_name} ${item.last_name}` })}
                        className="btn-secondary text-xs">
                        <PhoneCall size={12} /> Contact
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'late' && (
            lateError ? <ErrorState message="Could not load late installments" />
            : (
              <>
                <Table headers={['Student', 'University', 'Due Date', 'Days Late', 'Amount Due', 'Status']} loading={lateLoading}>
                  {late.map((item: Record<string, unknown>) => (
                    <tr key={item.id as string} className="table-row">
                      <td className="table-td pl-5">
                        <p className="text-sm font-medium text-gray-900">{item.first_name as string} {item.last_name as string}</p>
                        <p className="text-xs text-gray-400">{item.email as string}</p>
                      </td>
                      <td className="table-td text-xs text-gray-500">{(item.university_name as string) || '—'}</td>
                      <td className="table-td text-xs text-gray-500">
                        {item.due_date ? format(new Date(item.due_date as string), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="table-td">
                        <span className={`text-sm font-semibold ${urgencyClass(item.days_overdue as number)}`}>
                          {(item.days_overdue as number) || 0}d
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm font-semibold text-gray-900">
                          {(parseFloat((item.amount as string) || '0') - parseFloat((item.amount_paid as string) || '0')).toLocaleString()} TND
                        </span>
                      </td>
                      <td className="table-td pr-5"><Badge status={item.status as string} /></td>
                    </tr>
                  ))}
                </Table>
                <Pagination page={page} totalPages={lateMeta.totalPages || 1} onPageChange={setPage} total={lateMeta.total || 0} />
              </>
            )
          )}
        </div>
      </Card>

      {/* Log Contact Modal */}
      <Modal open={!!contactModal} onClose={() => setContactModal(null)} title={`Log Contact — ${contactModal?.studentName || ''}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Contact Method">
              <select className="input" value={contactForm.method} onChange={e => setContactForm(f => ({ ...f, method: e.target.value }))}>
                <option value="phone">Phone Call</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="in_person">In Person</option>
              </select>
            </FormField>
            <FormField label="Outcome">
              <select className="input" value={contactForm.outcome} onChange={e => setContactForm(f => ({ ...f, outcome: e.target.value }))}>
                <option value="no_answer">No Answer</option>
                <option value="promise_to_pay">Promise to Pay</option>
                <option value="paid">Paid During Call</option>
                <option value="disputed">Disputed</option>
                <option value="hardship">Financial Hardship</option>
                <option value="wrong_number">Wrong Number</option>
              </select>
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea className="input h-20 resize-none" value={contactForm.notes}
              onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="What was discussed..." />
          </FormField>
          <FormField label="Next Contact Date" hint="Optional — schedule a follow-up">
            <input type="date" className="input" value={contactForm.nextContactDate}
              onChange={e => setContactForm(f => ({ ...f, nextContactDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]} />
          </FormField>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setContactModal(null)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => logContactMutation.mutate({
                installmentId: contactModal?.installmentId,
                method: contactForm.method,
                outcome: contactForm.outcome,
                notes: contactForm.notes,
                nextContactDate: contactForm.nextContactDate || undefined,
              })}
              disabled={logContactMutation.isPending}
              className="btn-primary">
              {logContactMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
              Log Contact
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
