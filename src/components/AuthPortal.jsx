import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Building2, User, ChevronRight, Plus, Loader2, AlertCircle, X, LogIn, ArrowLeft, Shield } from 'lucide-react'

// ── Formulaire de création d'entreprise ─────────────────────────────────────
function CreateCompanyModal({ onClose, onCreated }) {
  const { createCompany } = useStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [plan, setPlan] = useState('Pro')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const company = await createCompany({ name, description, plan })
      onCreated(company)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Nouvelle entreprise</h3>
          <button onClick={onClose} style={iconBtnStyle}><X size={18} /></button>
        </div>
        {err && <div style={errStyle}><AlertCircle size={14} /> {err}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Nom de l'entreprise *</label>
            <input required value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="ex: Acme Corp" />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} placeholder="Activité principale..." />
          </div>
          <div>
            <label style={labelStyle}>Plan</label>
            <select value={plan} onChange={e => setPlan(e.target.value)} style={inputStyle}>
              <option>Starter</option>
              <option>Pro</option>
              <option>Enterprise</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '4px' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Créer l\'entreprise'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Formulaire d'ajout d'utilisateur dans une entreprise ──────────────────────
function CreateUserModal({ company, onClose, onCreated }) {
  const { createUser } = useStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('admin')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const newUser = await createUser({ name, email, role }, company._id)
      onCreated(newUser)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Ajouter un membre à {company.name}</h3>
          <button onClick={onClose} style={iconBtnStyle}><X size={18} /></button>
        </div>
        {err && <div style={errStyle}><AlertCircle size={14} /> {err}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Nom complet *</label>
            <input required value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="ex: Sarah Connor" />
          </div>
          <div>
            <label style={labelStyle}>Email professionnel *</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="sarah@entreprise.com" />
          </div>
          <div>
            <label style={labelStyle}>Rôle</label>
            <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
              <option value="admin">Admin (Accès total)</option>
              <option value="manager">Manager (Gestion projets & tâches)</option>
              <option value="member">Membre (Assignation & Kanban)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '4px' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Créer et sélectionner'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Portail principal ────────────────────────────────────────────────────────
export default function AuthPortal() {
  const { companies, fetchCompanies, users, fetchUsers, login } = useStore()
  const [step, setStep] = useState('company') // 'company' | 'user'
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [showCreateCompany, setShowCreateCompany] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetchCompanies().finally(() => setLoading(false))
  }, [])

  const handleSelectCompany = async (company) => {
    setSelectedCompany(company)
    setStep('user')
    setErr('')
    const fetchedUsers = await fetchUsers(company._id)
    if (fetchedUsers && fetchedUsers.length > 0) {
      setSelectedUserId(fetchedUsers[0]._id)
    } else {
      setSelectedUserId('')
    }
  }

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    if (!selectedUserId) { setErr('Veuillez sélectionner ou créer un utilisateur.'); return }
    setLoginLoading(true)
    setErr('')
    try {
      await login(selectedCompany._id, selectedUserId)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-color)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '520px', backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '36px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '1px solid var(--border-color)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Building2 size={26} color="#fff" />
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', color: 'var(--text-main)' }}>SaaS Project Manager</h2>
          <p style={{ margin: 0, fontSize: '13px' }}>Gestion de projet multi-entreprises</p>
        </div>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '13px' }}>
          <span style={{ color: step === 'company' ? '#6366f1' : 'var(--text-secondary)', fontWeight: step === 'company' ? 600 : 400, cursor: step === 'user' ? 'pointer' : 'default' }}
            onClick={() => { if (step === 'user') { setStep('company'); setErr('') } }}>
            1. Entreprise
          </span>
          <ChevronRight size={14} color="var(--text-secondary)" />
          <span style={{ color: step === 'user' ? '#6366f1' : 'var(--text-secondary)', fontWeight: step === 'user' ? 600 : 400 }}>
            2. Utilisateur
          </span>
        </div>

        {err && <div style={errStyle}><AlertCircle size={14} /> {err}</div>}

        {/* ÉTAPE 1 : Sélection de l'entreprise */}
        {step === 'company' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px' }}><Loader2 size={24} className="animate-spin" color="#6366f1" /></div>
            ) : (
              <>
                <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-main)', fontWeight: 500 }}>
                  Sélectionnez votre espace de travail :
                </p>
                {companies.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Aucune entreprise enregistrée. Créez-en une pour commencer.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', maxHeight: '320px', overflowY: 'auto' }}>
                    {companies.map(company => (
                      <button key={company._id} onClick={() => handleSelectCompany(company)}
                        style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.backgroundColor = '#f5f3ff' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'transparent' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 size={20} color="#6366f1" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{company.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Plan {company.plan} · {company.userCount ?? 0} membre(s) · {company.projectCount ?? 0} projet(s)
                          </div>
                        </div>
                        <ChevronRight size={16} color="var(--text-secondary)" />
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowCreateCompany(true)} className="btn btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Plus size={16} /> Créer une nouvelle entreprise
                </button>
              </>
            )}
          </div>
        )}

        {/* ÉTAPE 2 : Sélection / Création de l'utilisateur */}
        {step === 'user' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#f5f3ff', borderRadius: '10px', border: '1px solid #e0e7ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={20} color="#6366f1" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{selectedCompany?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Plan {selectedCompany?.plan}</div>
                </div>
              </div>
              <button type="button" onClick={() => { setStep('company'); setErr('') }} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                <ArrowLeft size={13} /> Changer
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ ...labelStyle, margin: 0 }}>
                  <User size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Sélectionnez votre profil :
                </label>
                <button type="button" onClick={() => setShowCreateUser(true)} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Plus size={14} /> Ajouter un membre
                </button>
              </div>

              {users.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--bg-color)', borderRadius: '10px', border: '1px dashed var(--border-color)', margin: '10px 0' }}>
                  <User size={32} color="#9ca3af" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)', marginBottom: '4px' }}>Aucun utilisateur dans cette entreprise</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Pour accéder au tableau de bord, créez votre premier compte administrateur.</p>
                  <button type="button" onClick={() => setShowCreateUser(true)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <Plus size={15} /> Créer le premier membre
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  {users.map(user => (
                    <label key={user._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', border: `1px solid ${selectedUserId === user._id ? '#6366f1' : 'var(--border-color)'}`, borderRadius: '10px', cursor: 'pointer', backgroundColor: selectedUserId === user._id ? '#f5f3ff' : 'transparent', transition: 'all 0.15s ease' }}>
                      <input type="radio" name="user" value={user._id} checked={selectedUserId === user._id} onChange={e => setSelectedUserId(e.target.value)} style={{ display: 'none' }} />
                      <img src={user.avatar} alt={user.name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.email} · <span style={{ textTransform: 'capitalize' }}>{user.role}</span></div>
                      </div>
                      {selectedUserId === user._id && (
                        <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>Actif</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loginLoading || !selectedUserId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px', opacity: !selectedUserId ? 0.6 : 1, cursor: !selectedUserId ? 'not-allowed' : 'pointer' }}>
              {loginLoading ? <Loader2 size={16} className="animate-spin" /> : <><LogIn size={16} /> Accéder au tableau de bord</>}
            </button>
          </form>
        )}
      </div>

      {showCreateCompany && (
        <CreateCompanyModal
          onClose={() => setShowCreateCompany(false)}
          onCreated={(company) => {
            setShowCreateCompany(false)
            handleSelectCompany(company)
          }}
        />
      )}

      {showCreateUser && selectedCompany && (
        <CreateUserModal
          company={selectedCompany}
          onClose={() => setShowCreateUser(false)}
          onCreated={async (newUser) => {
            setShowCreateUser(false)
            await fetchUsers(selectedCompany._id)
            setSelectedUserId(newUser._id)
          }}
        />
      )}
    </div>
  )
}

// ── Styles partagés ──────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)',
  borderRadius: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)',
  fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit'
}
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }
const errStyle = { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }
const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }
const modalStyle = { backgroundColor: 'var(--card-bg)', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '440px', border: '1px solid var(--border-color)' }
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '4px' }

