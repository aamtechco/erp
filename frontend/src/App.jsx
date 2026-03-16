import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './lib/authStore'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ClientDashboardPage from './pages/ClientDashboardPage'
import UserDashboardPage from './pages/UserDashboardPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'
import TasksPage from './pages/TasksPage'
import RemindersPage from './pages/RemindersPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'

/** Guard: redirect to login if not authenticated */
const PrivateRoute = ({ children }) => {
  const user = useAuthStore((s) => s.user)
  return user ? children : <Navigate to="/login" replace />
}

/** Guard: redirect to dashboard if already logged in */
const PublicRoute = ({ children }) => {
  const user = useAuthStore((s) => s.user)
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Protected (inside shell layout) */}
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="clients/dashboard" element={<ClientDashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users/dashboard" element={<UserDashboardPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
