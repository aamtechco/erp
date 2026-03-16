/** Shared small UI components */

import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'

/** Full-page centered spinner */
export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-brand-500" />
    </div>
  )
}

/** Inline spinner */
export function Spinner({ size = 16 }) {
  return <Loader2 size={size} className="animate-spin text-brand-500" />
}

/** Error box */
export function ErrorBox({ message }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
      <span>{message || 'Something went wrong.'}</span>
    </div>
  )
}

/** Empty state */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center mb-4">
          <Icon size={24} className="text-surface-400" />
        </div>
      )}
      <p className="text-base font-semibold text-surface-700">{title}</p>
      {description && <p className="text-sm text-surface-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Stat card for dashboard */
export function StatCard({ label, value, icon: Icon, color = 'brand', trend }) {
  const colorMap = {
    brand:   'bg-brand-50 text-brand-600',
    green:   'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
    red:     'bg-red-50 text-red-600',
    purple:  'bg-purple-50 text-purple-600',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-surface-900 mt-1">{value ?? '—'}</p>
          {trend && <p className="text-xs text-surface-400 mt-1">{trend}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}

/** Modal wrapper */
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`card w-full ${sizeMap[size]} shadow-xl animate-page max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1 text-surface-400 hover:text-surface-700">✕</button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

/** Confirm dialog */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-surface-600 mb-5">{message}</p>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={() => { onConfirm(); onClose() }}
        >
          Confirm
        </button>
      </div>
    </Modal>
  )
}

/** Pagination controls */
export function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between pt-4 border-t border-surface-100">
      <p className="text-xs text-surface-500">
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          className="btn-ghost p-1"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
              ${p === page ? 'bg-brand-600 text-white' : 'text-surface-600 hover:bg-surface-100'}`}
          >
            {p}
          </button>
        ))}
        <button
          className="btn-ghost p-1"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

/** Status badge */
export function StatusBadge({ status }) {
  const colors = {
    pending:     'bg-amber-50 text-amber-700 border-amber-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    completed:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled:   'bg-surface-100 text-surface-500 border-surface-200',
    active:      'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive:    'bg-surface-100 text-surface-500 border-surface-200',
    prospect:    'bg-purple-50 text-purple-700 border-purple-200',
  }
  return (
    <span className={`badge border ${colors[status] || 'bg-surface-100 text-surface-500'}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}

/** Priority badge */
export function PriorityBadge({ priority }) {
  const colors = {
    low:    'bg-surface-50 text-surface-500 border-surface-200',
    medium: 'bg-blue-50 text-blue-600 border-blue-200',
    high:   'bg-orange-50 text-orange-600 border-orange-200',
    urgent: 'bg-red-50 text-red-600 border-red-200',
  }
  return (
    <span className={`badge border ${colors[priority] || 'bg-surface-50 text-surface-500'}`}>
      {priority}
    </span>
  )
}

/** Select input */
export function Select({ label, value, onChange, options, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(({ value: v, label: l }) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  )
}
