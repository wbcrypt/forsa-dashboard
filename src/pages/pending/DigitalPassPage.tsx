// Phase 2 T-205/T-206 — Digital Student Pass administration.
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { digitalPassApi } from '../../lib/api'
import { Card, Table, EmptyState, Modal, Alert, LoadingSpinner as Spinner } from '../../components/ui'
import { QrCode, Ban } from 'lucide-react'
import { format } from 'date-fns'
import { useToastContext } from '../../context/ToastContext'
import clsx from 'clsx'

export default function DigitalPassPage() {
  const { toast } = useToastContext()
  const qc = useQueryClient()
  const [selected, setSelected] = useState<any>(null)
  const [reason, setReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['digital-passes'],
    queryFn: () => digitalPassApi.list().then(r => r.data),
  })

  const passes: any[] = data || []

  const revokeMutation = useMutation({
    mutationFn: (id: string) => digitalPassApi.revoke(id, reason),
    onSuccess: () => {
      toast('Digital Pass revoked', 'error')
      qc.invalidateQueries({ queryKey: ['digital-passes'] })
      setSelected(null); setReason('')
    },
    onError: (err: any) => toast(err?.response?.data?.message || 'Revoke failed', 'error'),
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Digital Student Pass</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Issued once on Bronze membership approval — never regenerated, only revoked
        </p>
      </div>

      <Card padding={false}>
        {isLoading ? <Spinner className="h-40" />
          : passes.length === 0 ? (
            <EmptyState icon={QrCode} title="No passes issued yet"
              description="A Digital Student Pass is issued automatically the moment a Membership Request is approved." />
          ) : (
            <Table headers={['Student', 'FORSA ID', 'Membership', 'Issued', 'Status', 'Actions']} loading={false}>
              {passes.map((p: any) => (
                <tr key={p.id} className="table-row">
                  <td className="table-td pl-5 text-sm font-medium text-gray-900">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="table-td text-xs font-mono text-gray-600">{p.forsa_id || '—'}</td>
                  <td className="table-td text-sm text-gray-700 capitalize">{p.membership_status || '—'}</td>
                  <td className="table-td text-xs text-gray-500">
                    {p.issued_at ? format(new Date(p.issued_at), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="table-td">
                    <span className={clsx('badge', p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-100 text-red-700')}>
                      {p.status === 'active' ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="table-td pr-5">
                    {p.status === 'active' && (
                      <button onClick={() => setSelected(p)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Revoke pass">
                        <Ban size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
      </Card>

      <Modal open={!!selected} onClose={() => { setSelected(null); setReason('') }} title="Revoke Digital Pass">
        <div className="space-y-4">
          <Alert type="warning" message={`This will invalidate ${selected?.first_name}'s pass. The QR code will no longer verify as valid.`} />
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Reason for revocation *</label>
            <textarea className="input h-24 resize-none text-sm" value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Lost/stolen device, fraud confirmed, membership suspended…" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setSelected(null); setReason('') }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => revokeMutation.mutate(selected?.id)}
              disabled={revokeMutation.isPending || !reason.trim()}
              className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
              Revoke Pass
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
