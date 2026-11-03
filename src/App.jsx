import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Projects from './components/Projects'
import KanbanView from './components/Kanban'
import UsersView from './components/Users'
import CompaniesView from './components/Companies'
import AuthPortal from './components/AuthPortal'
import { useStore } from './store'
import './index.css'

function App() {
  const { currentUser } = useStore()
  const [currentView, setCurrentView] = useState('dashboard')

  if (!currentUser) {
    return <AuthPortal />
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':  return <Dashboard />
      case 'projects':   return <Projects />
      case 'kanban':     return <KanbanView />
      case 'users':      return <UsersView />
      case 'companies':  return <CompaniesView />
      default:           return <Dashboard />
    }
  }

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', minWidth: 0 }}>
        {renderView()}
      </main>
    </div>
  )
}

export default App
