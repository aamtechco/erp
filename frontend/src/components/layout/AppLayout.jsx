import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CheckSquare, Bell,
  BarChart3, UserCog, LogOut, ChevronRight, Menu, X,
} from 'lucide-react'
import { useState } from 'react'
import useAuthStore from '../../lib/authStore'
import NotificationBell from '../ui/NotificationBell'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'لوحة التحكم', end: true },
  { to: '/clients',   icon: Users,           label: 'العملاء' },
  { to: '/tasks',     icon: CheckSquare,     label: 'المهام' },
  { to: '/reminders', icon: Bell,            label: 'التذكيرات' },
  { to: '/reports',   icon: BarChart3,       label: 'التقارير' },
]

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const Sidebar = ({ mobile }) => (
    <aside className={`
      flex flex-col h-full bg-surface-950 text-white
      ${mobile ? 'w-full' : 'w-64'}
    `}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
          AAM
        </div>
        <div>
          <div className="font-semibold text-sm leading-tight">مكتب أبوالمجد عبدالشافى</div>
          <div className="text-xs text-white/40 leading-tight">نظام ERP</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {user?.role === 'client' ? (
          <NavLink
            to="/client/tasks"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${isActive
                ? 'bg-brand-600 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/8'
              }`
            }
          >
            <CheckSquare size={16} />
            مهامي
          </NavLink>
        ) : (
          <>
            {NAV.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </>
        )}

        {/* Admin-only */}
        {['admin'].includes(user?.role) && (
          <NavLink
            to="/users"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${isActive
                ? 'bg-brand-600 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/8'
              }`
            }
          >
            <UserCog size={16} />
            المستخدمون
          </NavLink>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 pt-2 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-white/40 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/40 hover:text-white transition-colors p-1"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 flex-shrink-0">
            <Sidebar mobile />
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-surface-200 flex items-center px-4 gap-4 flex-shrink-0">
          <button
            className="md:hidden btn-ghost p-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <NotificationBell />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
