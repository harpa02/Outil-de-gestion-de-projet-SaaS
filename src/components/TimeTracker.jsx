import React, { useState } from 'react'
import { useStore } from '../store'

export default function TimeTracker() {
  const { data, addTimeEntry } = useStore()
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedTask, setSelectedTask] = useState('')
  const [hours, setHours] = useState('')

  const activeProjects = data.projects.filter(p => {
    if (p.status !== 'in_progress') return false
    const quote = data.quotes.find(q => q.id === p.quoteId)
    return quote && quote.status === 'accepted'
  })
  const currentProject = activeProjects.find(p => p.id === selectedProject)

  const handleSave = (e) => {
    e.preventDefault()
    if (!selectedProject || !selectedTask || !hours) return
    
    // In a real app, user would be derived from auth
    const user = data.users[0] 

    addTimeEntry({
      projectId: selectedProject,
      taskId: selectedTask,
      userId: user.id,
      duration: Number(hours),
      costRate: user.costRate,
      date: new Date().toISOString().split('T')[0]
    })

    setHours('')
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Saisie des Temps</h1>

      <div className="card" style={{ maxWidth: '600px', marginBottom: '32px' }}>
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Projet</label>
            <select 
              value={selectedProject} 
              onChange={e => {
                setSelectedProject(e.target.value)
                setSelectedTask('') // reset task when project changes
              }}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
              required
            >
              <option value="">Sélectionner un projet...</option>
              {activeProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Tâche</label>
            <select 
              value={selectedTask} 
              onChange={e => setSelectedTask(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
              required
              disabled={!selectedProject}
            >
              <option value="">Sélectionner une tâche...</option>
              {currentProject?.tasks.map(t => (
                <option key={t.id} value={t.id}>{t.name} (Budget: {t.estHours}h)</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Heures passées</label>
            <input 
              type="number" 
              step="0.5"
              min="0.5"
              value={hours}
              onChange={e => setHours(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
              placeholder="ex: 2.5"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Enregistrer le temps
          </button>
        </form>
      </div>

      <h2>Historique récent</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', fontWeight: 500 }}>Date</th>
              <th style={{ padding: '16px', fontWeight: 500 }}>Projet</th>
              <th style={{ padding: '16px', fontWeight: 500 }}>Tâche</th>
              <th style={{ padding: '16px', fontWeight: 500 }}>Temps</th>
            </tr>
          </thead>
          <tbody>
            {[...data.timeEntries].reverse().slice(0, 10).map(entry => {
              const proj = data.projects.find(p => p.id === entry.projectId)
              const task = proj?.tasks.find(t => t.id === entry.taskId)
              
              return (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{entry.date}</td>
                  <td style={{ padding: '16px' }}>{proj?.name}</td>
                  <td style={{ padding: '16px' }}>{task?.name}</td>
                  <td style={{ padding: '16px', fontWeight: 500 }}>{entry.duration}h</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
