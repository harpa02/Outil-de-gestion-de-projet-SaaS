import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Building2, Plus, Trash2, Pencil, X, Loader2, Users, Briefcase, CheckCircle2 } from 'lucide-react'

const PLAN_OPTIONS = ['Starter', 'Pro', 'Enterprise']

function CompanyModal({ company, onClose, onSave }) {
  const { createCompany, updateCompany } = useStore()
  const [name, setName]             = useState(company?.name        || '')
  const [description, setDesc]      = useState(company?.description || '')
  const [plan, setPlan]             = useState(company?.plan        || 'Pro')
  const [loading, setLoading]       = useState(false)
  const [err, setErr]               = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const payload = { name, description, plan }
      const saved = company
        ? await updateCompany(company._id, payload)
        : await createCompany(payload)
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
          <h3 style={{ margin: 0 }}>{company ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}</h3>
          <button onClick={onClose} style={iconBtnStyle}><X size={18} /></button>
        </div>
        {err && <div style={errStyle}>{err}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Nom de l'entreprise *</label>
            <input required value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="ex: Acme Corp" />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input value={description} onChange={e => setDesc(e.target.value)} style={inputStyle} placeholder="Activité principale..." />
          </div>
          <div>
            <label style={labelStyle}>Plan</label>
            <select value={plan} onChange={e => setPlan(e.target.value)} style={inputStyle}>
              {PLAN_OPTIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '4px' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : (company ? 'Enregistrer' : 'Créer l\'entreprise')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function CompaniesView() {
  const { companies, fetchCompanies, deleteCompany, currentCompany, logout } = useStore()
  const [modalCompany, setModalCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompanies().finally(() => setLoading(false))
  }, [])

  const handleDelete = async (company) => {
    if (!confirm(`Supprimer "${company.name}" et TOUTES ses données associées ?`)) return
    await deleteCompany(company._id)
  }

  const handleSwitchCompany = () => {
    logout()
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 size={28} className="animate-spin" color="#8b5cf6" /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Building2 size={26} color="#8b5cf6" /> Entreprises
        </h1>
        <button className="btn btn-primary" onClick={() => setModalCompany({})} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Nouvelle entreprise
        </button>
      </div>

      {companies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <Building2 size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>Aucune entreprise</h3>
          <p>Créez votre première entreprise.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {companies.map(company => {
            const planColors = { Starter: '#10b981', Pro: '#6366f1', Enterprise: '#f59e0b' }
            const planColor = planColors[company.plan] || '#6366f1'
            const isCurrent = company._id === currentCompany?._id
            return (
              <div key={company._id} className="card" style={{ border: isCurrent ? '2px solid #6366f1' : '1px solid var(--border-color)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: planColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={20} color={planColor} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>{company.name}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '99px', backgroundColor: planColor + '22', color: planColor, fontWeight: 600 }}>
                          Plan {company.plan}
                        </span>
                        {isCurrent && (
                          <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '99px', backgroundColor: '#e0e7ff', color: '#4338ca', fontWeight: 600 }}>
                            Espace actif
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {company.description && (
                  <p style={{ fontSize: '13px', margin: '0 0 14px' }}>{company.description}</p>
                )}

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Users size={14} /> {company.userCount ?? 0} membres
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Briefcase size={14} /> {company.projectCount ?? 0} projets
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={14} /> {company.taskCount ?? 0} tâches
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  {!isCurrent ? (
                    <button onClick={handleSwitchCompany} className="btn btn-secondary" style={{ flex: 1, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#6366f1', borderColor: '#c7d2fe' }}>
                      Changer d'espace
                    </button>
                  ) : (
                    <button onClick={() => setModalCompany(company)} className="btn btn-secondary" style={{ flex: 1, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Pencil size={14} /> Modifier
                    </button>
                  )}
                  {isCurrent && (
                    <button onClick={() => setModalCompany(company)} className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 10px' }} title="Modifier">
                      <Pencil size={14} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(company)} className="btn btn-secondary" style={{ color: '#ef4444', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }} title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalCompany !== null && (
        <CompanyModal
          company={Object.keys(modalCompany).length ? modalCompany : null}
          onClose={() => setModalCompany(null)}
          onSave={() => { setModalCompany(null); fetchCompanies() }}
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
