import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Users, Plus, Trash2, Pencil, X, Loader2, Shield } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'admin',   label: 'Admin',    color: '#7c3aed' },
  { value: 'manager', label: 'Manager',  color: '#2563eb' },
  { value: 'member',  label: 'Membre',   color: '#059669' },
]

function UserModal({ user, companyId, onClose, onSave }) {
  const { createUser, updateUser } = useStore()
  const [name,  setName]  = useState(user?.name  || '')
  const [email, setEmail] = useState(user?.email || '')
  const [role,  setRole]  = useState(user?.role  || 'member')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const payload = { name, email, role }
      const saved = user
        ? await updateUser(user._id, payload, companyId)
        : await createUser(payload, companyId)
      onSave(saved)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: '420px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>{user ? 'Modifier le membre' : 'Ajouter un membre'}</h3>
          <button onClick={onClose} style={iconBtnStyle}><X size={18} /></button>
        </div>
        {err && <div style={errStyle}>{err}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Nom complet *</label>
            <input required value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="ex: Jean Dupont" />
          </div>
          <div>
            <label style={labelStyle}>Adresse email *</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="jean@entreprise.com" />
          </div>
          <div>
            <label style={labelStyle}>Rôle</label>
            <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '4px' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : (user ? 'Enregistrer' : 'Ajouter le membre')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function UsersView() {
  const { currentCompany, users, fetchUsers, deleteUser } = useStore()
  const [modalUser, setModalUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentCompany) return
    fetchUsers(currentCompany._id).finally(() => setLoading(false))
  }, [currentCompany])

  const handleDelete = async (user) => {
    if (!confirm(`Supprimer ${user.name} de l'entreprise ?`)) return
    await deleteUser(user._id, currentCompany._id)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 size={28} className="animate-spin" color="#10b981" /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Users size={26} color="#10b981" /> Membres
        </h1>
        <button className="btn btn-primary" onClick={() => setModalUser({})} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Ajouter un membre
        </button>
      </div>

      {users.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <Users size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>Aucun membre</h3>
          <p>Ajoutez des membres à votre entreprise.</p>
          <button className="btn btn-primary" onClick={() => setModalUser({})} style={{ marginTop: '16px' }}>
            <Plus size={16} style={{ display: 'inline', marginRight: '6px' }} /> Ajouter un membre
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {users.map(user => {
            const roleInfo = ROLE_OPTIONS.find(r => r.value === user.role) || ROLE_OPTIONS[2]
            return (
              <div key={user._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px' }}>
                <img src={user.avatar} alt={user.name} style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '2px' }}>{user.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', backgroundColor: roleInfo.color + '20', color: roleInfo.color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={10} /> {roleInfo.label}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => setModalUser(user)} style={{ ...actionBtnStyle, color: '#6366f1' }} title="Modifier"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(user)} style={{ ...actionBtnStyle, color: '#ef4444' }} title="Supprimer"><Trash2 size={15} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalUser !== null && (
        <UserModal
          user={Object.keys(modalUser).length ? modalUser : null}
          companyId={currentCompany._id}
          onClose={() => setModalUser(null)}
          onSave={() => setModalUser(null)}
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
const modalStyle   = { backgroundColor: 'var(--card-bg)', borderRadius: '14px', padding: '28px', width: '100%', border: '1px solid var(--border-color)' }
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '4px' }
const actionBtnStyle = { background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
