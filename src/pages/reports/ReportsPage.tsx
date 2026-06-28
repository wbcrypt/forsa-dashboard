import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../lib/api'
import { Card, StatCard, Tabs, LoadingSpinner, ErrorState, EmptyState } from '../../components/ui'
import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { format } from 'date-fns'
import { TrendingUp, DollarSign, Users, Building2, Download } from 'lucide-react'

const COLORS = ['#1B2A5E', '#14b8a6', '#6270f1', '#f59e0b', '#ef4444', '#8b5cf6']

function exportCSV(data: unknown[], filename: string) {
  if (!data?.length) return
  const keys = Object.keys(data[0] as object)
  const csv = [keys.join(','), ...data.map((row: unknown) => keys.map(k => (row as Record<string, unknown>)[k] ?? '').join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
}

export default function ReportsPage() {
  const [tab, setTab] = useState('ceo')

  const { data: ceo, isLoading: ceoLoading, isError: ceoError, refetch: refetchCeo } = useQuery({
    queryKey: ['reports', 'ceo'],
    queryFn: () => reportsApi.ceo().then(r => r.data),
    enabled: tab === 'ceo',
  })
  const { data: finance, isLoading: finLoading, isError: finError, refetch: refetchFin } = useQuery({
    queryKey: ['reports', 'finance'],
    queryFn: () => reportsApi.finance().then(r => r.data),
    enabled: tab === 'finance',
  })
  const { data: sales, isLoading: salesLoading, isError: salesError, refetch: refetchSales } = useQuery({
    queryKey: ['reports', 'sales'],
    queryFn: () => reportsApi.sales().then(r => r.data),
    enabled: tab === 'sales',
  })
  const { data: collections, isLoading: collLoading, isError: collError, refetch: refetchColl } = useQuery({
    queryKey: ['reports', 'collections'],
    queryFn: () => reportsApi.collections().then(r => r.data),
    enabled: tab === 'collections',
  })

  const tabs = [
    { id: 'ceo', label: 'CEO Overview' },
    { id: 'finance', label: 'Finance' },
    { id: 'sales', label: 'Sales' },
    { id: 'collections', label: 'Collections' },
  ]

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time platform intelligence — {format(new Date(), 'dd MMMM yyyy')}</p>
        </div>
        <button
          onClick={() => {
            const reportData = tab === 'ceo' ? ceo?.leadTrend : tab === 'finance' ? finance?.ledger : tab === 'sales' ? sales?.funnel : collections?.aging
            if (reportData) exportCSV(reportData, `forsa-${tab}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`)
          }}
          className="btn-secondary text-sm">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <Card padding={false}>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        <div className="p-5">
          {/* ── CEO ── */}
          {tab === 'ceo' && (
            ceoLoading ? <LoadingSpinner className="h-48" />
            : ceoError ? <ErrorState onRetry={refetchCeo} />
            : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Active Students" value={parseInt(ceo?.summary?.active_students || '0').toLocaleString()} icon={Users} color="teal" />
                  <StatCard label="In Pipeline" value={parseInt(ceo?.summary?.in_pipeline || '0').toLocaleString()} icon={TrendingUp} color="navy" />
                  <StatCard label="Deployed Capital" value={`${parseFloat(ceo?.summary?.deployed_capital || '0').toLocaleString()} TND`} icon={DollarSign} color="green" />
                  <StatCard label="Universities" value={parseInt(ceo?.summary?.partner_universities || '0')} icon={Building2} color="navy" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Card>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Lead Pipeline Trend</h3>
                    {(ceo?.leadTrend || []).length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={(ceo?.leadTrend || []).map((d: Record<string, unknown>) => ({
                          month: format(new Date(d.month as string), 'MMM'),
                          'New Leads': parseInt((d.new_leads as string) || '0'),
                          'Converted': parseInt((d.converted as string) || '0'),
                        }))}>
                          <defs>
                            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1B2A5E" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#1B2A5E" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Area type="monotone" dataKey="New Leads" stroke="#1B2A5E" fill="url(#g1)" strokeWidth={2} dot={false} />
                          <Area type="monotone" dataKey="Converted" stroke="#14b8a6" fill="url(#g2)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState title="No trend data yet" description="Trends appear after applications are created" />
                    )}
                  </Card>
                  <Card>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Collections Trend</h3>
                    {(ceo?.collectionTrend || []).length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={(ceo?.collectionTrend || []).map((d: Record<string, unknown>) => ({
                          month: format(new Date(d.month as string), 'MMM'),
                          'Collected': parseFloat((d.collected as string) || '0'),
                        }))} barSize={28}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                            formatter={(v: number) => [`${v.toLocaleString()} TND`, 'Collected']} />
                          <Bar dataKey="Collected" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState title="No collection data yet" description="Collections appear after payments are recorded" />
                    )}
                  </Card>
                </div>
              </div>
            )
          )}

          {/* ── Finance ── */}
          {tab === 'finance' && (
            finLoading ? <LoadingSpinner className="h-48" />
            : finError ? <ErrorState onRetry={refetchFin} />
            : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Current (On-time)" value={`${parseFloat(finance?.receivables?.current || '0').toLocaleString()} TND`} color="green" />
                  <StatCard label="Due Soon" value={`${parseFloat(finance?.receivables?.due_soon || '0').toLocaleString()} TND`} color="teal" />
                  <StatCard label="Late" value={`${parseFloat(finance?.receivables?.late || '0').toLocaleString()} TND`} color="orange" />
                  <StatCard label="Default Risk" value={`${parseFloat(finance?.receivables?.default_risk || '0').toLocaleString()} TND`} color="red" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Card>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Receivables Portfolio</h3>
                    {Object.values(finance?.receivables || {}).some(v => parseFloat(v as string) > 0) ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Current', value: parseFloat(finance?.receivables?.current || '0') },
                              { name: 'Due Soon', value: parseFloat(finance?.receivables?.due_soon || '0') },
                              { name: 'Late', value: parseFloat(finance?.receivables?.late || '0') },
                              { name: 'Default Risk', value: parseFloat(finance?.receivables?.default_risk || '0') },
                            ].filter(d => d.value > 0)}
                            cx="50%" cy="50%" innerRadius={65} outerRadius={90} dataKey="value" paddingAngle={2}>
                            {COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()} TND`}
                            contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState title="No receivables yet" description="Receivables appear after payment schedules are created" />
                    )}
                  </Card>
                  <Card>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Ledger Summary</h3>
                    {(finance?.ledger || []).length > 0 ? (
                      <div className="space-y-2">
                        {finance.ledger.map((e: Record<string, unknown>) => {
                          const dr = parseFloat((e.total_debit as string) || '0')
                          const cr = parseFloat((e.total_credit as string) || '0')
                          return (
                            <div key={e.account as string} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                              <span className="text-xs text-gray-600 capitalize font-medium">
                                {(e.account as string).replace(/_/g, ' ')}
                              </span>
                              <div className="flex gap-4 text-xs font-mono">
                                <span className="text-green-600">DR {dr.toLocaleString()}</span>
                                <span className="text-red-500">CR {cr.toLocaleString()}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <EmptyState title="No ledger entries" description="Entries appear after payments are recorded" />
                    )}
                  </Card>
                </div>
              </div>
            )
          )}

          {/* ── Sales ── */}
          {tab === 'sales' && (
            salesLoading ? <LoadingSpinner className="h-48" />
            : salesError ? <ErrorState onRetry={refetchSales} />
            : (
              <div className="space-y-5">
                <Card>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline by Status</h3>
                  {(sales?.funnel || []).length > 0 ? (
                    <div className="space-y-3">
                      {sales.funnel.map((item: Record<string, unknown>, i: number) => {
                        const maxCount = parseInt((sales?.funnel?.[0]?.count as string) || '1')
                        const pct = Math.min(100, (parseInt((item.count as string) || '0') / maxCount) * 100)
                        return (
                          <div key={item.current_status as string} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-32 truncate capitalize">
                              {(item.current_status as string).replace(/_/g, ' ')}
                            </span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 w-8 text-right">{item.count as string}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <EmptyState title="No applications yet" description="Pipeline data appears after applications are created" />
                  )}
                </Card>
                {(sales?.byUniversity || []).length > 0 && (
                  <Card>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">By University</h3>
                    <div className="space-y-0 divide-y divide-gray-50">
                      {sales.byUniversity.slice(0, 10).map((u: Record<string, unknown>) => (
                        <div key={u.name as string} className="flex items-center justify-between py-3">
                          <span className="text-sm text-gray-700">{u.name as string}</span>
                          <div className="flex gap-5 text-sm">
                            <span className="text-gray-400">{u.applications as string} apps</span>
                            <span className="text-teal-600 font-medium">{u.active as string} active</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )
          )}

          {/* ── Collections ── */}
          {tab === 'collections' && (
            collLoading ? <LoadingSpinner className="h-48" />
            : collError ? <ErrorState onRetry={refetchColl} />
            : (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Late" value={collections?.overview?.late_count || 0} color="orange" />
                  <StatCard label="At Risk" value={collections?.overview?.risk_count || 0} color="red" />
                  <StatCard label="Total Overdue" value={`${parseFloat(collections?.overview?.total_overdue || '0').toLocaleString()} TND`} color="red" />
                </div>
                <Card>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Aging Buckets</h3>
                  {(collections?.aging || []).length > 0 ? (
                    <div className="space-y-3">
                      {collections.aging.map((bucket: Record<string, unknown>) => {
                        const maxCount = Math.max(...(collections?.aging || []).map((b: Record<string, unknown>) => parseInt((b.count as string) || '0')), 1)
                        const pct = (parseInt((bucket.count as string) || '0') / maxCount) * 100
                        return (
                          <div key={bucket.bucket as string}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600 font-medium">{bucket.bucket as string}</span>
                              <span className="text-gray-700">
                                {bucket.count as string} accounts · {parseFloat((bucket.amount as string) || '0').toLocaleString()} TND
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <EmptyState title="No overdue payments" description="All students are paying on time — excellent!" />
                  )}
                </Card>
                {(collections?.topOverdue || []).length > 0 && (
                  <Card>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Overdue Students</h3>
                    <div className="space-y-2">
                      {collections.topOverdue.map((s: Record<string, unknown>, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100/50">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{s.first_name as string} {s.last_name as string}</p>
                            <p className="text-xs text-gray-400">Score: {s.aggregate_score as number || 500} · {s.max_days_overdue as number}d overdue</p>
                          </div>
                          <span className="text-sm font-bold text-red-700">
                            {parseFloat((s.total_owed as string) || '0').toLocaleString()} TND
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )
          )}
        </div>
      </Card>
    </div>
  )
}
