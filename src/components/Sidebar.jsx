import React from 'react'
import { useStore } from '../store'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Briefcase, 
  Coins, 
  CreditCard, 
  Car, 
  BarChart3, 
  Settings, 
  Camera, 
  Scale,
  LogOut
} from 'lucide-react'

export default function Sidebar({ currentView, setCurrentView }) {
  const { logout } = useStore()
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, color: '#3b82f6' },
    { id: 'projects', label: 'Projets', icon: <Briefcase size={20} />, color: '#6366f1' },
    { id: 'time', label: 'Suivi du temps', icon: <BarChart3 size={20} />, color: '#10b981' },
    { id: 'history', label: 'Historique', icon: <BarChart3 size={20} />, color: '#0ea5e9' },
    { id: 'settings', label: 'Paramètres', icon: <Settings size={20} />, color: '#9ca3af' },
  ]

  return (
    <aside className="no-print" style={{
      width: '240px',
      backgroundColor: 'var(--card-bg)',
      borderRight: '1px solid var(--border-color)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div>
        <div style={{ marginBottom: '40px', padding: '0 12px' }}>
          <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '18px' }}>AgencyOS</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>ESN Management</p>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map(item => (
            <button
              key={item.id}
              id={`sidebar-${item.id}`}
              onClick={() => setCurrentView(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentView === item.id ? 'var(--bg-color)' : 'transparent',
                color: currentView === item.id ? 'var(--text-main)' : 'var(--text-secondary)',
                fontWeight: currentView === item.id ? '600' : '400',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                width: '100%'
              }}
            >
              <span style={{ color: currentView === item.id ? item.color : item.color, opacity: currentView === item.id ? 1 : 0.6, transition: 'opacity 0.2s ease' }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <button
        onClick={logout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: 'transparent',
          color: 'var(--color-danger, #ef4444)',
          fontWeight: '500',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.2s ease',
          width: '100%',
          marginTop: 'auto'
        }}
      >
        <LogOut size={20} color="#ef4444" />
        Se déconnecter
      </button>
    </aside>
  )
}
