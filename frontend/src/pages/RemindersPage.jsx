import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Bell, Trash2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { PageSpinner, EmptyState, Modal, ConfirmDialog } from '../components/ui'
import { fmtDate, fmtRelative } from '../lib/utils'

const EMPTY_FORM = {
  task_id: '', title: '', message: '', notify_at: '', channel: 'email',
}

export default function RemindersPage() {
  const qc = useQueryClient()
  const [showSent, setShowSent] = useState(false)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['reminders', showSent],
    queryFn: () =>
      api.get('/reminders', { params: { sent: showSent ? undefined : 'false' } })
         .then((r) => r.data),
  })

  // Fetch tasks for dropdown
  const { data: tasksData } = useQuery({
    queryKey: ['tasks-all'],
    queryFn: () => api.get('/tasks', { params: { limit: 200 } }).then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/reminders', body),
    onSuccess: () => { qc.invalidateQueries(['reminders']); setModal(false); setForm(EMPTY_FORM); toast.success('Reminder set') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to create reminder'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/reminders/${id}`),
    onSuccess: () => { qc.invalidateQueries(['reminders']); toast.success('Reminder deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const reminders = data?.data || []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reminders</h1>
          <p className="text-sm text-surface-500 mt-0.5">Email notifications for upcoming tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-surface-600 cursor-pointer">
            <input
              type="checkbox"
              className="rounded"
              checked={showSent}
              onChange={(e) => setShowSent(e.target.checked)}
            />
            Show sent
          </label>
          <button className="btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Set Reminder
          </button>
        </div>
      </div>

      {isLoading ? <PageSpinner /> : (
        <div className="space-y-3">
          {!reminders.length ? (
            <div className="card">
              <EmptyState
                icon={Bell}
                title="No reminders"
                description="Set reminders to get notified before tasks are due."
                action={
                  <button className="btn-primary" onClick={() => setModal(true)}>
                    <Plus size={14} /> Set Reminder
                  </button>
                }
              />
            </div>
          ) : (
            reminders.map((r) => (
              <div key={r.id} className={`card px-5 py-4 flex items-start gap-4 ${r.sent ? 'opacity-60' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  ${r.sent ? 'bg-surface-100 text-surface-400' : 'bg-brand-50 text-brand-600'}`}>
                  {r.sent ? <CheckCircle size={20} /> : <Bell size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900">{r.title || r.task_title}</p>
                  {r.task_title && r.title && (
                    <p className="text-sm text-surface-500 mt-0.5">Task: {r.task_title}</p>
                  )}
                  {r.client_name && (
                    <p className="text-xs text-surface-400 mt-0.5">Client: {r.client_name}</p>
                  )}
                  {r.message && (
                    <p className="text-sm text-surface-600 mt-1 bg-surface-50 rounded-lg px-3 py-2">{r.message}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-surface-700">
                    {fmtDate(r.notify_at)}
                  </p>
                  <p className="text-xs text-surface-400 mt-0.5">{fmtRelative(r.notify_at)}</p>
                  {r.sent && (
                    <span className="badge bg-emerald-50 text-emerald-600 border border-emerald-200 mt-1">
                      Sent
                    </span>
                  )}
                  <span className={`badge mt-1 ml-1 ${r.channel === 'email'
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'bg-purple-50 text-purple-600 border border-purple-200'}`}>
                    {r.channel}
                  </span>
                </div>
                {!r.sent && (
                  <button
                    className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                    onClick={() => setDeleteId(r.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Create reminder modal */}
      <Modal open={modal} onClose={() => { setModal(false); setForm(EMPTY_FORM) }} title="Set Reminder">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <div>
            <label className="label">Task *</label>
            <select className="input" required value={form.task_id}
              onChange={(e) => setForm({...form, task_id: e.target.value})}>
              <option value="">Select a task…</option>
              {tasksData?.data?.filter((t) => t.status !== 'completed').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}{t.client_name ? ` — ${t.client_name}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Reminder title</label>
            <input className="input" placeholder="Optional custom title…" value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})} />
          </div>
          <div>
            <label className="label">Notify at *</label>
            <input type="datetime-local" className="input" required value={form.notify_at}
              onChange={(e) => setForm({...form, notify_at: e.target.value})} />
          </div>
          <div>
            <label className="label">Channel</label>
            <select className="input" value={form.channel}
              onChange={(e) => setForm({...form, channel: e.target.value})}>
              <option value="email">Email</option>
              <option value="push">Push</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className="label">Message (optional)</label>
            <textarea className="input resize-none" rows={3} placeholder="Add a note for this reminder…"
              value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={() => { setModal(false); setForm(EMPTY_FORM) }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving…' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Reminder" message="Remove this reminder? The email will not be sent." danger
      />
    </div>
  )
}
