import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import OnboardingPage from './components/auth/OnboardingPage'
import PendingApprovalPage from './components/auth/PendingApprovalPage'
import AppLayout from './components/AppLayout'
import Dashboard from './components/Dashboard'
import Projects from './components/Projects'
import KanbanView from './components/Kanban'
import UsersView from './components/Users'
import './index.css'

function App() {
  const { user, token, loading, fetchMe } = useStore()

  useEffect(() => {
    if (token && !user) {
      fetchMe().catch(() => {})
    }
  }, [token, user, fetchMe])

  // Écran de chargement lors de la restauration de session
  if (token && !user && loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-color)',
        gap: '12px'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          border: '3px solid var(--border-color)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Chargement de votre session...</span>
      </div>
    )
  }

  // Détermine la route de destination pour un utilisateur authentifié
  const getAuthenticatedRedirect = () => {
    if (!user) return '/login'
    if (!user.companyId) return '/onboarding'
    if (user.status === 'pending_approval') return '/pending'
    return '/'
  }

  return (
    <Routes>
      {/* Routes Publiques (non authentifié) */}
      <Route
        path="/login"
        element={!token ? <LoginPage /> : <Navigate to={getAuthenticatedRedirect()} replace />}
      />
      <Route
        path="/register"
        element={!token ? <RegisterPage /> : <Navigate to={getAuthenticatedRedirect()} replace />}
      />

      {/* Étape 2 de l'inscription : Onboarding Entreprise */}
      <Route
        path="/onboarding"
        element={
          !token ? (
            <Navigate to="/login" replace />
          ) : user && user.companyId && user.status === 'pending_approval' ? (
            <Navigate to="/pending" replace />
          ) : user && user.companyId ? (
            <Navigate to="/" replace />
          ) : (
            <OnboardingPage />
          )
        }
      />

      {/* Écran d'attente d'approbation pour les employés rejoignant une entreprise */}
      <Route
        path="/pending"
        element={
          !token ? (
            <Navigate to="/login" replace />
          ) : user && !user.companyId ? (
            <Navigate to="/onboarding" replace />
          ) : user && user.status === 'active' ? (
            <Navigate to="/" replace />
          ) : (
            <PendingApprovalPage />
          )
        }
      />

      {/* Application Métier Protégée (nécessite token + entreprise + statut active) */}
      <Route
        path="/"
        element={
          !token ? (
            <Navigate to="/login" replace />
          ) : !user ? (
            <div />
          ) : !user.companyId ? (
            <Navigate to="/onboarding" replace />
          ) : user.status === 'pending_approval' ? (
            <Navigate to="/pending" replace />
          ) : (
            <AppLayout />
          )
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="kanban" element={<KanbanView />} />
        <Route path="users" element={<UsersView />} />
      </Route>

      {/* Redirection par défaut */}
      <Route path="*" element={<Navigate to={token ? getAuthenticatedRedirect() : '/login'} replace />} />
    </Routes>
  )
}

export default App
