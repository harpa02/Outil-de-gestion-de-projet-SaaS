import React, { useCallback, useEffect, useState } from 'react'
import { useStore } from '../store'
import {
  Users, Check, X, Eye, Loader2, Shield, ShieldCheck, Clock,
  AlertCircle, UserCheck, Phone, Mail, Briefcase, Building2, Save,
} from 'lucide-react'
import {
  ROLES, ROLE_OPTIONS, roleInfo, memberLabel, memberSubtitle, canChangeRole, canApproveDepartmentRequest,
} from '../roleUtils'

export default function UsersView() {
  const {
    user: currentUser,
    company,
    users,
    pendingMembers,
    departments,
    fetchUsers,
    fetchMembers,
    fetchDepartments,
    approveMember,
    rejectMember,
    changeMemberRole,
    updateMemberAssignment,
    respondDepartmentRequest,
  } = useStore()

  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [err, setErr] = useState('')
  const [selected, setSelected] = useState(null)
  const [assignment, setAssignment] = useState({ departmentId: '', jobTitle: '', managedDepartmentId: '' })

  const isCeo = currentUser?.role === ROLES.CEO
  const isManager = currentUser?.role === ROLES.MANAGER
  const isManagerOrCeo = isCeo || isManager

  const loadData = useCallback(async () => {
    try {
      if (isManagerOrCeo) await fetchMembers()
      else await fetchUsers()
      await fetchDepartments()
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [isManagerOrCeo, fetchMembers, fetchUsers, fetchDepartments])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Rafraîchit la fiche ouverte quand la liste des membres est rechargée.
  useEffect(() => {
    if (!selected) return
    const fresh = users.find(u => u._id === selected._id)
    if (!fresh) return
    const nextAssignment = {
      departmentId: fresh.departmentId ? String(fresh.departmentId) : '',
      jobTitle: fresh.jobTitle || '',
      managedDepartmentId: fresh.managedDepartmentId ? String(fresh.managedDepartmentId) : '',
    }
    setSelected(prev => JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh)
    setAssignment(prev => JSON.stringify(prev) === JSON.stringify(nextAssignment) ? prev : nextAssignment)
  }, [users, selected])

  const notify = (message) => {
    setSuccessMsg(message)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const runAction = async (id, fn, message) => {
    setActionLoadingId(id)
    setErr('')
    try {
      await fn()
      if (message) notify(message)
    } catch (e) {
      setErr(e.message || 'Erreur lors de l\'action')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleApprove = (member) => runAction(
    member._id,
    () => approveMember(member._id),
    `La demande de ${member.firstName} ${member.lastName} a été acceptée.`
  )

  const handleReject = (member) => {
    if (!confirm(`Refuser la demande d'adhésion de ${member.firstName} ${member.lastName} ?`)) return
    return runAction(member._id, () => rejectMember(member._id), 'Demande refusée.')
  }

  const handleRoleChange = (member, role) => runAction(
    member._id,
    () => changeMemberRole(member._id, role),
    'Rôle mis à jour avec succès.'
  )

  const handleRequestDecision = (member, approved) => runAction(
    member._id,
    () => respondDepartmentRequest(member._id, approved),
    approved ? 'Changement de service approuvé.' : 'Demande refusée.'
  )

  const handleAssignmentSave = async () => {
    if (!selected) return
    const payload = {}
    const canSetDepartment = isCeo || (isManager && selected.role === ROLES.EMPLOYEE)
    const canSetJob = isCeo || (isManager && selected.role === ROLES.EMPLOYEE)
    const canSetManaged = isCeo || (isManager && String(selected._id) === String(currentUser._id))

    if (canSetDepartment) payload.departmentId = assignment.departmentId || null
    if (canSetJob) payload.jobTitle = assignment.jobTitle
    if (canSetManaged) payload.managedDepartmentId = assignment.managedDepartmentId || null

    await runAction(
      selected._id,
      () => updateMemberAssignment(selected._id, payload),
      'Affectation mise à jour.'
    )
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 size={28} className="animate-spin" color="#10b981" /></div>
  }

  const activeMembers = users.filter(u => u.status !== 'pending_approval')
  const departmentRequests = activeMembers.filter(
    m => m.departmentChangeRequest && canApproveDepartmentRequest(currentUser, m)
  )
  const getDepartment = (id) => departments.find(d => String(d._id) === String(id))

  const groups = departments
    .map(d => ({ id: d._id, name: d.name, members: activeMembers.filter(m => String(m.departmentId) === String(d._id)) }))
  groups.push({
    id: 'none',
    name: 'Sans service',
    members: activeMembers.filter(m => !m.departmentId || !getDepartment(m.departmentId)),
  })

  const canEditAssignment = (member) => {
    if (!member || member.role === ROLES.CEO) return false
    if (isCeo) return true
    if (isManager) {
      return member.role === ROLES.EMPLOYEE || String(member._id) === String(currentUser._id)
    }
    return false
  }

  const allowedRoleOptions = (member) => ROLE_OPTIONS.filter(opt => canChangeRole(currentUser, member, opt.value))

  const openDetails = (member) => {
    setSelected(member)
    setAssignment({
      departmentId: member.departmentId ? String(member.departmentId) : '',
      jobTitle: member.jobTitle || '',
      managedDepartmentId: member.managedDepartmentId ? String(member.managedDepartmentId) : '',
    })
    setErr('')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 4px' }}>
            <Users size={26} color="#10b981" /> Membres de l'équipe
          </h1>
          <p style={{ margin: 0 }}>{company?.name} · {activeMembers.length} membre(s) actif(s)</p>
        </div>
      </div>

      {successMsg && <div style={messageStyle('#f0fdf4', '#bbf7d0', '#15803d')}><UserCheck size={16} /> {successMsg}</div>}
      {err && <div style={messageStyle('#fef2f2', '#fecaca', '#dc2626')}><AlertCircle size={16} /> {err}</div>}

      {/* Demandes d'adhésion (CEO) */}
      {isCeo && (
        <div className="card" style={{ marginBottom: '28px', border: pendingMembers.length > 0 ? '1.5px solid #fcd34d' : '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={17} color="#d97706" /> Demandes d'adhésion en attente</h3>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: pendingMembers.length ? '#fef3c7' : '#f3f4f6', color: pendingMembers.length ? '#b45309' : '#6b7280' }}>
              {pendingMembers.length} en attente
            </span>
          </div>
          {pendingMembers.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Aucune demande d'adhésion en attente.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingMembers.map(candidate => (
                <div key={candidate._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', background: 'var(--bg-color)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <img src={candidate.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{candidate.firstName} {candidate.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{candidate.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn" onClick={() => handleApprove(candidate)} disabled={actionLoadingId === candidate._id} style={{ background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, fontWeight: 600 }}>
                      <Check size={14} /> Accepter
                    </button>
                    <button className="btn" onClick={() => handleReject(candidate)} disabled={actionLoadingId === candidate._id} style={{ background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', fontSize: 12, fontWeight: 600 }}>
                      <X size={14} /> Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Demandes de changement de service */}
      {departmentRequests.length > 0 && (
        <div className="card" style={{ marginBottom: '28px', border: '1.5px solid #bfdbfe' }}>
          <h3 style={{ marginTop: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} color="#2563eb" /> Demandes de changement de service
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {departmentRequests.map(member => (
              <div key={member._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', background: 'var(--bg-color)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{member.firstName} {member.lastName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    souhaite rejoindre « {member.departmentChangeRequest.departmentName || getDepartment(member.departmentChangeRequest.departmentId)?.name || 'service'} »
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button className="btn btn-primary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }} disabled={actionLoadingId === member._id} onClick={() => handleRequestDecision(member, true)}><Check size={14} /> Approuver</button>
                  <button className="btn btn-secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }} disabled={actionLoadingId === member._id} onClick={() => handleRequestDecision(member, false)}><X size={14} /> Refuser</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fiches par département */}
      <h3 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <ShieldCheck size={18} color="#6366f1" /> Fiches de contact
      </h3>

      {activeMembers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Users size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>Aucun membre actif</h3>
        </div>
      ) : (
        groups.map(group => (
          <div key={group.id} style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{group.name}</h4>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>({group.members.length})</span>
            </div>
            {group.members.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Aucun membre dans ce service.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {group.members.map(member => {
                  const info = roleInfo(member.role)
                  const isSelf = String(member._id) === String(currentUser?._id)
                  const options = allowedRoleOptions(member)
                  return (
                    <div key={member._id} className="card" onClick={() => openDetails(member)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, padding: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={member.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{member.firstName} {member.lastName}</span>
                            {isSelf && <span style={{ fontSize: 10, color: '#6366f1', background: '#ede9fe', padding: '2px 6px', borderRadius: 4 }}>Vous</span>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {memberSubtitle(member, departments)}
                          </div>
                          <div style={{ fontSize: 11, color: '#6366f1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {memberLabel(member, departments)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
                        {options.length > 0 ? (
                          <select value={member.role} onChange={e => handleRoleChange(member, e.target.value)} disabled={actionLoadingId === member._id} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-color)', background: info.bg, color: info.color, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                            <option value={member.role}>{info.label}</option>
                            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: info.bg, color: info.color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Shield size={11} /> {info.label}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => openDetails(member)}
                          title={`Voir plus de détails sur ${member.firstName} ${member.lastName}`}
                          style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}
                        >
                          <Eye size={14} /> Voir plus
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))
      )}

      {/* Détail de la fiche */}
      {selected && (
        <div style={overlayStyle} onClick={() => setSelected(null)}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={selected.avatar} alt="" style={{ width: 52, height: 52, borderRadius: '50%' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{selected.firstName} {selected.lastName}</h3>
                  <span style={{ fontSize: 12, fontWeight: 600, color: roleInfo(selected.role).color }}>{roleInfo(selected.role).label}</span>
                </div>
              </div>
              <button style={iconBtnStyle} onClick={() => setSelected(null)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18, fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={15} color="#8c857b" /> <a href={`mailto:${selected.email}`} style={{ color: 'inherit' }}>{selected.email}</a></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={15} color="#8c857b" /> {selected.phone || 'Téléphone non renseigné'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Briefcase size={15} color="#8c857b" /> {selected.jobTitle || 'Poste non renseigné'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={15} color="#8c857b" /> Service : {getDepartment(selected.departmentId)?.name || 'Non renseigné'}</div>
              {selected.managedDepartmentId && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={15} color="#8c857b" /> Service managé : {getDepartment(selected.managedDepartmentId)?.name || 'Inconnu'}</div>}
            </div>

            {canEditAssignment(selected) && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Affectation</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(isCeo || (isManager && selected.role === ROLES.EMPLOYEE)) && (
                    <>
                      <div>
                        <label style={labelStyle}>Service</label>
                        <select style={inputStyle} value={assignment.departmentId} onChange={e => setAssignment({ ...assignment, departmentId: e.target.value })}>
                          <option value="">Sans service</option>
                          {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Poste</label>
                        <input style={inputStyle} value={assignment.jobTitle} onChange={e => setAssignment({ ...assignment, jobTitle: e.target.value })} placeholder="ex : Développeur front-end" />
                      </div>
                    </>
                  )}
                  {(isCeo || (isManager && String(selected._id) === String(currentUser._id))) && selected.role === ROLES.MANAGER && (
                    <div>
                      <label style={labelStyle}>Service managé</label>
                      <select style={inputStyle} value={assignment.managedDepartmentId} onChange={e => setAssignment({ ...assignment, managedDepartmentId: e.target.value })}>
                        <option value="">Aucun</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={handleAssignmentSave} disabled={actionLoadingId === selected._id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      {actionLoadingId === selected._id ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '9px 11px', border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 4 }
const messageStyle = (bg, border, color) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: bg, border: `1px solid ${border}`, borderRadius: 8, color, fontSize: 13, marginBottom: 20 })
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }
