import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import {
  Users,
  Check,
  X,
  Trash2,
  Loader2,
  Shield,
  ShieldCheck,
  Clock,
  AlertCircle,
  UserCheck,
  UserX
} from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'admin',   label: 'Administrateur', color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'manager', label: 'Manager',        color: '#2563eb', bg: '#eff6ff' },
  { value: 'member',  label: 'Membre',         color: '#059669', bg: '#f0fdf4' },
]

export default function UsersView() {
  const {
    user: currentUser,
    company,
    users,
    pendingMembers,
    fetchUsers,
    fetchMembers,
    approveMember,
    rejectMember,
    changeMemberRole,
    deleteUser
  } = useStore()

  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [err, setErr] = useState('')

  const isAdmin = currentUser?.role === 'admin'
  const isManagerOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager'

  const loadData = async () => {
    try {
      if (isManagerOrAdmin) {
        await fetchMembers()
      } else {
        await fetchUsers()
      }
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [isManagerOrAdmin])

  const handleApprove = async (member) => {
    setActionLoadingId(member._id)
    setErr('')
    setSuccessMsg('')
    try {
      await approveMember(member._id)
      setSuccessMsg(`La demande de ${member.firstName} ${member.lastName} a été acceptée. Il a rejoint l'équipe en tant que Membre.`)
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (e) {
      setErr(e.message || 'Erreur lors de l\'approbation')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async (member) => {
    if (!confirm(`Refuser la demande d'adhésion de ${member.firstName} ${member.lastName} ?`)) return

    setActionLoadingId(member._id)
    setErr('')
    setSuccessMsg('')
    try {
      await rejectMember(member._id)
      setSuccessMsg(`La demande de ${member.firstName} ${member.lastName} a été refusée.`)
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (e) {
      setErr(e.message || 'Erreur lors du refus')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRoleChange = async (memberId, newRole) => {
    setActionLoadingId(memberId)
    setErr('')
    try {
      await changeMemberRole(memberId, newRole)
      setSuccessMsg('Rôle mis à jour avec succès.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (e) {
      setErr(e.message || 'Erreur lors du changement de rôle')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDeleteMember = async (member) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${member.firstName} ${member.lastName} de l'entreprise ?`)) return

    setActionLoadingId(member._id)
    setErr('')
    try {
      await deleteUser(member._id)
      await loadData()
      setSuccessMsg(`${member.firstName} ${member.lastName} a été retiré de l'entreprise.`)
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (e) {
      setErr(e.message || 'Erreur lors de la suppression')
    } finally {
      setActionLoadingId(null)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <Loader2 size={28} className="animate-spin" color="#10b981" />
      </div>
    )
  }

  // Filtrer les membres actifs (qui ne sont pas en attente)
  const activeMembers = users.filter(u => u.status !== 'pending_approval')

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 4px' }}>
            <Users size={26} color="#10b981" /> Membres de l'équipe
          </h1>
          <p style={{ margin: 0 }}>
            {company?.name} · {activeMembers.length} membre(s) actif(s)
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          color: '#15803d',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          <UserCheck size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {err && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          <AlertCircle size={16} />
          <span>{err}</span>
        </div>
      )}

      {/* SECTION 1 : DEMANDES D'ADHÉSION EN ATTENTE (Visible uniquement par l'admin) */}
      {isAdmin && (
        <div style={{
          marginBottom: '32px',
          backgroundColor: 'var(--card-bg)',
          borderRadius: '14px',
          border: pendingMembers.length > 0 ? '1.5px solid #fcd34d' : '1px solid var(--border-color)',
          padding: '20px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: pendingMembers.length > 0 ? '#fef3c7' : '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={16} color={pendingMembers.length > 0 ? '#d97706' : '#9ca3af'} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>
                Demandes d'adhésion en attente
              </h3>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '99px',
              backgroundColor: pendingMembers.length > 0 ? '#fef3c7' : '#f3f4f6',
              color: pendingMembers.length > 0 ? '#b45309' : '#6b7280'
            }}>
              {pendingMembers.length} en attente
            </span>
          </div>

          {pendingMembers.length === 0 ? (
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Aucune demande d'adhésion en attente pour le moment.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingMembers.map(candidate => (
                <div
                  key={candidate._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <img
                      src={candidate.avatar}
                      alt={candidate.firstName}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                        {candidate.firstName} {candidate.lastName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {candidate.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleApprove(candidate)}
                      disabled={actionLoadingId === candidate._id}
                      className="btn"
                      style={{
                        backgroundColor: '#10b981',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      {actionLoadingId === candidate._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <><Check size={14} /> Accepter</>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReject(candidate)}
                      disabled={actionLoadingId === candidate._id}
                      className="btn"
                      style={{
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      <X size={14} /> Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2 : LISTE DES MEMBRES ACTIFS */}
      <div>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="#6366f1" /> Membres de l'entreprise
        </h3>

        {activeMembers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <Users size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ color: 'var(--text-secondary)' }}>Aucun membre actif</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {activeMembers.map(member => {
              const roleInfo = ROLE_OPTIONS.find(r => r.value === member.role) || ROLE_OPTIONS[2]
              const isSelf = member._id === currentUser?._id

              return (
                <div
                  key={member._id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '18px',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                      src={member.avatar}
                      alt={member.firstName}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{member.firstName} {member.lastName}</span>
                        {isSelf && (
                          <span style={{ fontSize: '10px', color: '#6366f1', backgroundColor: '#ede9fe', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            Vous
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.email}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    {/* Contrôle ou badge de rôle */}
                    {isAdmin && !isSelf ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Rôle :</span>
                        <select
                          value={member.role}
                          disabled={actionLoadingId === member._id}
                          onChange={(e) => handleRoleChange(member._id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: roleInfo.bg,
                            color: roleInfo.color,
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          {ROLE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '99px',
                        backgroundColor: roleInfo.bg,
                        color: roleInfo.color,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Shield size={11} /> {roleInfo.label}
                      </span>
                    )}

                    {/* Bouton de suppression (Admin uniquement, sauf sur soi-même) */}
                    {isAdmin && !isSelf && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member)}
                        disabled={actionLoadingId === member._id}
                        title="Retirer le membre de l'entreprise"
                        style={{
                          background: 'none',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          padding: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ef4444'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
