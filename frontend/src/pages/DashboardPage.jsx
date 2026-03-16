import { useQuery } from '@tanstack/react-query'
import { Users, CheckSquare, AlertTriangle, TrendingUp } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../lib/authStore'
import { StatCard, PageSpinner, StatusBadge, PriorityBadge } from '../components/ui'
import { fmtDate, fmtRelative, dueDateLabel } from '../lib/utils'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
    refetchInterval: 120_000,
  })

  if (isLoading) return <PageSpinner />
  if (isError || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-surface-900">لوحة التحكم</h1>
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          تعذر تحميل بيانات لوحة التحكم حاليًا. تأكد من اتصال الخادم وحالة قاعدة البيانات.
        </p>
      </div>
    )
  }

  const { stats, upcoming_tasks, pending_reminders, recent_activity } = data

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">
          Good {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-surface-500 text-sm mt-0.5">Here's what's happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Clients"
          value={stats.total_clients}
          icon={Users}
          color="brand"
        />
        <StatCard
          label="Pending Tasks"
          value={stats.tasks.pending}
          icon={CheckSquare}
          color="amber"
        />
        <StatCard
          label="In Progress"
          value={stats.tasks.in_progress}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          label="Overdue"
          value={stats.tasks.overdue}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Two-column lower area */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming tasks */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
            <h2 className="font-semibold text-sm">Upcoming Tasks (7 days)</h2>
            <Link to="/tasks" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-surface-50">
            {upcoming_tasks.length === 0 ? (
              <p className="text-center text-sm text-surface-400 py-8">No upcoming tasks 🎉</p>
            ) : (
              upcoming_tasks.map((t) => (
                <div key={t.id} className="flex items-start gap-3 px-5 py-3.5">
                  <PriorityBadge priority={t.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{t.title}</p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {t.client_name && `${t.client_name} · `}
                      {t.assigned_to_name}
                    </p>
                  </div>
                  <span className={`text-xs whitespace-nowrap font-medium ${
                    t.due_date && new Date(t.due_date) < new Date()
                      ? 'text-red-500' : 'text-surface-400'
                  }`}>
                    {fmtDate(t.due_date)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reminders + Recent */}
        <div className="space-y-6">
          {/* Pending reminders */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
              <h2 className="font-semibold text-sm">Pending Reminders</h2>
              <Link to="/reminders" className="text-xs text-brand-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-surface-50">
              {pending_reminders.length === 0 ? (
                <p className="text-center text-sm text-surface-400 py-8">No reminders set</p>
              ) : (
                pending_reminders.map((r) => (
                  <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title || r.task_title}</p>
                      <p className="text-xs text-surface-400">{fmtRelative(r.notify_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent completions */}
          <div className="card">
            <div className="px-5 py-4 border-b border-surface-100">
              <h2 className="font-semibold text-sm">Recently Completed</h2>
            </div>
            <div className="divide-y divide-surface-50">
              {recent_activity.length === 0 ? (
                <p className="text-center text-sm text-surface-400 py-6">Nothing yet</p>
              ) : (
                recent_activity.map((t) => (
                  <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                    <span className="text-emerald-500 text-base">✓</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-surface-400">{fmtRelative(t.completed_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}
