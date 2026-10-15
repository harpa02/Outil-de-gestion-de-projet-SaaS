import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Projects from './components/Projects'
import TimeTracker from './components/TimeTracker'
import Settings from './components/Settings'
import History from './components/History'
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
    switch(currentView) {
      case 'dashboard': return <Dashboard />
      case 'projects': return <Projects />
      case 'time': return <TimeTracker />
      case 'history': return <History />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <div className="app-container" style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main style={{ flex: 1, padding: '32px', backgroundColor: 'var(--bg-color)' }}>
        {renderView()}
      </main>
    </div>
  )
}

export default App
