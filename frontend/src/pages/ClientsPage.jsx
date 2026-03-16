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
  name: '',
  company: '',
  email: '',
  phone: '',
  tax_id: '',
  status: 'active',
  address: '',
  notes: '',
  client_number: '',
  full_name: '',
  mobile: '',
  median_name: '',
  median_mobile: '',
  agreed_payment: '',
  id_number: '',
  tax_number: '',
  commercial_reg_number: '',
  activity_field: '',
  commercial_reg_office: '',
  commercial_reg_renewal_date: '',
  tax_office: '',
  vat_tax_office: '',
  ebill: '',
  capital_amount: '',
  work_start_date: '',
  work_end_date: '',
  last_tax_examine_date: '',
  last_vat_examine_date: '',
  vat_start_date: '',
  platform_subscription: '',
  platform_renewal_date: '',
  gmail_email: '',
  gmail_password: '',
  tax_vat_email: '',
  tax_vat_password: '',
  ebill_email: '',
  ebill_password: '',
  portal_email: '',
  portal_password: '',
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
  const [viewOnly, setViewOnly] = useState(false)
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

  const openCreate = () => { setEditing(null); setViewOnly(false); setForm(EMPTY_FORM); setModal(true) }
  const openEdit = (c) => {
    setEditing(c)
    setViewOnly(false)
    setForm({
      ...EMPTY_FORM,
      ...c,
      agreed_payment: c.agreed_payment ?? '',
      capital_amount: c.capital_amount ?? '',
    })
    setModal(true)
  }
  const openView = (c) => {
    setEditing(c)
    setViewOnly(true)
    setForm({
      ...EMPTY_FORM,
      ...c,
      agreed_payment: c.agreed_payment ?? '',
      capital_amount: c.capital_amount ?? '',
    })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null); setViewOnly(false); setForm(EMPTY_FORM) }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (viewOnly) return
    if (editing) updateMutation.mutate({ id: editing.id, ...form })
    else createMutation.mutate(form)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">العملاء</h1>
          <p className="text-sm text-surface-500 mt-0.5">إجمالي العملاء: {data?.total ?? 0}</p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> إضافة عميل جديد
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="search"
            className="input pl-9"
            placeholder="بحث عن عميل..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="input w-40"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
          <option value="prospect">عميل محتمل</option>
        </select>
      </div>

      {isLoading ? <PageSpinner /> : (
        <div className="card overflow-hidden">
          {!data?.data?.length ? (
            <EmptyState
              icon={Building2}
              title="لا يوجد عملاء بعد"
              description="أضف أول عميل للبدء في استخدام النظام."
              action={canEdit && <button className="btn-primary" onClick={openCreate}><Plus size={14}/> إضافة عميل</button>}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-50 border-b border-surface-100">
                    <tr>
                      {['اسم العميل', 'الشركة', 'بيانات التواصل', 'الرقم الضريبي', 'الحالة', 'عدد المهام', 'تاريخ الإضافة', ''].map((h) => (
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
                            <button className="btn-ghost p-1.5" onClick={() => openView(c)} title="عرض">
                              <Eye size={15} />
                            </button>
                            {canEdit && (
                              <>
                                <button className="btn-ghost p-1.5" onClick={() => openEdit(c)} title="تعديل">
                                  <Pencil size={15} />
                                </button>
                                <button className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteId(c.id)} title="حذف">
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

      <Modal
        open={modal}
        onClose={closeModal}
        title={
          viewOnly
            ? 'عرض بيانات العميل'
            : editing
              ? 'تعديل بيانات العميل'
              : 'إضافة عميل جديد'
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">رقم العميل</label>
              <input
                className="input"
                value={form.client_number}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, client_number: e.target.value })}
              />
            </div>
            <div>
              <label className="label">الاسم الكامل *</label>
              <input
                className="input"
                required
                value={form.full_name}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">اسم مختصر / اسم العرض</label>
              <input
                className="input"
                value={form.name}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">رقم الجوال</label>
              <input
                className="input"
                value={form.mobile}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />
            </div>
            <div>
              <label className="label">اسم الوسيط</label>
              <input
                className="input"
                value={form.median_name}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, median_name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">رقم الوسيط</label>
              <input
                className="input"
                value={form.median_mobile}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, median_mobile: e.target.value })}
              />
            </div>
            <div>
              <label className="label">المدفوع المتفق عليه</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.agreed_payment}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, agreed_payment: e.target.value })}
              />
            </div>
            <div>
              <label className="label">الرقم القومي</label>
              <input
                className="input"
                value={form.id_number}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, id_number: e.target.value })}
              />
            </div>
            <div>
              <label className="label">الرقم الضريبي (9 أرقام)</label>
              <input
                className="input font-mono"
                value={form.tax_id}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                maxLength={9}
              />
            </div>
            <div>
              <label className="label">رقم ضريبي إضافي</label>
              <input
                className="input"
                value={form.tax_number}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
              />
            </div>
            <div>
              <label className="label">رقم السجل التجاري</label>
              <input
                className="input"
                value={form.commercial_reg_number}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, commercial_reg_number: e.target.value })}
              />
            </div>
            <div>
              <label className="label">مجال النشاط</label>
              <input
                className="input"
                value={form.activity_field}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, activity_field: e.target.value })}
              />
            </div>
            <div>
              <label className="label">مكتب السجل التجاري</label>
              <input
                className="input"
                value={form.commercial_reg_office}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, commercial_reg_office: e.target.value })}
              />
            </div>
            <div>
              <label className="label">تاريخ تجديد السجل التجاري</label>
              <input
                type="date"
                className="input"
                value={form.commercial_reg_renewal_date}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, commercial_reg_renewal_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">مكتب الضرائب</label>
              <input
                className="input"
                value={form.tax_office}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, tax_office: e.target.value })}
              />
            </div>
            <div>
              <label className="label">مكتب ضريبة القيمة المضافة</label>
              <input
                className="input"
                value={form.vat_tax_office}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, vat_tax_office: e.target.value })}
              />
            </div>
            <div>
              <label className="label">فاتورة إلكترونية</label>
              <select
                className="input"
                value={form.ebill}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, ebill: e.target.value })}
              >
                <option value="">—</option>
                <option value="مشترك">مشترك</option>
                <option value="غير مشترك">غير مشترك</option>
              </select>
            </div>
            <div>
              <label className="label">قيمة رأس المال</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.capital_amount}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, capital_amount: e.target.value })}
              />
            </div>
            <div>
              <label className="label">تاريخ بدء العمل</label>
              <input
                type="date"
                className="input"
                value={form.work_start_date}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, work_start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">تاريخ انتهاء العمل</label>
              <input
                type="date"
                className="input"
                value={form.work_end_date}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, work_end_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">تاريخ آخر فحص ضريبي</label>
              <input
                type="date"
                className="input"
                value={form.last_tax_examine_date}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, last_tax_examine_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">تاريخ بدء القيمة المضافة</label>
              <input
                type="date"
                className="input"
                value={form.vat_start_date}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, vat_start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">تاريخ آخر فحص قيمة مضافة</label>
              <input
                type="date"
                className="input"
                value={form.last_vat_examine_date}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, last_vat_examine_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">اشتراك المنصة</label>
              <select
                className="input"
                value={form.platform_subscription}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, platform_subscription: e.target.value })}
              >
                <option value="">—</option>
                <option value="شهري">شهري</option>
                <option value="سنوي">سنوي</option>
              </select>
            </div>
            <div>
              <label className="label">تاريخ تجديد اشتراك المنصة</label>
              <input
                type="date"
                className="input"
                value={form.platform_renewal_date}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, platform_renewal_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">بريد جيميل</label>
              <input
                className="input"
                value={form.gmail_email}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, gmail_email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">كلمة مرور جيميل</label>
              <input
                className="input"
                value={form.gmail_password}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, gmail_password: e.target.value })}
              />
            </div>
            <div>
              <label className="label">بريد الضرائب والقيمة المضافة</label>
              <input
                className="input"
                value={form.tax_vat_email}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, tax_vat_email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">كلمة المرور للضرائب والقيمة المضافة</label>
              <input
                className="input"
                value={form.tax_vat_password}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, tax_vat_password: e.target.value })}
              />
            </div>
            <div>
              <label className="label">بريد الفاتورة الإلكترونية</label>
              <input
                className="input"
                value={form.ebill_email}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, ebill_email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">كلمة مرور الفاتورة الإلكترونية</label>
              <input
                className="input"
                value={form.ebill_password}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, ebill_password: e.target.value })}
              />
            </div>
            <div>
              <label className="label">بريد المنصة</label>
              <input
                className="input"
                value={form.portal_email}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, portal_email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">كلمة مرور المنصة</label>
              <input
                className="input"
                value={form.portal_password}
                disabled={viewOnly}
                onChange={(e) => setForm({ ...form, portal_password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">العنوان</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.address}
              disabled={viewOnly}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="label">ملاحظات</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.notes}
              disabled={viewOnly}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={closeModal}>إغلاق</button>
            {!viewOnly && (
              <button type="submit" className="btn-primary" disabled={isPending}>
                {isPending ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إنشاء العميل'}
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="حذف العميل"
        message="سيتم حذف العميل وجميع المهام المرتبطة به نهائيًا. لا يمكن التراجع عن هذا الإجراء."
        danger
      />
    </div>
  )
}
