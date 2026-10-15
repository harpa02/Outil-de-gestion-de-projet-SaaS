import React, { useState } from 'react'
import { useStore } from '../store'
import { Briefcase, Plus, CheckCircle, Clock } from 'lucide-react'

export default function Projects() {
  const { data } = useStore()
  const projects = data.projects || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Briefcase size={26} color="#6366f1" /> Projets
        </h1>
      </div>
      
      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Briefcase size={40} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
          <h3>Aucun projet trouvé</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Les projets de votre entreprise apparaîtront ici.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {projects.map(project => {
            const tasks = project.tasks || []
            const completedCount = tasks.filter(t => t.status === 'done' || t.status === 'completed').length

            return (
              <div key={project.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0 }}>{project.name}</h3>
                  <span style={{ 
                    fontSize: '12px', 
                    padding: '3px 8px', 
                    borderRadius: '4px', 
                    backgroundColor: project.status === 'completed' ? '#dcfce7' : '#e0e7ff',
                    color: project.status === 'completed' ? '#15803d' : '#4338ca',
                    fontWeight: 500
                  }}>
                    {project.status === 'completed' ? 'Terminé' : 'En cours'}
                  </span>
                </div>
                
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  {project.description || 'Projet de gestion SaaS'}
                </p>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span>Progression</span>
                    <strong>{completedCount} / {tasks.length} tâches</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: tasks.length > 0 ? `${(completedCount / tasks.length) * 100}%` : '0%', 
                      height: '100%', 
                      backgroundColor: 'var(--color-primary, #6366f1)',
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
