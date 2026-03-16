import useAuthStore from '../lib/authStore'

export default function UserDashboardPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="animate-page space-y-4">
      <div className="page-header">
        <h1 className="page-title">User Dashboard</h1>
      </div>

      <div className="card p-5">
        <p className="text-sm text-surface-600">
          Signed in as user: <span className="font-medium text-surface-900">{user?.registerNumber || '—'}</span>
        </p>
        <p className="text-sm text-surface-500 mt-2">
          This is a placeholder dashboard. Next, we can validate credentials and fetch user permissions.
        </p>
      </div>
    </div>
  )
}

