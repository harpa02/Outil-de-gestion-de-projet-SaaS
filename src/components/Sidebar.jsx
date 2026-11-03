import React, { useEffect } from 'react'
import { useStore } from '../store'
import { LayoutDashboard, Briefcase, Users, Kanban, Building2, LogOut } from 'lucide-react'

export default function Sidebar({ currentView, setCurrentView }) {
  const { logout, currentCompany, currentUser } = useStore()

  const menuItems = [
    { id: 'dashboard',  label: 'Tableau de bord', icon: <LayoutDashboard size={20} />, color: '#3b82f6' },
    { id: 'projects',   label: 'Projets',          icon: <Briefcase size={20} />,       color: '#6366f1' },
    { id: 'kanban',     label: 'Kanban',            icon: <Kanban size={20} />,          color: '#f59e0b' },
    { id: 'users',      label: 'Membres',           icon: <Users size={20} />,           color: '#10b981' },
    { id: 'companies',  label: 'Entreprises',       icon: <Building2 size={20} />,       color: '#8b5cf6' },
  ]

  return (
    <aside style={{
      width: '240px', minHeight: '100vh',
      backgroundColor: 'var(--card-bg)',
      borderRight: '1px solid var(--border-color)',
      padding: '24px 14px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      flexShrink: 0
    }}>
      <div>
        {/* Logo */}
        <div style={{ marginBottom: '32px', padding: '0 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Kanban size={17} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-main)' }}>PM SaaS</span>
          </div>
          {currentCompany && (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '42px' }}>
              {currentCompany.name}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map(item => {
            const active = currentView === item.id
            return (
              <button key={item.id} onClick={() => setCurrentView(item.id)} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
                backgroundColor: active ? '#ede9fe' : 'transparent',
                color: active ? '#6366f1' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 400, fontSize: '14px',
                width: '100%', transition: 'all 0.15s ease'
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <span style={{ color: active ? item.color : 'var(--text-secondary)', opacity: active ? 1 : 0.7 }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Profil + Déconnexion */}
      <div>
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', marginBottom: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-color)' }}>
            <img src={currentUser.avatar} alt={currentUser.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{currentUser.role}</div>
            </div>
          </div>
        )}
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
          borderRadius: '8px', border: 'none', backgroundColor: 'transparent',
          color: '#ef4444', fontWeight: 500, cursor: 'pointer', width: '100%', fontSize: '14px'
        }}>
          <LogOut size={18} color="#ef4444" /> Se déconnecter
        </button>
      </div>
    </aside>
  )
}
