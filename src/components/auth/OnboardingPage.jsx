import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import {
  Building2,
  Plus,
  Users,
  Search,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  LogOut,
  ShieldCheck,
  Clock
} from 'lucide-react'

export default function OnboardingPage() {
  const { user, companies, fetchCompanies, createCompanyAndJoin, joinCompany, logout } = useStore()
  const navigate = useNavigate()

  const [mode, setMode] = useState(null) // null | 'join' | 'create'
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState('')

  // Formulaire création
  const [companyName, setCompanyName] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetchCompanies()
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [fetchCompanies])

  // Filtrage des entreprises pour la recherche
  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleJoin = async () => {
    if (!selectedCompanyId) {
      setErr('Veuillez sélectionner une entreprise dans la liste.')
      return
    }

    setLoading(true)
    setErr('')

    try {
      await joinCompany(selectedCompanyId)
      // L'utilisateur rejoint en attente de validation admin
      navigate('/pending')
    } catch (e) {
      setErr(e.message || 'Erreur lors de la demande d\'adhésion')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!companyName.trim()) {
      setErr('Le nom de l\'entreprise est obligatoire.')
      return
    }

    setLoading(true)
    setErr('')

    try {
      await createCompanyAndJoin(companyName.trim(), companyDescription.trim())
      // Créateur = direct Admin, accès immédiat au tableau de bord
      navigate('/')
    } catch (e) {
      setErr(e.message || 'Erreur lors de la création de l\'entreprise')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        backgroundColor: 'var(--card-bg)',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        border: '1px solid var(--border-color)',
        position: 'relative'
      }}>
        {/* Bouton Déconnexion en haut à droite */}
        <button
          onClick={handleLogout}
          title="Se déconnecter"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '6px 10px',
            borderRadius: '6px'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <LogOut size={14} /> Déconnexion
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
          }}>
            <Building2 size={26} color="#fff" />
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', color: 'var(--text-main)', fontWeight: 700 }}>
            Bienvenue{user?.firstName ? `, ${user.firstName}` : ''} !
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            Étape 2 sur 2 : Rattachez votre compte à une entreprise
          </p>
        </div>

        {/* Stepper indicateur */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px',
          padding: '10px 14px',
          backgroundColor: 'var(--bg-color)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>✓</div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Vos informations</span>
          </div>

          <div style={{ width: '24px', height: '2px', backgroundColor: '#6366f1' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#6366f1',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>2</div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1' }}>Entreprise</span>
          </div>
        </div>

        {err && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{err}</span>
          </div>
        )}

        {/* Étape 2A : Choix du mode (Rejoindre ou Créer) */}
        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)', margin: '0 0 4px', textAlign: 'center' }}>
              Comment souhaitez-vous démarrer ?
            </p>

            {/* Option 1 : Rejoindre une entreprise existante */}
            <div
              onClick={() => { setMode('join'); setErr('') }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '18px 20px',
                border: '1.5px solid var(--border-color)',
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#6366f1'
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                backgroundColor: '#ede9fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Users size={22} color="#6366f1" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)', marginBottom: '3px' }}>
                  Rejoindre une entreprise existante
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Sélectionnez votre entreprise dans la base. Votre accès sera soumis à validation par un administrateur.
                </div>
              </div>
              <ArrowRight size={18} color="var(--text-secondary)" />
            </div>

            {/* Option 2 : Créer sa propre entreprise */}
            <div
              onClick={() => { setMode('create'); setErr('') }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '18px 20px',
                border: '1.5px solid var(--border-color)',
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#10b981'
                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.04)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                backgroundColor: '#d1fae5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Plus size={22} color="#10b981" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)', marginBottom: '3px' }}>
                  Créer ma propre entreprise
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Fondez votre espace de travail. Vous obtiendrez immédiatement le statut d'<strong>Administrateur</strong>.
                </div>
              </div>
              <ArrowRight size={18} color="var(--text-secondary)" />
            </div>
          </div>
        )}

        {/* Étape 2B : REJOINDRE UNE ENTREPRISE EXISTANTE */}
        {mode === 'join' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => { setMode(null); setErr('') }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowLeft size={14} /> Retour au choix
              </button>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {companies.length} entreprise(s) disponible(s)
              </span>
            </div>

            {/* Barre de recherche */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Rechercher une entreprise..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  ...inputStyle,
                  paddingLeft: '36px'
                }}
              />
            </div>

            {fetching ? (
              <div style={{ textAlign: 'center', padding: '36px' }}>
                <Loader2 size={24} className="animate-spin" color="#6366f1" />
              </div>
            ) : companies.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '28px 20px',
                backgroundColor: 'var(--bg-color)',
                borderRadius: '10px',
                border: '1px dashed var(--border-color)',
                marginBottom: '16px'
              }}>
                <Building2 size={32} color="#9ca3af" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)', margin: '0 0 4px' }}>
                  Aucune entreprise enregistrée pour le moment.
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px' }}>
                  Soyez le premier à créer votre entreprise sur la plateforme !
                </p>
                <button
                  type="button"
                  onClick={() => { setMode('create'); setErr('') }}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <Plus size={15} /> Créer une entreprise
                </button>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Aucune entreprise ne correspond à votre recherche "{searchTerm}".
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '260px',
                overflowY: 'auto',
                marginBottom: '20px',
                paddingRight: '4px'
              }}>
                {filteredCompanies.map(c => {
                  const isSelected = selectedCompanyId === c._id
                  return (
                    <div
                      key={c._id}
                      onClick={() => setSelectedCompanyId(c._id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: `1.5px solid ${isSelected ? '#6366f1' : 'var(--border-color)'}`,
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? '#ede9fe' : 'var(--bg-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Building2 size={18} color={isSelected ? '#6366f1' : 'var(--text-secondary)'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.name}
                        </div>
                        {c.description && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.description}
                          </div>
                        )}
                      </div>
                      {isSelected ? (
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: '#6366f1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Check size={14} color="#fff" />
                        </div>
                      ) : (
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: '1.5px solid var(--border-color)'
                        }} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {companies.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '8px',
                  color: '#b45309',
                  fontSize: '12px'
                }}>
                  <Clock size={16} style={{ flexShrink: 0 }} />
                  <span>En rejoignant cette entreprise, un administrateur devra approuver votre demande avant que vous puissiez accéder au tableau de bord.</span>
                </div>

                <button
                  type="button"
                  onClick={handleJoin}
                  className="btn btn-primary"
                  disabled={loading || !selectedCompanyId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    fontWeight: 600,
                    opacity: !selectedCompanyId ? 0.6 : 1,
                    cursor: !selectedCompanyId ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Envoyer ma demande d'adhésion <ArrowRight size={16} /></>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Étape 2C : CRÉER SA PROPRE ENTREPRISE */}
        {mode === 'create' && (
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => { setMode(null); setErr('') }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowLeft size={14} /> Retour au choix
              </button>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: '#10b981',
                fontWeight: 600,
                backgroundColor: '#d1fae5',
                padding: '3px 8px',
                borderRadius: '99px'
              }}>
                <ShieldCheck size={13} /> Rôle Admin direct
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Nom de l'entreprise *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="ex: Acme Studios, Nova Digital..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Description de l'activité (optionnelle)</label>
                <textarea
                  rows={3}
                  value={companyDescription}
                  onChange={e => setCompanyDescription(e.target.value)}
                  placeholder="Agence de développement logiciel, design & solutions cloud..."
                  style={{
                    ...inputStyle,
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                color: '#15803d',
                fontSize: '12px'
              }}>
                <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                <span>En créant cette entreprise, vous devenez immédiatement son administrateur avec un contrôle total sur les projets, les tâches et les membres.</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  marginTop: '6px',
                  fontWeight: 600
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Créer mon entreprise et accéder au tableau de bord <ArrowRight size={16} /></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-main)',
  marginBottom: '6px'
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  backgroundColor: 'var(--bg-color)',
  color: 'var(--text-main)',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit'
}

