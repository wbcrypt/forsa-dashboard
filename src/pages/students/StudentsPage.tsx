import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { studentsApi } from '../../lib/api'
import { Card, Badge, Table, Pagination, EmptyState, ErrorState, TIER_STYLE, TierBadge } from '../../components/ui'
import { Plus, Search, GraduationCap, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../hooks/useLocale'
import { format } from 'date-fns'

export default function StudentsPage() {
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState('')
  const { hasPermission } = useAuth()
  const { t } = useLocale()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['students', page, search, status],
    queryFn: () => studentsApi.list({ page, limit: 20, search: search || undefined, status: status || undefined }).then(r => r.data),
  })

  const students = data?.data || []
  const meta = data?.meta || {}

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('students')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta.total ? `${meta.total.toLocaleString()} total students` : 'Manage your student portfolio'}
          </p>
        </div>
        {hasPermission('student.create') && (
          <Link to="/students/new" className="btn-primary">
            <Plus size={15} /> {t('newStudent')}
          </Link>
        )}
      </div>

      {isError && <ErrorState onRetry={refetch} />}

      <Card padding={false}>
        <div className="flex items-center gap-3 p-4 border-b border-gray-50 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="input pl-9 text-sm"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="input text-sm w-40">
            <option value="">All statuses</option>
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="defaulted">Defaulted</option>
          </select>
          {(search || status) && (
            <button onClick={() => { setSearch(''); setStatus(''); setPage(1) }}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {!isError && (
          <Table headers={['Student', 'Contact', 'City', 'FORSA Score', 'Membership', 'Status', 'Joined']} loading={isLoading}>
            {students.map((s: Record<string, unknown>) => {
              const tier = (s.membership_status as string) || undefined
              const tierStyle = tier ? TIER_STYLE[tier] : undefined
              return (
              <tr key={s.id as string} className="table-row">
                <td className="table-td pl-5">
                  <Link to={`/students/${s.id}`} className="flex items-center gap-3 hover:opacity-80 group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${tierStyle ? `${tierStyle.bg} group-hover:brightness-95` : 'bg-navy-50 group-hover:bg-navy-100'}`}>
                      <span className={`text-xs font-semibold ${tierStyle ? tierStyle.text : 'text-navy-700'}`}>
                        {(s.first_name as string)?.[0]}{(s.last_name as string)?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-navy-800">
                        {s.first_name as string} {s.last_name as string}
                      </p>
                      <p className="text-xs text-gray-400">{s.email as string}</p>
                    </div>
                  </Link>
                </td>
                <td className="table-td text-gray-500 text-xs">{(s.phone_primary as string) || '—'}</td>
                <td className="table-td text-gray-500 text-sm">{(s.city as string) || '—'}</td>
                <td className="table-td">
                  {s.aggregate_score ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${Math.max(0, Math.min(100, ((s.aggregate_score as number) - 300) / 7))}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{s.aggregate_score as number}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="table-td">
                  <TierBadge tier={tier} />
                </td>
                <td className="table-td">
                  <Badge status={s.status as string} />
                </td>
                <td className="table-td pr-5 text-gray-400 text-xs">
                  {s.created_at ? format(new Date(s.created_at as string), 'dd MMM yyyy') : '—'}
                </td>
              </tr>
              )
            })}
          </Table>
        )}

        {!isLoading && !isError && students.length === 0 && (
          <EmptyState
            icon={GraduationCap}
            title="No students found"
            description={search || status ? 'Try adjusting your search or filters.' : 'Add your first student to start managing Tuition Facilitation applications.'}
            action={
              !search && !status && hasPermission('student.create')
                ? <Link to="/students/new" className="btn-primary text-sm">Add first student</Link>
                : undefined
            }
          />
        )}

        <Pagination page={page} totalPages={meta.totalPages || 1} onPageChange={setPage} total={meta.total || 0} />
      </Card>
    </div>
  )
}
