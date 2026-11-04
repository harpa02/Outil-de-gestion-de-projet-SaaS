import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store'
import { LayoutDashboard, Briefcase, Users, Kanban, LogOut, Shield } from 'lucide-react'

export default function Sidebar() {
  const { logout, company, user, pendingCount, fetchMembers } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Si admin, charger les membres pour obtenir le nombre de demandes en attente
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchMembers().catch(() => {})
    }
  }, [user?.role, fetchMembers])

  const menuItems = [
    { path: '/',         label: 'Tableau de bord', icon: <LayoutDashboard size={20} />, color: '#3b82f6' },
    { path: '/projects',  label: 'Projets',         icon: <Briefcase size={20} />,       color: '#6366f1' },
    { path: '/kanban',    label: 'Kanban',          icon: <Kanban size={20} />,          color: '#f59e0b' },
    { path: '/users',     label: 'Membres',          icon: <Users size={20} />,           color: '#10b981', badge: user?.role === 'admin' ? pendingCount : 0 },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabels = {
    admin:   { label: 'Administrateur', color: '#7c3aed', bg: '#f5f3ff' },
    manager: { label: 'Manager',        color: '#2563eb', bg: '#eff6ff' },
    member:  { label: 'Membre',         color: '#059669', bg: '#f0fdf4' },
  }

  const roleStyle = roleLabels[user?.role] || roleLabels.member

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      backgroundColor: 'var(--card-bg)',
      borderRight: '1px solid var(--border-color)',
      padding: '24px 14px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      flexShrink: 0
    }}>
      <div>
        {/* Logo & Entreprise */}
        <div style={{ marginBottom: '28px', padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
            }}>
              <Kanban size={17} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-main)' }}>
              PM SaaS
            </span>
          </div>

          {company && (
            <div style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              paddingLeft: '42px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {company.name}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: isActive ? '#ede9fe' : 'transparent',
                  color: isActive ? '#6366f1' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '14px',
                  width: '100%',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <span style={{ color: isActive ? item.color : 'var(--text-secondary)', opacity: isActive ? 1 : 0.7 }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>

                {/* Badge notification pour les demandes en attente */}
                {Boolean(item.badge && item.badge > 0) && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '99px',
                    padding: '2px 6px',
                    lineHeight: 1
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Profil utilisateur & Déconnexion */}
      <div>
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            marginBottom: '8px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-color)',
            border: '1px solid var(--border-color)'
          }}>
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.firstName || 'User')}`}
              alt={user.firstName || 'User'}
              style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0 }}
            />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{
                fontSize: '10px',
                fontWeight: 600,
                color: roleStyle.color,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <Shield size={10} />
                {roleStyle.label}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#ef4444',
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
            fontSize: '14px',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <LogOut size={17} color="#ef4444" />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
