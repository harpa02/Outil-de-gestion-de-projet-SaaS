import React, { useEffect } from 'react'
import { useStore } from '../store'
import { LayoutDashboard, Briefcase, CheckCircle2, Clock, Users, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const { company, user, projects, users, tasks, fetchProjects, fetchUsers, fetchTasks } = useStore()

  useEffect(() => {
    fetchProjects().catch(() => {})
    fetchUsers().catch(() => {})
    fetchTasks().catch(() => {})
  }, [fetchProjects, fetchUsers, fetchTasks])

  const totalTasks     = tasks.length
  const doneTasks      = tasks.filter(t => t.status === 'done').length
  const inProgTasks    = tasks.filter(t => t.status === 'in_progress').length
  const reviewTasks    = tasks.filter(t => t.status === 'review').length
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const urgentTasks = tasks
    .filter(t => t.priority === 'urgent' && t.status !== 'done')
    .slice(0, 5)

  const recentProjects = [...projects].slice(0, 5)

  const activeMembers = users.filter(u => u.status !== 'pending_approval')

  const statCards = [
    { label: 'Projets actifs',    value: projects.filter(p => p.status === 'in_progress').length, icon: <Briefcase size={22} />, color: '#6366f1' },
    { label: 'Tâches en cours',   value: inProgTasks,  icon: <Clock size={22} />,          color: '#f59e0b' },
    { label: 'Tâches en revue',   value: reviewTasks,  icon: <TrendingUp size={22} />,     color: '#3b82f6' },
    { label: 'Tâches terminées',  value: doneTasks,    icon: <CheckCircle2 size={22} />,   color: '#10b981' },
    { label: 'Membres de l\'équipe', value: activeMembers.length, icon: <Users size={22} />, color: '#8b5cf6' },
  ]

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.name || user?.email || 'Utilisateur'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 4px' }}>
            <LayoutDashboard size={26} color="#3b82f6" /> Tableau de bord
          </h1>
          <p style={{ margin: 0 }}>
            Bienvenue, <strong>{displayName}</strong> — {company?.name || 'Mon entreprise'}
          </p>
        </div>
        {totalTasks > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>{completionRate}%</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>tâches complétées</div>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {statCards.map(card => (
          <div key={card.label} className="card" style={{ padding: '16px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-secondary)' }}>{card.label}</p>
            <div style={{ fontSize: '28px', fontWeight: 700, color: card.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {card.icon} {card.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Projets récents */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={17} color="#6366f1" /> Projets récents
          </h3>
          {recentProjects.length === 0 ? (
            <p>Aucun projet pour le moment.</p>
          ) : (
            recentProjects.map(proj => {
              const progress = proj.progress ?? (proj.totalTasks > 0 ? Math.round((proj.completedTasks / proj.totalTasks) * 100) : 0)
              return (
                <div key={proj._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{proj.name}</div>
                    <StatusBadge status={proj.status} />
                  </div>
                  <div style={{ width: '100%', height: '5px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#6366f1', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {progress}% · {proj.completedTasks || 0}/{proj.totalTasks || 0} tâches
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Tâches urgentes */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚨 Tâches urgentes
          </h3>
          {urgentTasks.length === 0 ? (
            <p>Aucune tâche urgente 🎉</p>
          ) : (
            urgentTasks.map(task => {
              const assignedName = task.assignedUser
                ? (task.assignedUser.firstName ? `${task.assignedUser.firstName} ${task.assignedUser.lastName}` : task.assignedUser.name)
                : null

              return (
                <div key={task._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{task.title}</div>
                    {assignedName && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>→ {assignedName}</div>
                    )}
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    todo:        { label: 'À faire',     bg: '#f3f4f6', color: '#6b7280' },
    in_progress: { label: 'En cours',    bg: '#fef9c3', color: '#a16207' },
    review:      { label: 'En revue',    bg: '#dbeafe', color: '#1d4ed8' },
    done:        { label: 'Terminé',     bg: '#dcfce7', color: '#15803d' },
    planning:    { label: 'Planification', bg: '#ede9fe', color: '#6d28d9' },
    completed:   { label: 'Terminé',    bg: '#dcfce7', color: '#15803d' },
    archived:    { label: 'Archivé',    bg: '#f3f4f6', color: '#6b7280' },
  }
  const s = map[status] || { label: status, bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', backgroundColor: s.bg, color: s.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}
