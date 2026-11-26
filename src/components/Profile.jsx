import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { UserRound, Mail, Phone, Building2, Save, Send, X, Loader2, AlertCircle, CheckCircle2, Clock, Trash2 } from 'lucide-react'
import { ROLES, roleInfo } from '../roleUtils'

export default function Profile() {
  const { user, company, departments, fetchDepartments, updateUser, requestDepartmentChange, deleteUser, logout } = useStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [requestId, setRequestId] = useState('')
  const [saving, setSaving] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchDepartments().catch(() => {})
  }, [fetchDepartments])

  useEffect(() => {
    if (!user) return
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
    })
  }, [user])

  if (!user) return null

  const department = departments.find(d => String(d._id) === String(user.departmentId))
  const managedDepartment = departments.find(d => String(d._id) === String(user.managedDepartmentId))
  const pendingRequest = user.departmentChangeRequest
  const role = roleInfo(user.role)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateUser(user._id, form)
      setSuccess('Profil mis à jour.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRequest = async () => {
    if (!requestId) {
      setError('Sélectionnez un service.')
      return
    }
    setRequesting(true)
    setError('')
    setSuccess('')
    try {
      await requestDepartmentChange(requestId)
      setRequestId('')
      setSuccess('Demande envoyée à votre supérieur hiérarchique.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setRequesting(false)
    }
  }

  const handleCancelRequest = async () => {
    setRequesting(true)
    setError('')
    try {
      await requestDepartmentChange(null)
      setSuccess('Demande annulée.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setRequesting(false)
    }
  }

  const handleDeleteSelf = async () => {
    if (!confirm('Supprimer votre compte ? Cette action est irréversible.')) return
    setDeleting(true)
    setError('')
    try {
      await deleteUser(user._id)
      logout()
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 4px' }}>
          <UserRound size={26} color="var(--accent)" /> Mon profil
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          {company?.name} · <span style={{ color: role.color, fontWeight: 600 }}>{role.label}</span>
        </p>
      </div>

      {error && <div style={messageStyle('#fef2f2', '#fecaca', '#b91c1c')}><AlertCircle size={16} /> {error}</div>}
      {success && <div style={messageStyle('#f0fdf4', '#bbf7d0', '#15803d')}><CheckCircle2 size={16} /> {success}</div>}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Informations personnelles</h3>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Prénom</label>
              <input required style={inputStyle} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Nom de famille</label>
              <input required style={inputStyle} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={labelStyle}><Mail size={13} style={{ display: 'inline', marginRight: 5 }} /> Adresse e-mail</label>
            <input type="email" required style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}><Phone size={13} style={{ display: 'inline', marginRight: 5 }} /> Numéro de téléphone</label>
            <input type="tel" style={inputStyle} placeholder="06 00 00 00 00" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Enregistrer
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={18} /> Service
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-color)', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Votre service actuel</div>
            <div style={{ fontWeight: 600 }}>{department?.name || 'Non renseigné'}</div>
          </div>
          {managedDepartment && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Service managé</div>
              <div style={{ fontWeight: 600, color: '#1d4ed8' }}>{managedDepartment.name}</div>
            </div>
          )}
        </div>

        {user.role === ROLES.CEO ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Le CEO appartient au service « CEO » ; ce service est géré automatiquement.
          </p>
        ) : pendingRequest ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e', fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={15} /> Demande en attente : {pendingRequest.departmentName || departments.find(d => String(d._id) === String(pendingRequest.departmentId))?.name || 'service'}
            </span>
            <button type="button" className="btn btn-secondary" onClick={handleCancelRequest} disabled={requesting} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <X size={14} /> Annuler
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <select style={{ ...inputStyle, maxWidth: '280px' }} value={requestId} onChange={e => setRequestId(e.target.value)}>
              <option value="">Choisir un service...</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
            <button type="button" className="btn btn-primary" onClick={handleRequest} disabled={requesting || !requestId} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {requesting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Demander un changement
            </button>
          </div>
        )}
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '12px 0 0' }}>
          Votre supérieur hiérarchique (Manager ou CEO) doit valider le changement de service.
        </p>
      </div>

      <div className="card" style={{ marginTop: '20px', borderColor: '#fecaca' }}>
        <h3 style={{ marginTop: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8, color: '#b91c1c' }}>
          <Trash2 size={18} /> Supprimer mon compte
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13 }}>
          Cette action est irréversible : votre compte et vos affectations seront supprimés définitivement.
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleDeleteSelf}
          disabled={deleting}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderColor: '#fecaca', color: '#b91c1c', fontWeight: 600 }}
        >
          {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Supprimer mon compte
        </button>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' }
const messageStyle = (bg, border, color) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: bg, border: `1px solid ${border}`, borderRadius: 8, color, fontSize: 13, marginBottom: 16 })
