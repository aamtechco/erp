import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Mail, Phone, Building2, Hash, MapPin, FileText, Trash2, Plus } from 'lucide-react'
import api from '../lib/api'
import { PageSpinner, StatusBadge, PriorityBadge, Modal } from '../components/ui'
import { fmtDate } from '../lib/utils'

export default function ClientDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()

  const [poaModal, setPoaModal] = useState(false)
  const [poaForm, setPoaForm] = useState({
    title: '',
    document_number: '',
    issue_date: '',
    expiry_date: '',
    notes: '',
  })

  const { data: client, isLoading } = useQuery({
    queryKey: ['clients', id],
    queryFn: () => api.get(`/clients/${id}`).then((r) => r.data),
  })

  const createPoaMutation = useMutation({
    mutationFn: (body) => api.post(`/clients/${id}/powers`, body),
    onSuccess: () => {
      qc.invalidateQueries(['clients', id])
      setPoaModal(false)
      setPoaForm({ title: '', document_number: '', issue_date: '', expiry_date: '', notes: '' })
    },
  })

  const deletePoaMutation = useMutation({
    mutationFn: (powerId) => api.delete(`/clients/${id}/powers/${powerId}`),
    onSuccess: () => qc.invalidateQueries(['clients', id]),
  })

  if (isLoading) return <PageSpinner />
  if (!client) return <p className="text-center text-surface-400 py-16">لم يتم العثور على العميل.</p>

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/clients" className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800 transition-colors">
        <ArrowLeft size={15} /> رجوع إلى قائمة العملاء
      </Link>

      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-2xl flex-shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-surface-900">{client.full_name || client.name}</h1>
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
            { icon: Mail, label: 'البريد الإلكتروني', value: client.email },
            { icon: Phone, label: 'رقم الجوال', value: client.mobile || client.phone },
            { icon: Hash, label: 'الرقم الضريبي (دخول)', value: client.tax_id, mono: true },
            { icon: MapPin, label: 'العنوان', value: client.address },
          ].map(({ icon: Icon, label, value, mono }) => (
            <div key={label}>
              <p className="text-xs text-surface-400 font-semibold tracking-wide mb-1">{label}</p>
              <p className={`text-sm text-surface-700 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[
            { label: 'رقم العميل', value: client.client_number },
            { label: 'اسم الوسيط', value: client.median_name },
            { label: 'رقم الوسيط', value: client.median_mobile },
            { label: 'المدفوع المتفق عليه', value: client.agreed_payment },
            { label: 'الرقم القومي', value: client.id_number },
            { label: 'رقم ضريبي إضافي', value: client.tax_number },
            { label: 'رقم السجل التجاري', value: client.commercial_reg_number },
            { label: 'مجال النشاط', value: client.activity_field },
            { label: 'مكتب السجل التجاري', value: client.commercial_reg_office },
            { label: 'تجديد السجل التجاري', value: client.commercial_reg_renewal_date && fmtDate(client.commercial_reg_renewal_date) },
            { label: 'مكتب الضرائب', value: client.tax_office },
            { label: 'مكتب ضريبة القيمة المضافة', value: client.vat_tax_office },
            { label: 'فاتورة إلكترونية', value: client.ebill },
            { label: 'قيمة رأس المال', value: client.capital_amount },
            { label: 'تاريخ بدء العمل', value: client.work_start_date && fmtDate(client.work_start_date) },
            { label: 'تاريخ انتهاء العمل', value: client.work_end_date && fmtDate(client.work_end_date) },
            { label: 'آخر فحص ضريبي', value: client.last_tax_examine_date && fmtDate(client.last_tax_examine_date) },
            { label: 'تاريخ بدء القيمة المضافة', value: client.vat_start_date && fmtDate(client.vat_start_date) },
            { label: 'آخر فحص قيمة مضافة', value: client.last_vat_examine_date && fmtDate(client.last_vat_examine_date) },
            { label: 'اشتراك المنصة', value: client.platform_subscription },
            { label: 'تجديد اشتراك المنصة', value: client.platform_renewal_date && fmtDate(client.platform_renewal_date) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-surface-400 font-semibold tracking-wide mb-1">{label}</p>
              <p className="text-sm text-surface-700">{value || '—'}</p>
            </div>
          ))}
        </div>

        {client.notes && (
          <div className="mt-4 pt-4 border-t border-surface-100">
            <p className="text-xs text-surface-400 font-semibold tracking-wide mb-1">ملاحظات</p>
            <p className="text-sm text-surface-600 whitespace-pre-line">{client.notes}</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h2 className="font-semibold">أحدث المهام ({client.recent_tasks?.length ?? 0})</h2>
          <Link to={`/tasks?client_id=${client.id}`} className="text-xs text-brand-600 hover:underline">
            عرض الكل
          </Link>
        </div>
        <div className="divide-y divide-surface-50">
          {!client.recent_tasks?.length ? (
            <p className="text-center text-sm text-surface-400 py-8">لا توجد مهام لهذا العميل.</p>
          ) : (
            client.recent_tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                <PriorityBadge priority={t.priority} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{t.title}</p>
                  <p className="text-xs text-surface-400">{t.assigned_to_name || 'غير محدد'}</p>
                </div>
                <StatusBadge status={t.status} />
                <span className="text-xs text-surface-400 w-24 text-right">{fmtDate(t.due_date)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-xs text-surface-400 px-1">
        تمت الإضافة في {fmtDate(client.created_at)} بواسطة {client.created_by_name || 'غير معروف'}
      </p>

      {/* Powers of attorney */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText size={16} /> التوكيلات
          </h2>
          <button
            className="btn-primary text-xs px-3 py-1"
            onClick={() => setPoaModal(true)}
          >
            <Plus size={14} /> إضافة توكيل
          </button>
        </div>
        <div className="divide-y divide-surface-50">
          {!client.powers_of_attorney?.length ? (
            <p className="text-center text-sm text-surface-400 py-6">لا توجد توكيلات مسجلة لهذا العميل.</p>
          ) : (
            client.powers_of_attorney.map((p) => (
              <div key={p.id} className="flex items-start gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800">{p.title}</p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    رقم التوكيل: {p.document_number || '—'}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    تاريخ الإصدار: {p.issue_date && fmtDate(p.issue_date)} | تاريخ الانتهاء: {p.expiry_date && fmtDate(p.expiry_date)}
                  </p>
                  {p.notes && (
                    <p className="text-xs text-surface-500 mt-0.5 whitespace-pre-line">
                      {p.notes}
                    </p>
                  )}
                </div>
                <button
                  className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => deletePoaMutation.mutate(p.id)}
                  title="حذف التوكيل"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        open={poaModal}
        onClose={() => setPoaModal(false)}
        title="إضافة توكيل"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createPoaMutation.mutate(poaForm)
          }}
          className="space-y-4"
        >
          <div>
            <label className="label">عنوان التوكيل *</label>
            <input
              className="input"
              required
              value={poaForm.title}
              onChange={(e) => setPoaForm({ ...poaForm, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label">رقم التوكيل</label>
            <input
              className="input"
              value={poaForm.document_number}
              onChange={(e) => setPoaForm({ ...poaForm, document_number: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">تاريخ الإصدار</label>
              <input
                type="date"
                className="input"
                value={poaForm.issue_date}
                onChange={(e) => setPoaForm({ ...poaForm, issue_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">تاريخ الانتهاء</label>
              <input
                type="date"
                className="input"
                value={poaForm.expiry_date}
                onChange={(e) => setPoaForm({ ...poaForm, expiry_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">ملاحظات</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={poaForm.notes}
              onChange={(e) => setPoaForm({ ...poaForm, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPoaModal(false)}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createPoaMutation.isPending}
            >
              حفظ التوكيل
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
