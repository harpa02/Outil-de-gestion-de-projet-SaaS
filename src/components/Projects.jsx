import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Briefcase, Plus, Trash2, Pencil, X, Loader2, Users } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'planning',    label: 'Planification' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed',   label: 'Terminé' },
  { value: 'archived',    label: 'Archivé' },
]

const STATUS_STYLES = {
  planning:    { bg: '#ede9fe', color: '#6d28d9' },
  in_progress: { bg: '#fef9c3', color: '#a16207' },
  completed:   { bg: '#dcfce7', color: '#15803d' },
  archived:    { bg: '#f3f4f6', color: '#6b7280' },
}

function ProjectModal({ project, users, companyId, onClose, onSave }) {
  const { createProject, updateProject } = useStore()
  const [name, setName]           = useState(project?.name || '')
  const [description, setDesc]    = useState(project?.description || '')
  const [status, setStatus]       = useState(project?.status || 'planning')
  const [memberIds, setMemberIds] = useState((project?.memberIds || []).map(id => id.toString?.() || id))
  const [loading, setLoading]     = useState(false)
  const [err, setErr]             = useState('')

  const toggleMember = (id) => {
    setMemberIds(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const payload = { name, description, status, memberIds }
      const saved = project
        ? await updateProject(project._id, payload, companyId)
        : await createProject(payload, companyId)
      onSave(saved)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>{project ? 'Modifier le projet' : 'Nouveau projet'}</h3>
          <button onClick={onClose} style={iconBtnStyle}><X size={18} /></button>
        </div>
        {err && <div style={errStyle}>{err}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Nom du projet *</label>
            <input required value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="ex: Refonte site web" />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Objectifs du projet..." />
          </div>
          <div>
            <label style={labelStyle}>Statut</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}><Users size={13} style={{ display: 'inline', marginRight: '4px' }} /> Membres du projet</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {users.map(u => {
                const sel = memberIds.includes(u._id)
                return (
                  <label key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '99px', border: `1px solid ${sel ? '#6366f1' : 'var(--border-color)'}`, backgroundColor: sel ? '#ede9fe' : 'transparent', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={sel} onChange={() => toggleMember(u._id)} style={{ display: 'none' }} />
                    <img src={u.avatar} alt={u.name} style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                    {u.name}
                  </label>
                )
              })}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : (project ? 'Enregistrer' : 'Créer le projet')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Projects() {
  const { currentCompany, projects, users, fetchProjects, fetchUsers, deleteProject } = useStore()
  const [modalProject, setModalProject] = useState(null) // null = fermé, {} = nouveau, projet = édition
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentCompany) return
    Promise.all([
      fetchProjects(currentCompany._id),
      fetchUsers(currentCompany._id)
    ]).finally(() => setLoading(false))
  }, [currentCompany])

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce projet et toutes ses tâches ?')) return
    await deleteProject(id, currentCompany._id)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 size={28} className="animate-spin" color="#6366f1" /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Briefcase size={26} color="#6366f1" /> Projets
        </h1>
        <button className="btn btn-primary" onClick={() => setModalProject({})} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Nouveau projet
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <Briefcase size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>Aucun projet</h3>
          <p>Créez votre premier projet pour commencer.</p>
          <button className="btn btn-primary" onClick={() => setModalProject({})} style={{ marginTop: '16px' }}>
            <Plus size={16} style={{ display: 'inline', marginRight: '6px' }} /> Créer un projet
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {projects.map(proj => {
            const st = STATUS_STYLES[proj.status] || STATUS_STYLES.planning
            const progress = proj.progress ?? 0
            return (
              <div key={proj._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* En-tête */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', flex: 1, paddingRight: '8px' }}>{proj.name}</h3>
                  <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '99px', backgroundColor: st.bg, color: st.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {STATUS_OPTIONS.find(o => o.value === proj.status)?.label || proj.status}
                  </span>
                </div>

                {proj.description && (
                  <p style={{ fontSize: '13px', margin: 0 }}>{proj.description}</p>
                )}

                {/* Progression */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Progression</span>
                    <span style={{ fontWeight: 600 }}>{proj.completedTasks ?? 0}/{proj.totalTasks ?? 0} tâches</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#6366f1', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {/* Membres */}
                {proj.members && proj.members.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '-4px' }}>
                    {proj.members.slice(0, 5).map((m, i) => (
                      <img key={m._id} src={m.avatar} alt={m.name} title={m.name}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--card-bg)', marginLeft: i > 0 ? '-8px' : 0 }} />
                    ))}
                    {proj.members.length > 5 && (
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>+{proj.members.length - 5}</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <button onClick={() => setModalProject(proj)} className="btn btn-secondary" style={{ flex: 1, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Pencil size={14} /> Modifier
                  </button>
                  <button onClick={() => handleDelete(proj._id)} className="btn btn-secondary" style={{ color: '#ef4444', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalProject !== null && (
        <ProjectModal
          project={Object.keys(modalProject).length ? modalProject : null}
          users={users}
          companyId={currentCompany._id}
          onClose={() => setModalProject(null)}
          onSave={() => setModalProject(null)}
        />
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }
const errStyle   = { padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px', marginBottom: '14px' }
const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }
const modalStyle   = { backgroundColor: 'var(--card-bg)', borderRadius: '14px', padding: '28px', width: '100%', border: '1px solid var(--border-color)', maxHeight: '90vh', overflowY: 'auto' }
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '4px' }
