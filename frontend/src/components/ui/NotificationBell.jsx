import { Bell } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { fmtRelative } from '../../lib/utils'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Fetch unsent reminders due in the future (upcoming)
  const { data } = useQuery({
    queryKey: ['reminders', 'upcoming'],
    queryFn: () => api.get('/reminders?sent=false').then(r => r.data),
    refetchInterval: 60_000, // Refresh every minute
  })

  const count = data?.data?.length ?? 0

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-surface-500 hover:bg-surface-100 transition-colors"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 card shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-100 flex items-center justify-between">
            <span className="text-sm font-semibold">Upcoming Reminders</span>
            <span className="badge bg-brand-50 text-brand-600">{count}</span>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-surface-100">
            {count === 0 ? (
              <p className="text-center text-sm text-surface-400 py-6">No pending reminders</p>
            ) : (
              data.data.slice(0, 10).map((r) => (
                <div key={r.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-surface-800 truncate">
                    {r.title || r.task_title}
                  </p>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {fmtRelative(r.notify_at)}
                    {r.client_name && ` · ${r.client_name}`}
                  </p>
                </div>
              ))
            )}
          </div>
          {count > 0 && (
            <a
              href="/reminders"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-brand-600 hover:underline py-3 border-t border-surface-100"
            >
              View all reminders →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
