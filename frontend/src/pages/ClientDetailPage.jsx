import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Mail, Phone, Building2, Hash, MapPin } from 'lucide-react'
import api from '../lib/api'
import { PageSpinner, StatusBadge, PriorityBadge } from '../components/ui'
import { fmtDate } from '../lib/utils'

export default function ClientDetailPage() {
  const { id } = useParams()

  const { data: client, isLoading } = useQuery({
    queryKey: ['clients', id],
    queryFn: () => api.get(`/clients/${id}`).then((r) => r.data),
  })

  if (isLoading) return <PageSpinner />
  if (!client) return <p className="text-center text-surface-400 py-16">Client not found.</p>

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link to="/clients" className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800 transition-colors">
        <ArrowLeft size={15} /> Back to Clients
      </Link>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-2xl flex-shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-surface-900">{client.name}</h1>
              <StatusBadge status={client.status} />
            </div>
            {client.company && (
              <p className="text-surface-500 flex items-center gap-1.5 mt-1">
                <Building2 size={14} /> {client.company}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-surface-100">
          {[
            { icon: Mail, label: 'Email', value: client.email },
            { icon: Phone, label: 'Phone', value: client.phone },
            { icon: Hash, label: 'Tax ID', value: client.tax_id, mono: true },
            { icon: MapPin, label: 'Address', value: client.address },
          ].map(({ icon: Icon, label, value, mono }) => (
            <div key={label}>
              <p className="text-xs text-surface-400 uppercase font-semibold tracking-wide mb-1">{label}</p>
              <p className={`text-sm text-surface-700 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
            </div>
          ))}
        </div>

        {client.notes && (
          <div className="mt-4 pt-4 border-t border-surface-100">
            <p className="text-xs text-surface-400 uppercase font-semibold tracking-wide mb-1">Notes</p>
            <p className="text-sm text-surface-600 whitespace-pre-line">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Recent tasks */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h2 className="font-semibold">Recent Tasks ({client.recent_tasks?.length ?? 0})</h2>
          <Link to={`/tasks?client_id=${client.id}`} className="text-xs text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-surface-50">
          {!client.recent_tasks?.length ? (
            <p className="text-center text-sm text-surface-400 py-8">No tasks for this client.</p>
          ) : (
            client.recent_tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                <PriorityBadge priority={t.priority} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{t.title}</p>
                  <p className="text-xs text-surface-400">{t.assigned_to_name || 'Unassigned'}</p>
                </div>
                <StatusBadge status={t.status} />
                <span className="text-xs text-surface-400 w-24 text-right">{fmtDate(t.due_date)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Meta */}
      <p className="text-xs text-surface-400 px-1">
        Added {fmtDate(client.created_at)} by {client.created_by_name || 'unknown'}
      </p>
    </div>
  )
}
