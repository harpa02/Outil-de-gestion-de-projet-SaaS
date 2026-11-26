import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Building2, Plus, Trash2, Pencil, X, Loader2, Users, Briefcase, CheckCircle2 } from 'lucide-react'

const PLAN_OPTIONS = ['Starter', 'Pro', 'Enterprise']

function CompanyModal({ company, onClose, onSave }) {
  const { createCompanyAndJoin, updateCompany } = useStore()
  const [name, setName] = useState(company?.name || '')
  const [description, setDesc] = useState(company?.description || '')
  const [plan, setPlan] = useState(company?.plan || 'Pro')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const payload = { name, description, plan }
      const saved = company ? await updateCompany(company._id, payload) : await createCompanyAndJoin(name, description)
      onSave(saved)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px' }}>{company ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Nom *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corp" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={2} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Plan</label>
            <select value={plan} onChange={e => setPlan(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
              {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {err && <p style={{ color: '#ef4444', fontSize: '13px' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              {company ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
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

  const handleDelete = async (id, name) => {
    if (!confirm(`Supprimer l'entreprise « ${name} » ? Toutes les données associées seront supprimées.`)) return
    setDeleting(id)
    try { await deleteCompany(id); load() } catch (e) { alert(e.message) }
    finally { setDeleting(null) }
  }

  const canManage = (c) => c.createdBy && user?._id && String(c.createdBy) === String(user._id)

  return (
    <div>
      {modal !== null && <CompanyModal company={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 4px' }}><Building2 size={26} color="#6366f1" /> Entreprises</h1>
          <p style={{ margin: 0 }}>Seul le créateur peut modifier ou supprimer son entreprise.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={16} /> Nouvelle entreprise</button>
      </div>

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
            const isSelected = currentCompany?._id === c._id
            const owner = canManage(c)
            return (
              <div key={c._id} className="card" style={{ border: isSelected ? '2px solid #6366f1' : '1px solid var(--border-color)', position: 'relative' }}>
                {isSelected && <div style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#6366f1', backgroundColor: '#ede9fe', padding: '3px 8px', borderRadius: '99px' }}><CheckCircle2 size={12} /> Active</div>}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: isSelected ? '#ede9fe' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={22} color={isSelected ? '#6366f1' : '#6b7280'} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '2px', paddingRight: isSelected ? '60px' : 0 }}>{c.name}</div>
                    {c.description && <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.description}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={13} />{c.userCount ?? 0} membres</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={13} />{c.projectCount ?? 0} projets</span>
                </div>
                {owner && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setModal(c)}><Pencil size={13} /> Modifier</button>
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} disabled={deleting === c._id} onClick={() => handleDelete(c._id, c.name)}>
                      {deleting === c._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Supprimer
                    </button>
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
