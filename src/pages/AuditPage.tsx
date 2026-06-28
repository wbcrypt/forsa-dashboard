import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../lib/api'
import { Card, Table, ErrorState, EmptyState } from '../components/ui'
import { ScrollText, Download, X } from 'lucide-react'
import { format } from 'date-fns'

const ACTION_COLORS: Record<string, string> = {
  create: 'text-green-600 bg-green-50',
  update: 'text-blue-600 bg-blue-50',
  delete: 'text-red-600 bg-red-50',
  approve: 'text-teal-600 bg-teal-50',
  reject: 'text-red-600 bg-red-50',
  sign: 'text-purple-600 bg-purple-50',
  payment: 'text-green-700 bg-green-50',
  login: 'text-gray-600 bg-gray-50',
  export: 'text-indigo-600 bg-indigo-50',
}

function getActionColor(action: string): string {
  const key = Object.keys(ACTION_COLORS).find(k => action?.toLowerCase().includes(k))
  return key ? ACTION_COLORS[key] : 'text-gray-600 bg-gray-50'
}

export default function AuditPage() {
  const [module, setModule] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit', module, from, to, page],
    queryFn: () => reportsApi.audit({
      module: module || undefined,
      from: from || undefined,
      to: to || undefined,
      limit: 100,
      page,
    }).then(r => r.data),
  })

  const logs = Array.isArray(data) ? data : (data?.data || [])

  const clearFilters = () => { setModule(''); setFrom(''); setTo('') }
  const hasFilters = module || from || to

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">Immutable record of all system actions — append-only, tamper-evident</p>
        </div>
        <button
          onClick={() => {
            const csv = logs.map((l: Record<string, unknown>) =>
              [l.created_at, l.user_email, l.action_type, l.module, l.target_entity, l.target_id].join(',')
            ).join('\n')
            const blob = new Blob([`Date,User,Action,Module,Entity,ID\n${csv}`], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click()
          }}
          className="btn-secondary text-sm"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {isError && <ErrorState onRetry={refetch} />}

      <Card padding={false}>
        <div className="flex items-center gap-3 p-4 border-b border-gray-50 flex-wrap">
          <select value={module} onChange={e => setModule(e.target.value)} className="input text-sm w-36">
            <option value="">All modules</option>
            <option value="users">Users</option>
            <option value="students">Students</option>
            <option value="applications">Applications</option>
            <option value="universities">Universities</option>
            <option value="partners">Partners</option>
            <option value="payments">Payments</option>
            <option value="contracts">Contracts</option>
            <option value="pipeline">Pipeline</option>
            <option value="documents">Documents</option>
            <option value="scores">Scores</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input text-sm w-36" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input text-sm w-36" />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X size={12} /> Clear
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto">{logs.length} records</span>
        </div>

        {!isError && (
          <Table headers={['Date & Time', 'User', 'Action', 'Module', 'Entity', 'Entity ID']} loading={isLoading}>
            {logs.map((log: Record<string, unknown>, i: number) => (
              <tr key={(log.id as string) || i} className="table-row">
                <td className="table-td pl-5">
                  <p className="text-xs font-mono text-gray-600">
                    {log.created_at ? format(new Date(log.created_at as string), 'dd MMM yyyy') : '—'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {log.created_at ? format(new Date(log.created_at as string), 'HH:mm:ss') : ''}
                  </p>
                </td>
                <td className="table-td">
                  <p className="text-xs font-medium text-gray-700">{(log.user_name as string) || 'System'}</p>
                  <p className="text-xs text-gray-400 truncate max-w-32">{log.user_email as string}</p>
                </td>
                <td className="table-td">
                  <span className={`text-xs font-medium font-mono px-2 py-0.5 rounded-md ${getActionColor(log.action_type as string)}`}>
                    {log.action_type as string}
                  </span>
                </td>
                <td className="table-td">
                  <span className="text-xs text-gray-600 capitalize">{log.module as string}</span>
                </td>
                <td className="table-td text-xs text-gray-500">{log.target_entity as string}</td>
                <td className="table-td pr-5">
                  <span className="text-xs font-mono text-gray-400" title={log.target_id as string}>
                    {log.target_id ? (log.target_id as string).split('-')[0] + '...' : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {!isLoading && !isError && logs.length === 0 && (
          <EmptyState icon={ScrollText} title="No audit logs found"
            description={hasFilters ? 'Try adjusting your filters.' : 'Audit logs will appear here as actions are performed.'} />
        )}
      </Card>
    </div>
  )
}
