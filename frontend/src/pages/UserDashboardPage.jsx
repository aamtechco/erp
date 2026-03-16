import useAuthStore from '../lib/authStore'

export default function UserDashboardPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="animate-page space-y-4">
      <div className="page-header">
        <h1 className="page-title">لوحة تحكم المستخدم</h1>
      </div>

      <div className="card p-5">
        <p className="text-sm text-surface-600">
          تم تسجيل الدخول كمستخدم برقم السجل:{' '}
          <span className="font-medium text-surface-900">{user?.registerNumber || '—'}</span>
        </p>
        <p className="text-sm text-surface-500 mt-2">
          هذه لوحة تحكم تجريبية، يمكن لاحقًا التحقق من الصلاحيات وتحميل بيانات المستخدم.
        </p>
      </div>
    </div>
  )
}

