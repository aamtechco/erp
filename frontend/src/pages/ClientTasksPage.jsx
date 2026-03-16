import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, StickyNote } from 'lucide-react'
import api from '../lib/api'
import { PageSpinner, Modal, EmptyState } from '../components/ui'
import { fmtDate } from '../lib/utils'

const EMPTY_TASK = {
  title: '',
  description: '',
  amount: '',
}

export default function ClientTasksPage() {
  const qc = useQueryClient()

  const [taskModal, setTaskModal] = useState(false)
  const [noteModal, setNoteModal] = useState({ open: false, taskId: null })
  const [taskForm, setTaskForm] = useState(EMPTY_TASK)
  const [noteText, setNoteText] = useState('')

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['client-me'],
    queryFn: () => api.get('/client/me').then((r) => r.data),
  })

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['client-tasks'],
    queryFn: () => api.get('/client/tasks').then((r) => r.data),
  })

  const createTaskMutation = useMutation({
    mutationFn: (body) => api.post('/client/tasks', body),
    onSuccess: () => {
      qc.invalidateQueries(['client-tasks'])
      qc.invalidateQueries(['client-me'])
      setTaskModal(false)
      setTaskForm(EMPTY_TASK)
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: ({ taskId, note }) => api.post(`/client/tasks/${taskId}/notes`, { note }),
    onSuccess: () => {
      setNoteModal({ open: false, taskId: null })
      setNoteText('')
    },
  })

  const tasks = tasksData?.data || []

  const currentTasks = tasks.filter((t) => t.status !== 'completed')
  const completedTasks = tasks.filter((t) => t.status === 'completed')

  const balance = me?.balance || { tasksDue: 0, subscriptionDue: 0, totalDue: 0 }
  const client = me?.client

  const handleCreateTask = (e) => {
    e.preventDefault()
    createTaskMutation.mutate({
      title: taskForm.title,
      description: taskForm.description || undefined,
      amount: taskForm.amount ? Number(taskForm.amount) : undefined,
    })
  }

  const handleAddNote = (e) => {
    e.preventDefault()
    if (!noteModal.taskId) return
    addNoteMutation.mutate({ taskId: noteModal.taskId, note: noteText })
  }

  if (meLoading || tasksLoading) {
    return <PageSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">مهامي</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            هنا يمكنك متابعة المهام الحالية، إضافة مهام جديدة، وإرسال ملاحظات للمكتب.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setTaskModal(true)}>
          <Plus size={16} /> إضافة مهمة جديدة
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4 md:col-span-2 space-y-1">
          <p className="text-sm text-surface-500">اسم العميل</p>
          <p className="font-medium text-surface-900">{client?.name}</p>
          <p className="text-sm text-surface-500 mt-2">الرقم الضريبي / رقم السجل</p>
          <p className="font-mono text-surface-800">{client?.taxId || '—'}</p>
          {client?.company && (
            <>
              <p className="text-sm text-surface-500 mt-2">الشركة</p>
              <p className="font-medium text-surface-900">{client.company}</p>
            </>
          )}
        </div>
        <div className="card p-4 space-y-2">
          <p className="text-sm font-semibold text-surface-700">الرصيد المستحق</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600">{balance.totalDue ?? 0}</span>
            <span className="text-xs text-surface-500">جنيه</span>
          </div>
          <p className="text-xs text-surface-500">
            مهام مكتملة غير مدفوعة: <span className="font-semibold">{balance.tasksDue ?? 0}</span>
          </p>
          <p className="text-xs text-surface-500">
            رسوم اشتراك مستحقة: <span className="font-semibold">{balance.subscriptionDue ?? 0}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-4">
          <h2 className="text-sm font-semibold mb-3 text-surface-800">المهام الحالية</h2>
          {!currentTasks.length ? (
            <EmptyState
              icon={StickyNote}
              title="لا توجد مهام حالية"
              description="يمكنك إضافة مهمة جديدة من الزر أعلاه."
            />
          ) : (
            <ul className="space-y-3 text-sm">
              {currentTasks.map((t) => (
                <li key={t.id} className="border border-surface-100 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-surface-900">{t.title}</p>
                    <span className="text-xs text-surface-500">
                      الحالة: {t.status === 'pending' ? 'قيد الانتظار' : t.status === 'in_progress' ? 'قيد التنفيذ' : t.status}
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-xs text-surface-500 mt-1">{t.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2 text-xs text-surface-500">
                    <span>القيمة: {t.amount ?? '—'}</span>
                    <span>تاريخ الاستحقاق: {fmtDate(t.due_date)}</span>
                  </div>
                  <button
                    className="btn-ghost mt-2 text-xs px-2 py-1"
                    onClick={() => setNoteModal({ open: true, taskId: t.id })}
                  >
                    <StickyNote size={12} className="ml-1" />
                    إضافة ملاحظة
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold mb-3 text-surface-800">المهام المكتملة</h2>
          {!completedTasks.length ? (
            <p className="text-xs text-surface-500">لا توجد مهام مكتملة بعد.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {completedTasks.map((t) => (
                <li key={t.id} className="border border-surface-100 rounded-lg p-3 opacity-70">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-surface-900 line-through">{t.title}</p>
                    <span className="text-xs text-surface-500">مكتملة</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-surface-500">
                    <span>القيمة: {t.amount ?? '—'}</span>
                    <span>تاريخ الإكمال: {fmtDate(t.completed_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Create task modal */}
      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="إضافة مهمة جديدة" size="md">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="label">عنوان المهمة *</label>
            <input
              className="input"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label">وصف المهمة</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">قيمة المهمة (اختياري)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={taskForm.amount}
              onChange={(e) => setTaskForm({ ...taskForm, amount: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setTaskModal(false)
                setTaskForm(EMPTY_TASK)
              }}
            >
              إلغاء
            </button>
            <button type="submit" className="btn-primary" disabled={createTaskMutation.isPending}>
              حفظ المهمة
            </button>
          </div>
        </form>
      </Modal>

      {/* Add note modal */}
      <Modal open={noteModal.open} onClose={() => setNoteModal({ open: false, taskId: null })} title="إضافة ملاحظة" size="md">
        <form onSubmit={handleAddNote} className="space-y-4">
          <div>
            <label className="label">نص الملاحظة</label>
            <textarea
              className="input resize-none"
              rows={3}
              required
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setNoteModal({ open: false, taskId: null })
                setNoteText('')
              }}
            >
              إلغاء
            </button>
            <button type="submit" className="btn-primary" disabled={addNoteMutation.isPending}>
              حفظ الملاحظة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

