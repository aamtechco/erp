import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, Trash2, Eye, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../lib/api'
import useAuthStore from '../lib/authStore'
import {
  PageSpinner, EmptyState, Modal, ConfirmDialog,
  StatusBadge, Pagination,
} from '../components/ui'
import { fmtDate } from '../lib/utils'

const EMPTY_FORM = {
  name: '', email: '', phone: '', company: '',
  tax_id: '', address: '', notes: '', status: 'active',
}

export default function ClientsPage() {
  const qc = useQueryClient()
  const { hasRole } = useAuthStore()
  const canEdit = hasRole('admin', 'accountant')

  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState(null)

  // Fetch clients
  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search, status],
    queryFn: () =>
      api.get('/clients', { params: { page, limit: 15, search, status } })
         .then((r) => r.data),
    keepPreviousData: true,
  })

  // Create
  const createMutation = useMutation({
    mutationFn: (body) => api.post('/clients', body),
    onSuccess: () => { qc.invalidateQueries(['clients']); closeModal(); toast.success('Client created') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to create client'),
  })

  // Update
  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/clients/${id}`, body),
    onSuccess: () => { qc.invalidateQueries(['clients']); closeModal(); toast.success('Client updated') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to update client'),
  })

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/clients/${id}`),
    onSuccess: () => { qc.invalidateQueries(['clients']); toast.success('Client deleted') },
    onError: () => toast.error('Failed to delete client'),
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true) }
  const openEdit = (c) => {
    setEditing(c)
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', company: c.company || '',
              tax_id: c.tax_id || '', address: c.address || '', notes: c.notes || '', status: c.status })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null); setForm(EMPTY_FORM) }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) updateMutation.mutate({ id: editing.id, ...form })
    else createMutation.mutate(form)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="text-sm text-surface-500 mt-0.5">{data?.total ?? 0} total clients</p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Client
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="input w-40"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="prospect">Prospect</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? <PageSpinner /> : (
        <div className="card overflow-hidden">
          {!data?.data?.length ? (
            <EmptyState
              icon={Building2}
              title="No clients yet"
              description="Add your first client to get started."
              action={canEdit && <button className="btn-primary" onClick={openCreate}><Plus size={14}/> Add Client</button>}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-50 border-b border-surface-100">
                    <tr>
                      {['Name', 'Company', 'Contact', 'Tax ID', 'Status', 'Tasks', 'Added', ''].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {data.data.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-50/60 transition-colors">
                        <td className="px-4 py-3 font-medium text-surface-900">{c.name}</td>
                        <td className="px-4 py-3 text-surface-600">{c.company || '—'}</td>
                        <td className="px-4 py-3 text-surface-500">
                          <div>{c.email || '—'}</div>
                          {c.phone && <div className="text-xs">{c.phone}</div>}
                        </td>
                        <td className="px-4 py-3 text-surface-500 font-mono text-xs">{c.tax_id || '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3 text-surface-600">{c.task_count}</td>
                        <td className="px-4 py-3 text-surface-400 text-xs">{fmtDate(c.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Link to={`/clients/${c.id}`} className="btn-ghost p-1.5" title="View">
                              <Eye size={15} />
                            </Link>
                            {canEdit && (
                              <>
                                <button className="btn-ghost p-1.5" onClick={() => openEdit(c)} title="Edit">
                                  <Pencil size={15} />
                                </button>
                                <button className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteId(c.id)} title="Delete">
                                  <Trash2 size={15} />
                                </button>
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

      {/* Create / Edit modal */}
      <Modal open={modal} onClose={closeModal} title={editing ? 'Edit Client' : 'Add Client'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="label">Company</label>
              <input className="input" value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <label className="label">Tax ID</label>
              <input className="input font-mono" value={form.tax_id} onChange={(e) => setForm({...form, tax_id: e.target.value})} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prospect">Prospect</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input resize-none" rows={2} value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Client"
        message="This will permanently delete the client and all associated tasks. This action cannot be undone."
        danger
      />
    </div>
  )
}
