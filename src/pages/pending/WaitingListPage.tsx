// Phase 2 T-213/T-215/T-216 — applicants held for capital availability,
// never rejected. Ordered by priority_score (renewals get a +100 boost —
// T-216: "returning members get priority").
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Hourglass } from 'lucide-react'
import { Card, Table, EmptyState, LoadingSpinner as Spinner } from '../../components/ui'
import { pipelineApi } from '../../lib/api'
import { format } from 'date-fns'

export default function WaitingListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['capital-queue'],
    queryFn: () => pipelineApi.listCapitalQueue().then(r => r.data),
  })

  const entries: any[] = data || []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Waiting List</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Held for capital availability — never a rejection. Renewals are prioritized.
        </p>
      </div>

      <Card padding={false}>
        {isLoading ? <Spinner className="h-40" />
          : entries.length === 0 ? (
            <EmptyState icon={Hourglass} title="Waiting list is empty"
              description="Applications soft-blocked by a portfolio/exposure limit, or explicitly placed here by a reviewer, appear in priority order." />
          ) : (
            <Table headers={['Student', 'University', 'Amount', 'Reason', 'Priority', 'Queued']} loading={false}>
              {entries.map((e: any) => (
                <tr key={e.id} className="table-row">
                  <td className="table-td pl-5">
                    <Link to={`/applications/${e.application_id}`} className="text-sm font-medium text-navy-800 hover:underline">
                      {e.first_name} {e.last_name}
                    </Link>
                    {e.is_renewal && <span className="ms-2 text-xs bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full">Renewal</span>}
                  </td>
                  <td className="table-td text-sm text-gray-700">{e.university_name || '—'}</td>
                  <td className="table-td text-sm text-gray-700">{parseFloat(e.tuition_amount || 0).toLocaleString()} TND</td>
                  <td className="table-td text-xs text-gray-500 max-w-xs">{e.reason}</td>
                  <td className="table-td text-sm font-mono text-gray-600">{e.priority_score}</td>
                  <td className="table-td pr-5 text-xs text-gray-500">
                    {e.queued_at ? format(new Date(e.queued_at), 'dd MMM yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </Table>
          )}
      </Card>
    </div>
  )
}
