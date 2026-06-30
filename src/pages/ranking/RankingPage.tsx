// src/pages/ranking/RankingPage.tsx
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { applicationsApi } from '../../lib/api'
import { Card, Badge, EmptyState, ErrorState, LoadingSpinner as Spinner } from '../../components/ui'
import {
  Trophy, ChevronUp, ChevronDown, ChevronsUpDown,
  Star, Filter, X, Download, Brain, AlertTriangle, CheckCircle
} from 'lucide-react'
import clsx from 'clsx'

type SortField = 'rank' | 'name' | 'overall' | 'educational' | 'financial' | 'planning' | 'commitment' | 'recommendation' | 'status'
type SortDir = 'asc' | 'desc'

const RECOMMENDATION_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  'Bronze Member': { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: '🥉' },
  'Gold Candidate': { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: '🥇' },
  'Silver Candidate': { color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200', icon: '🥈' },
  'Referral Candidate': { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: '🔗' },
  'Manual Review': { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: '👁️' },
}

function ScoreBar({ score, color = 'teal' }: { score: number; color?: string }) {
  const colors: Record<string, string> = {
    teal: 'bg-teal-500', green: 'bg-green-500', blue: 'bg-blue-500',
    amber: 'bg-amber-500', red: 'bg-red-400'
  }
  const pct = Math.max(0, Math.min(100, score || 0))
  const barColor = pct >= 75 ? colors.green : pct >= 50 ? colors.teal : pct >= 30 ? colors.amber : colors.red
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-600 w-8 text-right">{score ?? '—'}</span>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>
  if (rank === 2) return <span className="text-lg">🥈</span>
  if (rank === 3) return <span className="text-lg">🥉</span>
  return <span className="text-sm font-bold text-gray-400">#{rank}</span>
}

export default function RankingPage() {
  const [sortField, setSortField] = useState<SortField>('overall')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filters, setFilters] = useState({
    university: '', recommendation: '', status: '', search: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['applications-ranking'],
    queryFn: () => applicationsApi.list({ limit: 100 }).then(r => r.data),
  })

  const apps: any[] = data?.data || []

  // Parse AI report for each app
  const enriched = useMemo(() => apps.map(app => {
    let aiReport: any = {}
    try { if (app.ai_report) aiReport = JSON.parse(app.ai_report) } catch {}
    return {
      ...app,
      aiReport,
      scores: aiReport.scores || {},
      recommendation: aiReport.recommendation || app.ai_recommendation || '',
      interviewLanguage: aiReport.interview_language || app.interview_language || '',
    }
  }), [apps])

  // Filter
  const filtered = useMemo(() => enriched.filter(app => {
    if (filters.university && !app.university_name?.toLowerCase().includes(filters.university.toLowerCase())) return false
    if (filters.recommendation && app.recommendation !== filters.recommendation) return false
    if (filters.status && app.current_status !== filters.status) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!(app.first_name + ' ' + app.last_name).toLowerCase().includes(q) && !app.email?.toLowerCase().includes(q)) return false
    }
    return true
  }), [enriched, filters])

  // Sort
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let va: any, vb: any
    switch (sortField) {
      case 'name': va = `${a.first_name} ${a.last_name}`; vb = `${b.first_name} ${b.last_name}`; break
      case 'overall': va = a.scores.overall_forsa_score || a.ai_score_overall || 0; vb = b.scores.overall_forsa_score || b.ai_score_overall || 0; break
      case 'educational': va = a.scores.educational_readiness || 0; vb = b.scores.educational_readiness || 0; break
      case 'financial': va = a.scores.financial_readiness || 0; vb = b.scores.financial_readiness || 0; break
      case 'planning': va = a.scores.planning_readiness || 0; vb = b.scores.planning_readiness || 0; break
      case 'commitment': va = a.scores.commitment_readiness || 0; vb = b.scores.commitment_readiness || 0; break
      case 'recommendation': va = a.recommendation; vb = b.recommendation; break
      case 'status': va = a.current_status; vb = b.current_status; break
      default: va = 0; vb = 0
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  }), [filtered, sortField, sortDir])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown size={12} className="text-gray-300" />
    return sortDir === 'desc' ? <ChevronDown size={12} className="text-navy-800" /> : <ChevronUp size={12} className="text-navy-800" />
  }

  const exportCSV = () => {
    const headers = ['Rank', 'Name', 'University', 'Program', 'Overall Score', 'Educational', 'Financial', 'Planning', 'Commitment', 'Recommendation', 'Status', 'Interview Language']
    const rows = sorted.map((app, i) => [
      i + 1, `${app.first_name} ${app.last_name}`, app.university_name || '', app.program_name || '',
      app.scores.overall_forsa_score || '',
      app.scores.educational_readiness || '', app.scores.financial_readiness || '',
      app.scores.planning_readiness || '', app.scores.commitment_readiness || '',
      app.recommendation || '', app.current_status || '', app.interviewLanguage || ''
    ])
    const csv = [headers.join(','), ...rows.map((r: any[]) => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'forsa-rankings.csv'; a.click()
  }

  // Stats
  const withScores = enriched.filter(a => a.scores.overall_forsa_score)
  const avgScore = withScores.length > 0
    ? Math.round(withScores.reduce((s, a) => s + (a.scores.overall_forsa_score || 0), 0) / withScores.length)
    : 0
  const goldCount = enriched.filter(a => a.recommendation === 'Gold Candidate').length
  const hasInterview = enriched.filter(a => a.scores.overall_forsa_score).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-navy-800" />
            <h1 className="text-xl font-semibold text-gray-900">AI Application Ranking</h1>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {apps.length} applications · {hasInterview} with AI interview · avg score {avgScore}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={clsx('btn-secondary text-sm', showFilters && 'bg-navy-50 border-navy-300')}>
            <Filter size={14} /> Filters {(filters.university || filters.recommendation || filters.status || filters.search) ? '●' : ''}
          </button>
          <button onClick={exportCSV} className="btn-secondary text-sm">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: apps.length, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: '🥉 Bronze', value: enriched.filter(a => a.current_status === 'rejected').length, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: '🥇 Gold', value: goldCount, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'With Interview', value: hasInterview, color: 'text-teal-700', bg: 'bg-teal-50' },
          { label: 'Avg Score', value: avgScore || '—', color: 'text-navy-800', bg: 'bg-navy-50' },
        ].map(stat => (
          <div key={stat.label} className={clsx('rounded-xl p-3 text-center', stat.bg)}>
            <p className={clsx('text-xl font-bold', stat.color)}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="bg-gray-50 border-gray-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Search</label>
              <input className="input text-sm" placeholder="Name or email…"
                value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">University</label>
              <input className="input text-sm" placeholder="University name…"
                value={filters.university} onChange={e => setFilters(f => ({ ...f, university: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">AI Recommendation</label>
              <select className="input text-sm" value={filters.recommendation}
                onChange={e => setFilters(f => ({ ...f, recommendation: e.target.value }))}>
                <option value="">All</option>
                <option value="Gold Candidate">🥇 Gold</option>
                <option value="Silver Candidate">🥈 Silver</option>
                <option value="Referral Candidate">🔗 Referral</option>
                <option value="Manual Review">👁️ Manual Review</option>
                <option value="Bronze Member">🥉 Bronze</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
              <select className="input text-sm" value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                <option value="">All</option>
                <option value="new_lead">New</option>
                <option value="under_review">Under Review</option>
                <option value="approved_level2">Approved</option>
                <option value="rejected">🥉 Bronze Pathway</option>
              </select>
            </div>
          </div>
          {(filters.search || filters.university || filters.recommendation || filters.status) && (
            <button onClick={() => setFilters({ university: '', recommendation: '', status: '', search: '' })}
              className="mt-3 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X size={12} /> Clear all filters
            </button>
          )}
        </Card>
      )}

      {isLoading ? <Spinner className="h-48" />
        : isError ? <ErrorState onRetry={refetch} />
        : sorted.length === 0 ? (
          <Card>
            <EmptyState icon={Trophy} title="No applications yet"
              description="Applications with AI interview scores will appear here ranked by FORSA Readiness Score." />
          </Card>
        ) : (
          <Card padding={false}>
            {/* Desktop table */}
            <div className="overflow-x-auto hidden lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      { label: 'Rank', field: 'rank' as SortField, w: 'w-16' },
                      { label: 'Applicant', field: 'name' as SortField, w: 'min-w-44' },
                      { label: 'Overall', field: 'overall' as SortField, w: 'w-28' },
                      { label: 'Educational', field: 'educational' as SortField, w: 'w-28' },
                      { label: 'Financial', field: 'financial' as SortField, w: 'w-28' },
                      { label: 'Planning', field: 'planning' as SortField, w: 'w-28' },
                      { label: 'Commitment', field: 'commitment' as SortField, w: 'w-28' },
                      { label: 'AI Rec.', field: 'recommendation' as SortField, w: 'w-32' },
                      { label: 'Status', field: 'status' as SortField, w: 'w-28' },
                    ].map(col => (
                      <th key={col.field} className={clsx('px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50/50', col.w)}>
                        <button onClick={() => toggleSort(col.field)}
                          className="flex items-center gap-1 hover:text-gray-700">
                          {col.label} <SortIcon field={col.field} />
                        </button>
                      </th>
                    ))}
                    <th className="px-3 py-3 bg-gray-50/50 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((app, i) => {
                    const rec = RECOMMENDATION_CONFIG[app.recommendation] || null
                    const lang = app.interviewLanguage
                    return (
                      <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-3 text-center">
                          <RankBadge rank={i + 1} />
                        </td>
                        <td className="px-3 py-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{app.first_name} {app.last_name}</p>
                            <p className="text-xs text-gray-400">{app.university_name || '—'}</p>
                            <p className="text-xs text-gray-400">{app.program_name || '—'}</p>
                            {lang && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                                {lang === 'ar' ? 'ع AR' : lang === 'fr' ? 'FR' : 'EN'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {app.scores.overall_forsa_score ? (
                            <div>
                              <p className="text-base font-bold text-gray-900">{app.scores.overall_forsa_score}</p>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1 w-20">
                                <div className={clsx('h-full rounded-full',
                                  app.scores.overall_forsa_score >= 75 ? 'bg-green-500' :
                                  app.scores.overall_forsa_score >= 50 ? 'bg-teal-500' : 'bg-amber-400'
                                )} style={{ width: `${app.scores.overall_forsa_score}%` }} />
                              </div>
                            </div>
                          ) : <span className="text-xs text-gray-300">No interview</span>}
                        </td>
                        <td className="px-3 py-3 w-28"><ScoreBar score={app.scores.educational_readiness} /></td>
                        <td className="px-3 py-3 w-28"><ScoreBar score={app.scores.financial_readiness} /></td>
                        <td className="px-3 py-3 w-28"><ScoreBar score={app.scores.planning_readiness} /></td>
                        <td className="px-3 py-3 w-28"><ScoreBar score={app.scores.commitment_readiness} /></td>
                        <td className="px-3 py-3">
                          {rec ? (
                            <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border', rec.bg, rec.color)}>
                              {rec.icon} {app.recommendation.replace(' Candidate', '')}
                            </span>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-3 py-3"><Badge status={app.current_status} /></td>
                        <td className="px-3 py-3">
                          <Link to={`/applications/${app.id}`}
                            className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                            View →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-gray-50">
              {sorted.map((app, i) => {
                const rec = RECOMMENDATION_CONFIG[app.recommendation] || null
                return (
                  <Link key={app.id} to={`/applications/${app.id}`} className="block p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 text-center flex-shrink-0 pt-0.5">
                        <RankBadge rank={i + 1} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{app.first_name} {app.last_name}</p>
                            <p className="text-xs text-gray-400">{app.university_name}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {app.scores.overall_forsa_score && (
                              <p className="text-lg font-bold text-gray-900">{app.scores.overall_forsa_score}</p>
                            )}
                            {rec && (
                              <span className={clsx('text-xs px-1.5 py-0.5 rounded-full border', rec.bg, rec.color)}>
                                {rec.icon}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                          {[
                            { label: 'Educ.', score: app.scores.educational_readiness },
                            { label: 'Financial', score: app.scores.financial_readiness },
                            { label: 'Planning', score: app.scores.planning_readiness },
                            { label: 'Commitment', score: app.scores.commitment_readiness },
                          ].map(d => (
                            <div key={d.label}>
                              <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                                <span>{d.label}</span><span>{d.score ?? '—'}</span>
                              </div>
                              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div className={clsx('h-full rounded-full',
                                  (d.score || 0) >= 75 ? 'bg-green-500' : (d.score || 0) >= 50 ? 'bg-teal-500' : 'bg-amber-400'
                                )} style={{ width: `${d.score || 0}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge status={app.current_status} />
                          {app.interviewLanguage && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                              {app.interviewLanguage.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>
        )}
    </div>
  )
}
