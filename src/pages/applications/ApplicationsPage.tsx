import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { applicationsApi } from '../../lib/api'
import { Card, Badge, Table, Pagination, EmptyState, ErrorState } from '../../components/ui'
import { Plus, Search, FileText, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../hooks/useLocale'
import { format } from 'date-fns'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'new_lead', label: 'New Lead' },
  { value: 'waiting_for_documents', label: 'Waiting for Docs' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved_level1', label: 'Approved L1' },
  { value: 'approved_level2', label: 'Approved L2' },
  { value: 'approved_level3', label: 'Approved L3' },
  { value: 'contract_sent', label: 'Contract Sent' },
  { value: 'contract_signed', label: 'Contract Signed' },
  { value: 'active_student', label: 'Active Student' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: '🥉 Bronze Pathway' },
  { value: 'on_hold', label: 'On Hold' },
]

export default function ApplicationsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const { hasPermission } = useAuth()
  const { t } = useLocale()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['applications', page, search, status],
    queryFn: () => applicationsApi.list({ page, limit: 20, search: search || undefined, status: status || undefined }).then(r => r.data),
  })

  const apps = data?.data || []
  const meta = data?.meta || {}

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('applications')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta.total ? `${meta.total.toLocaleString()} total applications` : 'Manage financing applications'}
          </p>
        </div>
        {hasPermission('application.create') && (
          <Link to="/applications/new" className="btn-primary">
            <Plus size={15} /> {t('newApplication')}
          </Link>
        )}
      </div>

      {isError && <ErrorState onRetry={refetch} />}

      <Card padding={false}>
        <div className="flex items-center gap-3 p-4 border-b border-gray-50 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by student name..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="input pl-9 text-sm" />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="input text-sm w-44">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {(search || status) && (
            <button onClick={() => { setSearch(''); setStatus(''); setPage(1) }}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {!isError && (
          <Table headers={['Student', 'University / Program', 'Amount', 'Score', 'Status', 'Date']} loading={isLoading}>
            {apps.map((app: Record<string, unknown>) => (
              <tr key={app.id as string} className="table-row">
                <td className="table-td pl-5">
                  <Link to={`/applications/${app.id}`} className="block hover:opacity-80">
                    <p className="text-sm font-medium text-gray-900">
                      {app.first_name as string} {app.last_name as string}
                    </p>
                    <p className="text-xs text-gray-400">{app.email as string}</p>
                  </Link>
                </td>
                <td className="table-td">
                  <p className="text-sm text-gray-700">{(app.university_name as string) || '—'}</p>
                  <p className="text-xs text-gray-400">{(app.program_name as string) || 'No program'}</p>
                </td>
                <td className="table-td">
                  <span className="text-sm font-medium text-gray-900">
                    {parseFloat((app.tuition_amount as string) || '0').toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">{(app.currency as string) || 'TND'}</span>
                </td>
                <td className="table-td">
                  {app.aggregate_score
                    ? <span className="text-sm font-medium text-teal-700">{app.aggregate_score as number}</span>
                    : <span className="text-xs text-gray-300">—</span>
                  }
                </td>
                <td className="table-td">
                  <Badge status={app.current_status as string} />
                </td>
                <td className="table-td pr-5 text-gray-400 text-xs">
                  {app.lead_date ? format(new Date(app.lead_date as string), 'dd MMM yy') : '—'}
                </td>
              </tr>
            ))}
          </Table>
        )}

        {!isLoading && !isError && apps.length === 0 && (
          <EmptyState icon={FileText} title="No applications found"
            description={search || status ? 'Try adjusting your filters.' : 'Create your first application to start the financing process.'}
            action={!search && !status && hasPermission('application.create')
              ? <Link to="/applications/new" className="btn-primary text-sm">Create application</Link>
              : undefined}
          />
        )}

        <Pagination page={page} totalPages={meta.totalPages || 1} onPageChange={setPage} total={meta.total || 0} />
      </Card>
    </div>
  )
}
