import useAuthStore from '../lib/authStore'

export default function ClientDashboardPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="animate-page space-y-4">
      <div className="page-header">
        <h1 className="page-title">لوحة تحكم العميل</h1>
      </div>

      <div className="card p-5">
        <p className="text-sm text-surface-600">
          تم تسجيل الدخول كعميل برقم السجل:{' '}
          <span className="font-medium text-surface-900">{user?.registerNumber || '—'}</span>
        </p>
        <p className="text-sm text-surface-500 mt-2">
          هذه لوحة تحكم تجريبية، يمكن لاحقًا عرض بيانات العميل اعتمادًا على رقم السجل.
        </p>
      </div>
    </div>
  )
}

