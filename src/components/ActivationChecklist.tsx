// src/components/ActivationChecklist.tsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi } from '../lib/api'
import { useToastContext } from '../context/ToastContext'
import { CheckSquare, Square, Loader2, Users, FileText, Lock, GraduationCap } from 'lucide-react'
import clsx from 'clsx'

const CHECKLIST_ITEMS = [
  { key: 'student_present', label: 'Student present', icon: Users, section: 'attendance' },
  { key: 'guarantor_present', label: 'Guarantor present', icon: Users, section: 'attendance' },
  { key: 'student_id_verified', label: 'Student ID (CIN) verified', icon: FileText, section: 'identity' },
  { key: 'guarantor_id_verified', label: 'Guarantor ID (CIN) verified', icon: FileText, section: 'identity' },
  { key: 'enrollment_verified', label: 'University admission/enrollment verified', icon: GraduationCap, section: 'documents' },
  { key: 'tuition_invoice_verified', label: 'Tuition invoice verified', icon: FileText, section: 'documents' },
  { key: 'income_proof_reviewed', label: 'Income proof reviewed', icon: FileText, section: 'documents' },
  { key: 'contracts_signed', label: 'Tuition facilitation agreement signed by all parties', icon: Lock, section: 'signing' },
  { key: 'lettres_de_change_signed', label: 'Lettres de change signed', icon: Lock, section: 'signing' },
  { key: 'copies_provided', label: 'Copies of all documents provided', icon: FileText, section: 'completion' },
  { key: 'student_activated', label: 'Student account activated', icon: GraduationCap, section: 'completion' },
]

const SECTIONS = [
  { key: 'attendance', label: 'Attendance', color: 'text-blue-700 bg-blue-50 border-blue-100' },
  { key: 'identity', label: 'Identity Verification', color: 'text-purple-700 bg-purple-50 border-purple-100' },
  { key: 'documents', label: 'Document Verification', color: 'text-amber-700 bg-amber-50 border-amber-100' },
  { key: 'signing', label: 'Signing', color: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
  { key: 'completion', label: 'Completion', color: 'text-green-700 bg-green-50 border-green-100' },
]

interface Props {
  applicationId: string
  savedChecklist?: Record<string, boolean>
  meetingNotes?: string
}

export function ActivationChecklist({ applicationId, savedChecklist = {}, meetingNotes: initialNotes = '' }: Props) {
  const { toast } = useToastContext()
  const qc = useQueryClient()
  const [checklist, setChecklist] = useState<Record<string, boolean>>(savedChecklist)
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)

  const completedCount = Object.values(checklist).filter(Boolean).length
  const totalItems = CHECKLIST_ITEMS.length
  const allComplete = completedCount === totalItems
  const progress = (completedCount / totalItems) * 100

  const toggle = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const save = async () => {
    setSaving(true)
    try {
      await applicationsApi.updateStatus(applicationId, {
        status: allComplete ? 'contracts_signed' : 'document_verification',
        notes: `Activation checklist: ${completedCount}/${totalItems} items complete.\n\nNotes: ${notes}\n\nChecklist: ${JSON.stringify(checklist)}`,
      })
      toast(allComplete ? 'Activation complete — student activated!' : 'Checklist saved', 'success')
      qc.invalidateQueries({ queryKey: ['application-workflow', applicationId] })
    } catch {
      toast('Failed to save checklist', 'error')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">Activation Meeting Checklist</p>
          <span className={clsx('text-sm font-bold', allComplete ? 'text-green-600' : 'text-gray-600')}>
            {completedCount}/{totalItems}
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={clsx('h-full rounded-full transition-all duration-500',
            allComplete ? 'bg-green-500' : progress >= 80 ? 'bg-teal-500' : 'bg-navy-600')}
            style={{ width: `${progress}%` }} />
        </div>
        {allComplete && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
            ✅ All items complete — ready to activate student
          </div>
        )}
      </div>

      {/* Checklist by section */}
      {SECTIONS.map(section => {
        const items = CHECKLIST_ITEMS.filter(i => i.section === section.key)
        const sectionDone = items.every(i => checklist[i.key])
        return (
          <div key={section.key} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className={clsx('px-4 py-3 border-b flex items-center justify-between', section.color)}>
              <p className="text-xs font-semibold uppercase tracking-wide">{section.label}</p>
              {sectionDone && <span className="text-xs font-medium">✓ Complete</span>}
            </div>
            <div className="divide-y divide-gray-50">
              {items.map(item => {
                const Icon = item.icon
                const checked = !!checklist[item.key]
                return (
                  <button key={item.key} onClick={() => toggle(item.key)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 text-start transition-colors',
                      checked ? 'bg-green-50/30 hover:bg-green-50' : 'hover:bg-gray-50'
                    )}>
                    <div className={clsx('flex-shrink-0', checked ? 'text-green-500' : 'text-gray-300')}>
                      {checked ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>
                    <Icon size={14} className={clsx('flex-shrink-0', checked ? 'text-green-500' : 'text-gray-400')} />
                    <span className={clsx('text-sm', checked ? 'text-green-700 font-medium' : 'text-gray-600')}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Notes */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
          Meeting Notes
        </label>
        <textarea
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 resize-none h-24"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add notes about the activation meeting — attendees, issues, observations…"
        />
      </div>

      {/* Save button */}
      <button onClick={save} disabled={saving}
        className={clsx('w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
          allComplete
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-navy-800 text-white hover:bg-navy-900'
        )}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : null}
        {saving ? 'Saving…' : allComplete ? '✅ Complete Activation & Activate Student' : 'Save Checklist Progress'}
      </button>
    </div>
  )
}
