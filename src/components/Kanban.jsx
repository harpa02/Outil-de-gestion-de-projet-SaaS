import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Kanban, Plus, X, Loader2, Pencil, Trash2, Calendar, Flag } from 'lucide-react'

const COLUMNS = [
  { id: 'todo',        label: 'À faire',     color: '#6b7280', bg: '#f9fafb' },
  { id: 'in_progress', label: 'En cours',    color: '#d97706', bg: '#fffbeb' },
  { id: 'review',      label: 'En revue',    color: '#2563eb', bg: '#eff6ff' },
  { id: 'done',        label: 'Terminé',     color: '#059669', bg: '#f0fdf4' },
]

const PRIORITY_STYLES = {
  low:    { label: 'Bas',     color: '#6b7280', bg: '#f3f4f6' },
  medium: { label: 'Moyen',   color: '#2563eb', bg: '#dbeafe' },
  high:   { label: 'Élevé',   color: '#d97706', bg: '#fef9c3' },
  urgent: { label: 'Urgent',  color: '#dc2626', bg: '#fee2e2' },
}

// ── Modal de création / édition d'une tâche ───────────────────────────────────
function TaskModal({ task, projects, users, companyId, defaultStatus, onClose, onSave }) {
  const { createTask, updateTask } = useStore()
  const [title,          setTitle]       = useState(task?.title       || '')
  const [description,    setDesc]        = useState(task?.description || '')
  const [projectId,      setProjectId]   = useState(task?.projectId?._id || task?.projectId?.toString() || (projects[0]?._id || ''))
  const [assignedUserId, setAssignedUser] = useState(task?.assignedUserId?._id || task?.assignedUserId?.toString() || '')
  const [status,         setStatus]      = useState(task?.status   || defaultStatus || 'todo')
  const [priority,       setPriority]    = useState(task?.priority || 'medium')
  const [dueDate,        setDueDate]     = useState(task?.dueDate ? task.dueDate.split('T')[0] : '')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const payload = {
        title, description, projectId, status, priority,
        assignedUserId: assignedUserId || null,
        dueDate: dueDate || null,
      }
      const saved = task
        ? await updateTask(task._id, payload, companyId)
        : await createTask(payload, companyId)
      onSave(saved)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</h3>
          <button onClick={onClose} style={iconBtnStyle}><X size={18} /></button>
        </div>
        {err && <div style={errStyle}>{err}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
          <div>
            <label style={labelStyle}>Titre *</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="ex: Implémenter l'authentification" />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Projet *</label>
              <select required value={projectId} onChange={e => setProjectId(e.target.value)} style={inputStyle}>
                <option value="">— Choisir —</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Assigné à</label>
              <select value={assignedUserId} onChange={e => setAssignedUser(e.target.value)} style={inputStyle}>
                <option value="">— Non assigné —</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priorité</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} style={inputStyle}>
                {Object.entries(PRIORITY_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Échéance</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '4px' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : (task ? 'Enregistrer' : 'Créer la tâche')}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Carte Kanban ──────────────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const prio = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : null
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'

  return (
    <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      {/* Titre + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ fontWeight: 600, fontSize: '14px', flex: 1, lineHeight: 1.4 }}>{task.title}</div>
        <div style={{ display: 'flex', gap: '4px', marginLeft: '8px', flexShrink: 0 }}>
          <button onClick={() => onEdit(task)} style={microBtnStyle} title="Modifier"><Pencil size={12} /></button>
          <button onClick={() => onDelete(task._id)} style={{ ...microBtnStyle, color: '#ef4444' }} title="Supprimer"><Trash2 size={12} /></button>
        </div>
      </div>

      {task.description && (
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.4 }}>
          {task.description.length > 80 ? task.description.slice(0, 80) + '…' : task.description}
        </p>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {/* Priorité */}
        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '99px', backgroundColor: prio.bg, color: prio.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Flag size={9} /> {prio.label}
        </span>

        {/* Échéance */}
        {dueDate && (
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '99px', backgroundColor: isOverdue ? '#fee2e2' : '#f3f4f6', color: isOverdue ? '#dc2626' : '#6b7280', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Calendar size={9} /> {dueDate}
          </span>
        )}

        {/* Projet */}
        {task.project && (
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '99px', backgroundColor: '#ede9fe', color: '#7c3aed', fontWeight: 500 }}>
            {task.project.name}
          </span>
        )}

        {/* Assigné */}
        {task.assignedUser && (
          <img src={task.assignedUser.avatar} alt={task.assignedUser.name} title={task.assignedUser.name}
            style={{ width: '20px', height: '20px', borderRadius: '50%', marginLeft: 'auto', border: '1px solid var(--border-color)' }} />
        )}
      </div>

      {/* Changer de statut rapidement */}
      <select
        value={task.status}
        onChange={e => onStatusChange(task._id, e.target.value)}
        style={{ marginTop: '10px', width: '100%', padding: '4px 8px', fontSize: '11px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}
      >
        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
    </div>
  )
}

// ── Vue Kanban principale ─────────────────────────────────────────────────────
export default function KanbanView() {
  const { currentCompany, tasks, projects, users, fetchTasks, fetchProjects, fetchUsers, updateTaskStatus, deleteTask } = useStore()
  const [modalTask, setModalTask] = useState(null)
  const [filterProject, setFilterProject] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentCompany) return
    const cid = currentCompany._id
    Promise.all([
      fetchTasks(cid),
      fetchProjects(cid),
      fetchUsers(cid)
    ]).finally(() => setLoading(false))
  }, [currentCompany])

  const refreshTasks = () => fetchTasks(currentCompany._id)

  const handleStatusChange = async (taskId, newStatus) => {
    await updateTaskStatus(taskId, newStatus, currentCompany._id)
  }

  const handleDelete = async (taskId) => {
    if (!confirm('Supprimer cette tâche ?')) return
    await deleteTask(taskId, currentCompany._id)
  }

  const filtered = filterProject
    ? tasks.filter(t => (t.projectId?._id || t.projectId?.toString() || t.projectId) === filterProject)
    : tasks

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 size={28} className="animate-spin" color="#f59e0b" /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Kanban size={26} color="#f59e0b" /> Tableau Kanban
        </h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '13px', cursor: 'pointer' }}>
            <option value="">Tous les projets</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setModalTask({})} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Nouvelle tâche
          </button>
        </div>
      </div>

      {/* Grille Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))', gap: '16px', overflowX: 'auto' }}>
        {COLUMNS.map(col => {
          const colTasks = filtered.filter(t => t.status === col.id)
          return (
            <div key={col.id} style={{ backgroundColor: col.bg, borderRadius: '12px', padding: '14px', border: `1px solid ${col.color}22`, minHeight: '200px' }}>
              {/* En-tête colonne */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: col.color, display: 'inline-block' }} />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: col.color }}>{col.label}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, backgroundColor: col.color + '22', color: col.color, padding: '2px 8px', borderRadius: '99px' }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Tâches */}
              {colTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: col.color, opacity: 0.5, fontSize: '13px' }}>
                  Aucune tâche
                </div>
              ) : (
                colTasks.map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={t => setModalTask(t)}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}

              {/* Bouton Ajouter rapide */}
              <button onClick={() => setModalTask({ status: col.id })}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', borderRadius: '8px', border: '1px dashed ' + col.color, background: 'transparent', color: col.color, cursor: 'pointer', width: '100%', justifyContent: 'center', fontSize: '13px', opacity: 0.7 }}>
                <Plus size={14} /> Ajouter
              </button>
            </div>
          )
        })}
      </div>

      {modalTask !== null && (
        <TaskModal
          task={Object.keys(modalTask).length > 0 && modalTask._id ? modalTask : null}
          defaultStatus={modalTask.status || 'todo'}
          projects={projects}
          users={users}
          companyId={currentCompany._id}
          onClose={() => setModalTask(null)}
          onSave={async () => { setModalTask(null); await refreshTasks() }}
        />
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }
const errStyle   = { padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px', marginBottom: '14px' }
const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }
const modalStyle   = { backgroundColor: 'var(--card-bg)', borderRadius: '14px', padding: '28px', width: '100%', border: '1px solid var(--border-color)', maxHeight: '90vh', overflowY: 'auto' }
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '4px' }
const microBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '3px', display: 'flex', alignItems: 'center', borderRadius: '4px' }
