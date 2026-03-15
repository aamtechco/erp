import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { BarChart3, Download } from 'lucide-react'
import api from '../lib/api'
import { PageSpinner, StatCard } from '../components/ui'
import { fmtDate } from '../lib/utils'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4']

export default function ReportsPage() {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [start, setStart] = useState(firstOfMonth.toISOString().split('T')[0])
  const [end, setEnd]     = useState(today.toISOString().split('T')[0])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports-summary', start, end],
    queryFn: () =>
      api.get('/reports/summary', { params: { period_start: start, period_end: end } })
         .then((r) => r.data),
  })

  const handleExport = () => {
    if (!data) return
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `erp-report-${start}-to-${end}.json`
    a.click()
  }

  // Format task trend data for chart
  const trendData = data?.task_trend?.map((d) => ({
    date: fmtDate(d.date),
    Tasks: parseInt(d.count),
  })) ?? []

  // Format pie data
  const statusPie = (data?.tasks_by_status ?? []).map((d) => ({
    name: d.status.replace('_', ' '),
    value: parseInt(d.count),
  }))

  const priorityPie = (data?.tasks_by_priority ?? []).map((d) => ({
    name: d.priority,
    value: parseInt(d.count),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm text-surface-500 mt-0.5">Activity and task overview</p>
        </div>
        <button className="btn-secondary" onClick={handleExport} disabled={!data}>
          <Download size={15} /> Export JSON
        </button>
      </div>

      {/* Period filter */}
      <div className="card px-5 py-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="label">From</label>
          <input type="date" className="input w-40" value={start}
            onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input w-40" value={end}
            onChange={(e) => setEnd(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={() => refetch()}>
          <BarChart3 size={15} /> Generate
        </button>

        {/* Quick presets */}
        <div className="flex gap-2 ml-auto flex-wrap">
          {[
            { label: 'This month', fn: () => {
              setStart(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0])
              setEnd(today.toISOString().split('T')[0])
            }},
            { label: 'Last 30 days', fn: () => {
              const d = new Date(today); d.setDate(d.getDate() - 30)
              setStart(d.toISOString().split('T')[0])
              setEnd(today.toISOString().split('T')[0])
            }},
            { label: 'This year', fn: () => {
              setStart(`${today.getFullYear()}-01-01`)
              setEnd(today.toISOString().split('T')[0])
            }},
          ].map(({ label, fn }) => (
            <button key={label} className="btn-secondary text-xs px-3 py-1.5" onClick={fn}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <PageSpinner /> : !data ? null : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Completed (period)"
              value={data.completed_this_period}
              color="green"
            />
            <StatCard
              label="Currently Overdue"
              value={data.overdue_tasks}
              color="red"
            />
            <StatCard
              label="Active Clients"
              value={data.clients_by_status?.find((c) => c.status === 'active')?.count ?? 0}
              color="brand"
            />
            <StatCard
              label="Prospect Clients"
              value={data.clients_by_status?.find((c) => c.status === 'prospect')?.count ?? 0}
              color="purple"
            />
          </div>

          {/* Charts row 1 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Task trend line chart */}
            <div className="card p-5">
              <h2 className="font-semibold text-sm mb-4">Tasks Created (Last 30 days)</h2>
              {trendData.length === 0 ? (
                <p className="text-sm text-surface-400 text-center py-8">No data for this period</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#18181b', border: 'none', borderRadius: 8, color: '#fafafa', fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="Tasks" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tasks by status pie */}
            <div className="card p-5">
              <h2 className="font-semibold text-sm mb-4">Tasks by Status</h2>
              {statusPie.length === 0 ? (
                <p className="text-sm text-surface-400 text-center py-8">No data</p>
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={statusPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusPie.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#18181b', border: 'none', borderRadius: 8, color: '#fafafa', fontSize: 12 }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(v) => <span style={{ fontSize: 12, color: '#71717a' }}>{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Tasks by priority bar */}
            <div className="card p-5">
              <h2 className="font-semibold text-sm mb-4">Tasks by Priority</h2>
              {priorityPie.length === 0 ? (
                <p className="text-sm text-surface-400 text-center py-8">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={priorityPie} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#a1a1aa' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#18181b', border: 'none', borderRadius: 8, color: '#fafafa', fontSize: 12 }}
                    />
                    <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                      {priorityPie.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top performers */}
            <div className="card p-5">
              <h2 className="font-semibold text-sm mb-4">Top Performers (completed tasks)</h2>
              {data.top_users?.length === 0 ? (
                <p className="text-sm text-surface-400 text-center py-8">No completions in this period</p>
              ) : (
                <div className="space-y-3">
                  {data.top_users?.map((u, i) => {
                    const max = data.top_users[0]?.completed_tasks || 1
                    const pct = Math.round((u.completed_tasks / max) * 100)
                    return (
                      <div key={u.name} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-surface-400 w-4">{i + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-surface-700">{u.name}</span>
                            <span className="text-surface-400">{u.completed_tasks} tasks</span>
                          </div>
                          <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
