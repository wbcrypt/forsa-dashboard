// src/components/AIReportPanel.tsx
// Embedded in ApplicationDetailPage to show AI interview results

import { useState } from 'react'
import { Brain, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Flag, Lightbulb } from 'lucide-react'
import clsx from 'clsx'

interface AIReport {
  scores?: {
    householdStability?: number
    financialCapacity?: number
    academicCommitment?: number
    documentationQuality?: number
    aiInterviewAssessment?: number
  }
  executive_summary?: string
  executive_summary_fr?: string
  strengths?: string[]
  concerns?: string[]
  risk_flags?: string[]
  missing_information?: string[]
  recommended_next_steps?: string[]
  recommendation?: string
  interview_language?: string
  interview_conducted_at?: string
}

const RECOMMENDATION_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string; desc: string }> = {
  'Bronze Candidate': {
    color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-300',
    icon: '🥉', desc: 'Assigned to Bronze pathway — full FORSA ecosystem member'
  },
  'Gold Candidate': {
    color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-300',
    icon: '🥇', desc: 'Highly recommended for approval'
  },
  'Silver Candidate': {
    color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-300',
    icon: '🥈', desc: 'Recommended with standard verification'
  },
  'Referral Candidate': {
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-300',
    icon: '🔗', desc: 'Consider referring to a partner Tuition Facilitation Plan'
  },
  'Manual Review': {
    color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-300',
    icon: '👁️', desc: 'Requires additional manual review by FORSA team'
  },
}

function ScoreRing({ score, label, size = 64 }: { score: number; label: string; size?: number }) {
  const r = size / 2 - 6
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#00C4C8' : score >= 30 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="5" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900">{score || '—'}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center leading-tight max-w-14">{label}</p>
    </div>
  )
}

export function AIReportPanel({
  report,
  overallScore,
  transcript,
  interviewLanguage,
  applicationId
}: {
  report: AIReport | null
  // T-211/D-003 — the overall score is computed server-side and stored on
  // the application itself (ai_score_overall), never inside the report
  // JSON — pass application.ai_score_overall here, not a report field.
  overallScore?: number | null
  transcript?: string
  interviewLanguage?: string
  applicationId: string
}) {
  const [showTranscript, setShowTranscript] = useState(false)

  if (!report || overallScore == null) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Brain size={22} className="text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600">No AI interview completed yet</p>
        <p className="text-xs text-gray-400 mt-1">
          The AI readiness interview report will appear here once the student completes their interview.
        </p>
      </div>
    )
  }

  const rec = report.recommendation ? RECOMMENDATION_CONFIG[report.recommendation] : null
  const langLabel = interviewLanguage === 'ar' ? 'Arabic (العربية)' : interviewLanguage === 'fr' ? 'French (Français)' : 'English'

  return (
    <div className="space-y-4">
      {/* AI Recommendation banner */}
      {rec && (
        <div className={clsx('border rounded-2xl p-4', rec.bg, rec.border)}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{rec.icon}</span>
            <div>
              <p className={clsx('text-base font-bold', rec.color)}>{report.recommendation}</p>
              <p className={clsx('text-xs mt-0.5', rec.color, 'opacity-80')}>{rec.desc}</p>
            </div>
            <div className="ms-auto text-right">
              <p className="text-3xl font-bold text-gray-900">{overallScore}</p>
              <p className="text-xs text-gray-400">Overall Score</p>
            </div>
          </div>
        </div>
      )}

      {/* Score rings */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={15} className="text-navy-700" />
          <p className="text-sm font-semibold text-gray-900">Readiness Scores</p>
          {interviewLanguage && (
            <span className="ms-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              Interview: {langLabel}
            </span>
          )}
        </div>
        <div className="flex justify-around flex-wrap gap-4">
          <ScoreRing score={report.scores?.householdStability || 0} label="Household Stability" />
          <ScoreRing score={report.scores?.financialCapacity || 0} label="Financial Capacity" />
          <ScoreRing score={report.scores?.academicCommitment || 0} label="Academic Commitment" />
          <ScoreRing score={report.scores?.documentationQuality || 0} label="Documentation Quality" />
        </div>
      </div>

      {/* Executive summary */}
      {(report.executive_summary || report.executive_summary_fr) && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Executive Summary</p>
          {report.executive_summary_fr && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1">🇫🇷 French</p>
              <p className="text-sm text-gray-700 leading-relaxed">{report.executive_summary_fr}</p>
            </div>
          )}
          {report.executive_summary && (
            <div>
              <p className="text-xs text-gray-400 mb-1">🇬🇧 English</p>
              <p className="text-sm text-gray-700 leading-relaxed">{report.executive_summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Strengths + Concerns grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {report.strengths && report.strengths.length > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={14} className="text-green-600" />
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Strengths</p>
            </div>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.concerns && report.concerns.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-amber-600" />
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Concerns</p>
            </div>
            <ul className="space-y-2">
              {report.concerns.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span> {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Risk flags */}
      {report.risk_flags && report.risk_flags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flag size={14} className="text-red-600" />
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Risk Flags</p>
          </div>
          <ul className="space-y-2">
            {report.risk_flags.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="text-red-500 mt-0.5 flex-shrink-0">🚩</span> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      {report.recommended_next_steps && report.recommended_next_steps.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-blue-600" />
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Recommended Next Steps</p>
          </div>
          <ol className="space-y-2">
            {report.recommended_next_steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="text-blue-500 font-semibold flex-shrink-0">{i + 1}.</span> {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Missing info */}
      {report.missing_information && report.missing_information.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Missing Information</p>
          <ul className="space-y-1">
            {report.missing_information.map((m, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                <span className="text-gray-400">—</span> {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interview transcript (collapsible) */}
      {transcript && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <button onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">Interview Transcript</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {langLabel}
              </span>
            </div>
            {showTranscript ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {showTranscript && (
            <div className="px-5 pb-5 border-t border-gray-50">
              <div className="mt-4 bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {transcript.split('\n\n---\n\n').map((block, i) => {
                    const isStudent = block.startsWith('[Student]') || block.startsWith('[')  && !block.startsWith('[FORSA')
                    const isAI = block.startsWith('[FORSA AI]')
                    const text = block.replace(/^\[.*?\]\s*/, '')
                    return (
                      <div key={i} className={clsx('flex gap-3', isStudent ? 'justify-end' : 'justify-start')}>
                        {isAI && (
                          <div className="w-6 h-6 bg-navy-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs font-bold">F</span>
                          </div>
                        )}
                        <div className={clsx('max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                          isStudent ? 'bg-navy-800 text-white rounded-tr-sm' : isAI ? 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm' : 'bg-gray-100 text-gray-500 text-center w-full max-w-full italic')}>
                          {text}
                        </div>
                        {isStudent && (
                          <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs font-bold">S</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-xs text-gray-400 text-center pb-2">
        ⚠️ AI assessment is advisory only. Final decisions are made exclusively by the FORSA team.
        {report.interview_conducted_at && (
          <span className="block mt-0.5">
            Interview conducted: {new Date(report.interview_conducted_at).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  )
}
