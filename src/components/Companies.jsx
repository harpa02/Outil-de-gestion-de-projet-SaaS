import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Building2, Trash2, Pencil, X, Loader2, Users, Briefcase, CheckCircle2, Plus, Percent, Layers } from 'lucide-react'
import { ROLES } from '../roleUtils'

const PLAN_OPTIONS = ['Starter', 'Pro', 'Enterprise']

function CompanyModal({ company, onClose, onSave }) {
  const { user, updateCompany } = useStore()
  const isCeo = user?.role === ROLES.CEO

  const [name, setName] = useState(company?.name || '')
  const [description, setDesc] = useState(company?.description || '')
  const [plan, setPlan] = useState(company?.plan || 'Pro')
  const [vatRate, setVatRate] = useState(company?.vatRate ?? 20)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const payload = isCeo
        ? { name, description, plan, vatRate: Number(vatRate) }
        : { description }
      const saved = await updateCompany(company._id, payload)
      onSave(saved)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlayStyle}>
      <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px' }}>Modifier l'entreprise</h2>
          <button onClick={onClose} style={iconBtnStyle}><X size={20} /></button>
        </div>
        {!isCeo && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: -12, marginBottom: 16 }}>
            En tant que Manager, vous pouvez modifier uniquement la description.
          </p>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Nom *</label>
            <input required disabled={!isCeo} value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corp" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>Offre</label>
            <select disabled={!isCeo} value={plan} onChange={e => setPlan(e.target.value)} style={inputStyle}>
              {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}><Percent size={13} style={{ display: 'inline', marginRight: 5 }} /> Taux de TVA (%) — CEO uniquement</label>
            <input type="number" min="0" step="0.1" disabled={!isCeo} value={vatRate} onChange={e => setVatRate(e.target.value)} style={inputStyle} />
          </div>
          {err && <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading && <Loader2 size={15} className="animate-spin" />} Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DepartmentsPanel() {
  const { departments, fetchDepartments, createDepartment, updateDepartment, deleteDepartment } = useStore()
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetchDepartments().catch(() => {})
  }, [fetchDepartments])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setErr('')
    try {
      await createDepartment(name.trim())
      setName('')
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return
    setLoading(true)
    setErr('')
    try {
      await updateDepartment(id, editingName.trim())
      setEditingId(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, departmentName) => {
    if (!confirm(`Supprimer le service « ${departmentName} » ? Il sera retiré des membres.`)) return
    setErr('')
    try {
      await deleteDepartment(id)
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <h3 style={{ marginTop: 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Layers size={18} color="#6366f1" /> Services / départements
      </h3>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
        Créés et modifiés par le CEO uniquement.
      </p>

      {err && <p style={{ color: '#dc2626', fontSize: 13 }}>{err}</p>}

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="ex : Marketing, Development..." style={inputStyle} />
        <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <Plus size={15} /> Ajouter
        </button>
      </form>

      {departments.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Aucun service pour le moment.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {departments.map(d => (
            <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px 6px 12px', borderRadius: 99, border: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
              {editingId === d._id ? (
                <>
                  <input autoFocus value={editingName} onChange={e => setEditingName(e.target.value)} style={{ ...inputStyle, width: '140px', padding: '4px 8px' }} />
                  <button type="button" className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={() => handleUpdate(d._id)} disabled={loading}><CheckCircle2 size={14} /></button>
                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setEditingId(null)}><X size={14} /></button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</span>
                  <button type="button" style={iconBtnStyle} title="Renommer" onClick={() => { setEditingId(d._id); setEditingName(d.name) }}><Pencil size={14} /></button>
                  <button type="button" style={{ ...iconBtnStyle, color: '#dc2626' }} title="Supprimer" onClick={() => handleDelete(d._id, d.name)}><Trash2 size={14} /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CompaniesView() {
  const { companies, company: currentCompany, user, fetchCompanies, deleteCompany } = useStore()
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = () => { setLoading(true); fetchCompanies().finally(() => setLoading(false)) }
  useEffect(load, [fetchCompanies])

  const isCeo = user?.role === ROLES.CEO
  const isManager = user?.role === ROLES.MANAGER
  const isOwnCompany = (c) => Boolean(currentCompany && currentCompany._id === c._id)
  const canEdit = (c) => isOwnCompany(c) && (isCeo || isManager)
  const canDelete = (c) => isOwnCompany(c) && isCeo && c.createdBy && String(c.createdBy) === String(user?._id)

  const handleDelete = async (id, name) => {
    if (!confirm(`Supprimer l'entreprise « ${name} » ? Toutes les données associées seront supprimées.`)) return
    setDeleting(id)
    try {
      await deleteCompany(id)
      load()
    } catch (e) {
      alert(e.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      {modal && <CompanyModal company={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 4px' }}><Building2 size={26} color="#6366f1" /> Entreprises</h1>
          <p style={{ margin: 0 }}>
            {isCeo ? 'CEO : tous les paramètres sont modifiables.' : isManager ? 'Manager : seule la description est modifiable.' : 'Consultation seule des entreprises.'}
            {' '}La création d'une entreprise se fait à l'inscription.
          </p>
        </div>
      </div>

      {isCeo && <DepartmentsPanel />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 size={28} className="animate-spin" color="#6366f1" /></div>
      ) : companies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <Building2 size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>Aucune entreprise</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {companies.map(c => {
            const isSelected = isOwnCompany(c)
            return (
              <div key={c._id} className="card" style={{ border: isSelected ? '2px solid #6366f1' : '1px solid var(--border-color)', position: 'relative' }}>
                {isSelected && <div style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#6366f1', backgroundColor: '#ede9fe', padding: '3px 8px', borderRadius: '99px' }}><CheckCircle2 size={12} /> Active</div>}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: isSelected ? '#ede9fe' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={22} color={isSelected ? '#6366f1' : '#6b7280'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '2px', paddingRight: isSelected ? '60px' : 0 }}>{c.name}</div>
                    {c.description && <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.description}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={13} />{c.userCount ?? 0} membres</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={13} />{c.projectCount ?? 0} projets</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Percent size={13} />TVA {c.vatRate ?? 20}%</span>
                </div>
                {(canEdit(c) || canDelete(c)) && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {canEdit(c) && (
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setModal(c)}>
                        <Pencil size={13} /> Modifier
                      </button>
                    )}
                    {canDelete(c) && (
                      <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} disabled={deleting === c._id} onClick={() => handleDelete(c._id, c.name)}>
                        {deleting === c._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Supprimer
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', boxSizing: 'border-box' }
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 4 }
const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }
