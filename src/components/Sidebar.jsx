import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store'
import { LayoutDashboard, Briefcase, Users, Kanban, LogOut, Shield, UserRound, Receipt, Building2, IdCard } from 'lucide-react'

export default function Sidebar() {
  const { logout, company, user, pendingCount, fetchMembers } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (user?.role === 'ceo' || user?.role === 'manager') {
      fetchMembers().catch(() => {})
    }
  }, [user?.role, fetchMembers])

  const menuItems = [
    { path: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/projects', label: 'Projets', icon: Briefcase },
    { path: '/kanban', label: 'Kanban', icon: Kanban },
    { path: '/clients', label: 'Clients', icon: UserRound },
    { path: '/billing', label: 'Facturation', icon: Receipt },
    { path: '/users', label: 'Membres', icon: Users, badge: user?.role === 'ceo' ? pendingCount : 0 },
    { path: '/companies', label: 'Entreprises', icon: Building2 },
    { path: '/profile', label: 'Mon profil', icon: IdCard },
  ]

  const roleLabels = {
    ceo: { label: 'CEO', color: '#6d28d9', bg: '#f5f3ff' },
    manager: { label: 'Manager', color: '#1d4ed8', bg: '#eff6ff' },
    employee: { label: 'Salarié', color: '#047857', bg: '#ecfdf5' },
  }
  const roleStyle = roleLabels[user?.role] || roleLabels.member

  return (
    <aside style={{
      width: '248px', minHeight: '100vh', backgroundColor: 'var(--card-bg)',
      borderRight: '1px solid var(--border-color)', padding: '20px 14px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0
    }}>
      <div>
        <div style={{ padding: '4px 8px 20px', marginBottom: 8, borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={17} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>AgencyOS</span>
          </div>
          {company && <div style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 44, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company.name}</div>}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {menuItems.map(item => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <button key={item.path} onClick={() => navigate(item.path)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none',
                cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: 14,
                backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500
              }}>
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span style={{ backgroundColor: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '2px 6px', lineHeight: 1 }}>{item.badge}</span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      <div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', marginBottom: 8, borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
            <img src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.firstName || 'U')}`} alt="" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.firstName} {user.lastName}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: roleStyle.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Shield size={10} /> {roleStyle.label}</div>
            </div>
          </div>
        )}
        <button onClick={() => { logout(); navigate('/login') }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', width: '100%', fontSize: 14 }}>
          <LogOut size={17} /> Se déconnecter
        </button>
      </div>
    </aside>
  )
}
