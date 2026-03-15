import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserCog, Pencil, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import useAuthStore from '../lib/authStore'
import { PageSpinner, EmptyState, Modal, StatusBadge } from '../components/ui'
import { fmtDate, cap } from '../lib/utils'

const EMPTY_FORM = { name: '', email: '', password: '', role: 'user' }

export default function UsersPage() {
  const qc = useQueryClient()
  const { hasRole } = useAuthStore()

  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY_FORM)

  if (!hasRole('admin')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-surface-400">
        <Shield size={40} className="mb-3" />
        <p className="font-semibold text-surface-600">Access restricted</p>
        <p className="text-sm mt-1">Only admins can manage users.</p>
      </div>
    )
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/users', body),
    onSuccess: () => { qc.invalidateQueries(['users']); closeModal(); toast.success('User created') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to create user'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/users/${id}`, body),
    onSuccess: () => { qc.invalidateQueries(['users']); closeModal(); toast.success('User updated') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true) }
  const openEdit = (u) => {
    setEditing(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role, is_active: u.is_active })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null); setForm(EMPTY_FORM) }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) {
      const { password, ...rest } = form
      updateMutation.mutate({ id: editing.id, ...rest })
    } else {
      createMutation.mutate(form)
    }
  }

  const roleBadge = (role) => {
    const colors = {
      admin:       'bg-red-50 text-red-700 border border-red-200',
      accountant:  'bg-blue-50 text-blue-700 border border-blue-200',
      user:        'bg-surface-50 text-surface-600 border border-surface-200',
    }
    return (
      <span className={`badge ${colors[role] || ''}`}>{cap(role)}</span>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage system access and roles</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add User
        </button>
      </div>

      {isLoading ? <PageSpinner /> : (
        <div className="card overflow-hidden">
          {!users?.length ? (
            <EmptyState
              icon={UserCog}
              title="No users yet"
              action={<button className="btn-primary" onClick={openCreate}><Plus size={14}/> Add User</button>}
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  {['Name', 'Email', 'Role', 'Status', 'Joined', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-surface-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-surface-600">{u.email}</td>
                    <td className="px-4 py-3">{roleBadge(u.role)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge border ${u.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-surface-100 text-surface-500 border-surface-200'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-surface-400 text-xs">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn-ghost p-1.5" onClick={() => openEdit(u)}>
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Roles legend */}
      <div className="card p-5 mt-6">
        <h2 className="text-sm font-semibold mb-3">Role Permissions</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          {[
            { role: 'Admin', color: 'text-red-600', perms: ['Full access', 'Manage users', 'Delete records', 'View reports'] },
            { role: 'Accountant', color: 'text-blue-600', perms: ['Manage clients & tasks', 'Create reminders', 'View reports', 'Cannot manage users'] },
            { role: 'User', color: 'text-surface-600', perms: ['View assigned tasks', 'Update task status', 'View own reminders', 'No client management'] },
          ].map(({ role, color, perms }) => (
            <div key={role} className="bg-surface-50 rounded-lg p-4">
              <p className={`font-semibold mb-2 ${color}`}>{role}</p>
              <ul className="space-y-1">
                {perms.map((p) => (
                  <li key={p} className="text-xs text-surface-500 flex items-center gap-1.5">
                    <span className="text-emerald-500">✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal open={modal} onClose={closeModal} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" required value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" required value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              disabled={!!editing} />
          </div>
          {!editing && (
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" required minLength={8}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})} />
            </div>
          )}
          <div>
            <label className="label">Role *</label>
            <select className="input" value={form.role}
              onChange={(e) => setForm({...form, role: e.target.value})}>
              <option value="user">User</option>
              <option value="accountant">Accountant</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {editing && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={form.is_active ?? true}
                onChange={(e) => setForm({...form, is_active: e.target.checked})} />
              <label htmlFor="is_active" className="text-sm text-surface-700">Active</label>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary"
              disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
