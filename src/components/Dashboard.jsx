import React from 'react'
import { useStore } from '../store'
import { Briefcase, CheckCircle2, Clock, Users, LayoutDashboard, Plus } from 'lucide-react'

export default function Dashboard() {
  const { data } = useStore()

  const projects = data.projects || []
  const users = data.users || []
  
  // Collect all tasks across projects
  const allTasks = projects.flatMap(p => p.tasks || [])
  const completedTasks = allTasks.filter(t => t.status === 'done' || t.status === 'completed')
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress')
  const todoTasks = allTasks.filter(t => !t.status || t.status === 'todo')

  const totalEstimatedHours = allTasks.reduce((acc, t) => acc + (t.estHours || 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <LayoutDashboard size={26} color="#3b82f6" /> Vue d'ensemble SaaS
        </h1>
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Entreprise active : <strong>{data.settings?.companyName || 'Mon Entreprise'}</strong>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Projets Actifs</p>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={22} /> {projects.length}
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>Projets de l'entreprise</p>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Tâches en cours</p>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={22} /> {inProgressTasks.length}
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>Sur {allTasks.length} tâches totales</p>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Tâches terminées</p>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-success, #10b981)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={22} /> {completedTasks.length}
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>Taux de complétion: {allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0}%</p>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Membres d'équipe</p>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={22} /> {users.length}
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>Utilisateurs rattachés</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Projets récents</h3>
          {projects.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Aucun projet pour le moment.</p>
          ) : (
            projects.slice(0, 5).map(proj => (
              <div key={proj.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{proj.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {(proj.tasks || []).length} tâche(s)
                  </div>
                </div>
                <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: '#e0e7ff', color: '#4338ca' }}>
                  {proj.status || 'Actif'}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Membres assignés</h3>
          {users.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Aucun membre enregistré.</p>
          ) : (
            users.map(u => (
              <div key={u.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.role || 'Collaborateur'}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
