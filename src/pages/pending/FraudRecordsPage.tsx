// Phase 2 T-217 — permanent blacklist / fraud record trail.
import { useQuery } from '@tanstack/react-query'
import { ShieldAlert } from 'lucide-react'
import { Card, Table, EmptyState, LoadingSpinner as Spinner } from '../../components/ui'
import { pipelineApi } from '../../lib/api'
import { format } from 'date-fns'

export default function FraudRecordsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['fraud-records'],
    queryFn: () => pipelineApi.listFraudRecords().then(r => r.data),
  })

  const records: any[] = data || []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Fraud Records</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Permanent blacklist trail — flagging fraud immediately blocks all future membership and financing requests for that identity
        </p>
      </div>

      <Card padding={false}>
        {isLoading ? <Spinner className="h-40" />
          : records.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="No fraud records"
              description="Confirmed fraud flagged from a pipeline review (forged documents, false identity, false guarantor, material misrepresentation) appears here." />
          ) : (
            <Table headers={['Student', 'FORSA ID', 'Reason', 'Flagged', 'Evidence']} loading={false}>
              {records.map((r: any) => (
                <tr key={r.id} className="table-row">
                  <td className="table-td pl-5">
                    <p className="text-sm font-medium text-gray-900">{r.first_name} {r.last_name}</p>
                    <p className="text-xs text-gray-400">{r.email}</p>
                  </td>
                  <td className="table-td text-xs font-mono text-gray-600">{r.forsa_id || '—'}</td>
                  <td className="table-td text-sm text-gray-700 max-w-xs">{r.reason}</td>
                  <td className="table-td text-xs text-gray-500">
                    {r.flagged_at ? format(new Date(r.flagged_at), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="table-td pr-5 text-xs text-gray-400 max-w-xs">{r.evidence_notes || '—'}</td>
                </tr>
              ))}
            </Table>
          )}
      </Card>
    </div>
  )
}
