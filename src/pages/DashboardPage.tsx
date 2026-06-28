import { useQuery } from '@tanstack/react-query'
import { reportsApi, collectionsApi, applicationsApi } from '../lib/api'
import { Card, Badge, LoadingSpinner, ErrorState } from '../components/ui'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'
import {
  FileText, DollarSign, AlertTriangle, ArrowRight,
  GraduationCap, CheckCircle, Play, TrendingUp, CreditCard, Users
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'
import clsx from 'clsx'

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string
  icon?: React.ElementType; color: 'navy' | 'teal' | 'green' | 'red' | 'orange'
}) {
  const iconColors = {
    navy: 'bg-navy-50 text-navy-700',
    teal: 'bg-teal-50 text-teal-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    orange: 'bg-orange-50 text-orange-700',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
        {Icon && (
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconColors[color])}>
            <Icon size={15} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useLocale()

  const { data: ceo, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'ceo'],
    queryFn: () => reportsApi.ceo().then(r => r.data),
  })

  const { data: collections } = useQuery({
    queryKey: ['collections', 'dashboard'],
    queryFn: () => collectionsApi.getDashboard().then(r => r.data),
  })

  const { data: lateData } = useQuery({
    queryKey: ['collections', 'late-dashboard'],
    queryFn: () => collectionsApi.getLate({ page: 1, limit: 5 }).then(r => r.data),
  })

  const { data: recentApps } = useQuery({
    queryKey: ['applications-dashboard'],
    queryFn: () => applicationsApi.list({ page: 1, limit: 5 }).then(r => r.data),
  })

  if (isLoading) return <LoadingSpinner className="h-64" />
  if (isError) return <ErrorState onRetry={refetch} message="Could not load dashboard data" />

  const s = ceo?.summary || {}
  const leadTrend = (ceo?.leadTrend || []).map((d: Record<string, unknown>) => ({
    month: format(new Date(d.month as string), 'MMM'),
    Leads: parseInt((d.new_leads as string) || '0'),
    Converted: parseInt((d.converted as string) || '0'),
  }))
  const collTrend = (ceo?.collectionTrend || []).map((d: Record<string, unknown>) => ({
    month: format(new Date(d.month as string), 'MMM'),
    Collected: parseFloat((d.collected as string) || '0'),
  }))

  const firstName = user?.email?.split('@')[0]?.replace(/[._]/g, ' ') || 'Admin'
  const lateItems = lateData?.data || []
  const recentItems = recentApps?.data || []

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('welcomeBack')}, {firstName} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {format(new Date(), 'EEEE, dd MMMM yyyy')} — FORSA OS overview
        </p>
      </div>

      {/* KPIs — live from API, no hardcoded %  */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label={t('totalStudents')}
          value={parseInt(s.active_students || '0').toLocaleString()}
          sub="Active financings"
          icon={GraduationCap}
          color="teal"
        />
        <KpiCard
          label={t('totalApplications')}
          value={parseInt(s.in_pipeline || '0').toLocaleString()}
          sub="In pipeline"
          icon={FileText}
          color="navy"
        />
        <KpiCard
          label={t('approvedL1L2')}
          value={(parseInt(s.active_students || '0') + parseInt(s.completed || '0')).toLocaleString()}
          sub="Cumulative approvals"
          icon={CheckCircle}
          color="green"
        />
        <KpiCard
          label={t('totalDisbursed')}
          value={`${parseFloat(s.deployed_capital || '0').toLocaleString()} TND`}
          sub="Capital deployed"
          icon={DollarSign}
          color="teal"
        />
        <KpiCard
          label={t('overdue')}
          value={`${parseFloat(collections?.late_amount || '0').toLocaleString()} TND`}
          sub={`${collections?.late_count || 0} installments`}
          icon={AlertTriangle}
          color={parseInt(collections?.late_count) > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Applications Over Time</h3>
              <p className="text-xs text-gray-400">New leads vs converted</p>
            </div>
            <Link to="/applications" className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {leadTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={leadTrend}>
                <defs>
                  <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B2A5E" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#1B2A5E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} />
                <Area type="monotone" dataKey="Leads" stroke="#1B2A5E" strokeWidth={2} fill="url(#gL)" dot={false} />
                <Area type="monotone" dataKey="Converted" stroke="#14b8a6" strokeWidth={2} fill="url(#gC)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-gray-400">No application data yet</p>
              <Link to="/applications/new" className="btn-teal text-xs">Create first application</Link>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Collections (TND)</h3>
              <p className="text-xs text-gray-400">Monthly payments received</p>
            </div>
            <Link to="/collections" className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
              View <ArrowRight size={12} />
            </Link>
          </div>
          {collTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={collTrend} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e5e7eb' }}
                  formatter={(v: number) => [`${v.toLocaleString()} TND`, 'Collected']} />
                <Bar dataKey="Collected" fill="#14b8a6" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center gap-2">
              <CreditCard size={28} className="text-gray-300" />
              <p className="text-sm text-gray-400">No payments recorded yet</p>
              <p className="text-xs text-gray-300">Payments will appear here after recording</p>
            </div>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* At-risk payments table */}
        <div className="lg:col-span-2">
          <Card padding={false}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">At-Risk Payments</h3>
                <p className="text-xs text-gray-400">Overdue installments requiring action</p>
              </div>
              <Link to="/collections" className="text-xs text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {lateItems.length === 0 ? (
              <div className="px-5 pb-5 flex items-center gap-2 text-sm text-green-600">
                <CheckCircle size={16} />
                All payments on time — no overdue installments
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-5 px-5 pb-2 gap-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  <span className="col-span-2">Student</span>
                  <span>Due</span>
                  <span>Amount</span>
                  <span>Status</span>
                </div>
                {lateItems.map((item: Record<string, unknown>) => (
                  <div key={item.id as string}
                    className="grid grid-cols-5 px-5 py-3 gap-3 border-t border-gray-50 hover:bg-gray-50/50 transition-colors items-center">
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.first_name as string} {item.last_name as string}</p>
                      <p className="text-xs text-gray-400 truncate">{item.university_name as string}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {item.due_date ? format(new Date(item.due_date as string), 'dd MMM') : '—'}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {(parseFloat((item.amount as string) || '0') - parseFloat((item.amount_paid as string) || '0')).toLocaleString()}
                      <span className="text-xs text-gray-400 font-normal ml-0.5">TND</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.status === 'defaulted' ? 'bg-red-500' :
                        item.status === 'default_risk' ? 'bg-orange-500' : 'bg-yellow-400'
                      }`} />
                      <span className={`text-xs font-medium ${
                        item.status === 'defaulted' ? 'text-red-600' :
                        item.status === 'default_risk' ? 'text-orange-600' : 'text-yellow-600'
                      }`}>{(item.days_overdue as number) || 0}d</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick actions + recent activity */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-1.5">
              {[
                { label: 'New Student', path: '/students/new', icon: Users, color: 'bg-teal-50 text-teal-700' },
                { label: 'New Application', path: '/applications/new', icon: FileText, color: 'bg-navy-50 text-navy-700' },
                { label: 'Run Pipeline', path: '/applications', icon: Play, color: 'bg-purple-50 text-purple-700' },
                { label: 'Collections', path: '/collections', icon: AlertTriangle, color: 'bg-orange-50 text-orange-700' },
                { label: 'Reports', path: '/reports', icon: TrendingUp, color: 'bg-green-50 text-green-700' },
              ].map(a => {
                const Icon = a.icon
                return (
                  <Link key={a.path} to={a.path}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${a.color}`}>
                      <Icon size={13} />
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{a.label}</span>
                    <ArrowRight size={12} className="ml-auto text-gray-300 group-hover:text-gray-400" />
                  </Link>
                )
              })}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Recent Applications</h3>
              <Link to="/applications" className="text-xs text-teal-600 hover:text-teal-700">View all</Link>
            </div>
            <div className="space-y-3">
              {recentItems.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No applications yet</p>
              ) : recentItems.slice(0, 4).map((app: Record<string, unknown>) => (
                <Link key={app.id as string} to={`/applications/${app.id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                  <div className="w-7 h-7 bg-navy-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-navy-100 transition-colors">
                    <span className="text-xs font-semibold text-navy-700">
                      {((app.first_name as string) || '?')[0]}{((app.last_name as string) || '?')[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {app.first_name as string} {app.last_name as string}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{(app.university_name as string) || 'No university'}</p>
                  </div>
                  <Badge status={app.current_status as string} />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
