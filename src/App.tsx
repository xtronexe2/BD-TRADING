import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import AdminLoginPage from './pages/auth/AdminLoginPage'
import WingoPage from './pages/games/WingoPage'
import K3Page from './pages/games/K3Page'
import FiveDPage from './pages/games/FiveDPage'
import TrxWinPage from './pages/games/TrxWinPage'
import WalletPage from './pages/WalletPage'
import ReferralPage from './pages/ReferralPage'
import TradingPage from './pages/TradingPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import ActivityPage from './pages/ActivityPage'
import NotFoundPage from './pages/NotFoundPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-neon-purple border-t-transparent animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
    </div>
  )
  if (!profile?.is_admin) return <Navigate to="/admin-login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="games/wingo" element={<ProtectedRoute><WingoPage /></ProtectedRoute>} />
        <Route path="games/k3" element={<ProtectedRoute><K3Page /></ProtectedRoute>} />
        <Route path="games/5d" element={<ProtectedRoute><FiveDPage /></ProtectedRoute>} />
        <Route path="games/trx" element={<ProtectedRoute><TrxWinPage /></ProtectedRoute>} />
        <Route path="wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="referral" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
        <Route path="trading" element={<ProtectedRoute><TradingPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
        <Route path="admin" element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          </ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
