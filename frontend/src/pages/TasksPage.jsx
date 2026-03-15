import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, Trash2, CheckCircle, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import useAuthStore from '../lib/authStore'
import {
  PageSpinner, EmptyState, Modal, ConfirmDialog,
  StatusBadge, PriorityBadge, Pagination,
} from '../components/ui'
import { fmtDate, cap } from '../lib/utils'

const EMPTY_FORM = {
  title: '', description: '', client_id: '', assigned_to: '',
  due_date: '', priority: 'medium', status: 'pending',
}

export default function TasksPage() {
  const qc = useQueryClient()
  const { hasRole } = useAuthStore()
  const canEdit = hasRole('admin', 'accountant')

  const [page, setPage]         = useState(1)
  const [filterStatus, setFS]   = useState('')
  const [filterPriority, setFP] = useState('')
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', page, filterStatus, filterPriority],
    queryFn: () =>
      api.get('/tasks', { params: { page, limit: 15, status: filterStatus, priority: filterPriority } })
         .then((r) => r.data),
    keepPreviousData: true,
  })

  // Clients + Users for dropdowns
  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => api.get('/clients', { params: { limit: 200 } }).then((r) => r.data),
  })
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: canEdit,
  })

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/tasks', body),
    onSuccess: () => { qc.invalidateQueries(['tasks']); closeModal(); toast.success('Task created') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/tasks/${id}`, body),
    onSuccess: () => { qc.invalidateQueries(['tasks']); closeModal(); toast.success('Task updated') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/tasks/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries(['tasks']); qc.invalidateQueries(['dashboard']); toast.success('Status updated') },
    onError: () => toast.error('Failed to update status'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => { qc.invalidateQueries(['tasks']); toast.success('Task deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true) }
  const openEdit = (t) => {
    setEditing(t)
    setForm({
      title: t.title, description: t.description || '',
      client_id: t.client_id || '', assigned_to: t.assigned_to || '',
      due_date: t.due_date ? t.due_date.split('T')[0] : '',
      priority: t.priority, status: t.status,
    })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null); setForm(EMPTY_FORM) }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) updateMutation.mutate({ id: editing.id, ...form })
    else createMutation.mutate(form)
  }

  const handleComplete = (t) => {
    const newStatus = t.status === 'completed' ? 'pending' : 'completed'
    statusMutation.mutate({ id: t.id, status: newStatus })
  }

  const filtered = (data?.data || []).filter((t) =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.client_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="text-sm text-surface-500 mt-0.5">{data?.total ?? 0} total tasks</p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input className="input pl-9" placeholder="Search tasks…" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={filterStatus} onChange={(e) => { setFS(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select className="input w-36" value={filterPriority} onChange={(e) => { setFP(e.target.value); setPage(1) }}>
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task list */}
      {isLoading ? <PageSpinner /> : (
        <div className="card overflow-hidden">
          {!filtered.length ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks found"
              description="Create your first task to assign work to your team."
              action={canEdit && <button className="btn-primary" onClick={openCreate}><Plus size={14}/> Add Task</button>}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-50 border-b border-surface-100">
                    <tr>
                      {['', 'Task', 'Client', 'Assigned to', 'Priority', 'Status', 'Due date', ''].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {filtered.map((t) => (
                      <tr key={t.id} className={`hover:bg-surface-50/60 transition-colors ${t.status === 'completed' ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3 w-10">
                          <button
                            onClick={() => handleComplete(t)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0
                              ${t.status === 'completed'
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-surface-300 hover:border-brand-500'
                              }`}
                          >
                            {t.status === 'completed' && <span className="text-[10px]">✓</span>}
                          </button>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className={`font-medium ${t.status === 'completed' ? 'line-through text-surface-400' : 'text-surface-900'}`}>
                            {t.title}
                          </p>
                          {t.description && <p className="text-xs text-surface-400 mt-0.5 truncate">{t.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-surface-600">{t.client_name || '—'}</td>
                        <td className="px-4 py-3 text-surface-500">{t.assigned_to_name || '—'}</td>
                        <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3 text-surface-400 text-xs">
                          <span className={t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed' ? 'text-red-500 font-medium' : ''}>
                            {fmtDate(t.due_date)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            {canEdit && (
                              <>
                                <button className="btn-ghost p-1.5" onClick={() => openEdit(t)}><Pencil size={15}/></button>
                                <button className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteId(t.id)}><Trash2 size={15}/></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 pb-4">
                <Pagination page={page} total={data.total} limit={15} onChange={setPage} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Task form modal */}
      <Modal open={modal} onClose={closeModal} title={editing ? 'Edit Task' : 'New Task'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" required value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Client</label>
              <select className="input" value={form.client_id}
                onChange={(e) => setForm({...form, client_id: e.target.value})}>
                <option value="">— No client —</option>
                {clientsData?.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Assign to</label>
              <select className="input" value={form.assigned_to}
                onChange={(e) => setForm({...form, assigned_to: e.target.value})}>
                <option value="">— Unassigned —</option>
                {usersData?.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input" value={form.due_date}
                onChange={(e) => setForm({...form, due_date: e.target.value})} />
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority}
                onChange={(e) => setForm({...form, priority: e.target.value})}>
                {['low', 'medium', 'high', 'urgent'].map((p) => (
                  <option key={p} value={p}>{cap(p)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status}
                onChange={(e) => setForm({...form, status: e.target.value})}>
                {['pending', 'in_progress', 'completed', 'cancelled'].map((s) => (
                  <option key={s} value={s}>{cap(s)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary"
              disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Task" message="Are you sure you want to delete this task?" danger
      />
    </div>
  )
}
