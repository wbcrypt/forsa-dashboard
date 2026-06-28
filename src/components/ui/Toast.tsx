import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import clsx from 'clsx'
import type { Toast } from '../../hooks/useToast'

export function ToastContainer({ toasts, onRemove }: {
  toasts: Toast[]
  onRemove: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={clsx(
            'flex items-start gap-3 p-4 rounded-xl shadow-modal border animate-fade-in',
            toast.type === 'success' && 'bg-green-50 border-green-200 text-green-800',
            toast.type === 'error' && 'bg-red-50 border-red-200 text-red-800',
            toast.type === 'warning' && 'bg-yellow-50 border-yellow-200 text-yellow-800',
            toast.type === 'info' && 'bg-blue-50 border-blue-200 text-blue-800',
          )}
        >
          {toast.type === 'success' && <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
          {(toast.type === 'info' || toast.type === 'warning') && <Info size={16} className="flex-shrink-0 mt-0.5" />}
          <p className="text-sm flex-1">{toast.message}</p>
          <button onClick={() => onRemove(toast.id)} className="opacity-60 hover:opacity-100 flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
