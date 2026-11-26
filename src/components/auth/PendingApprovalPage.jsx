import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Clock, RefreshCw, LogOut, Building2, ShieldAlert, Loader2 } from 'lucide-react'

export default function PendingApprovalPage() {
  const { user, company, fetchMe, logout } = useStore()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState('')

  const handleCheckStatus = async () => {
    setChecking(true)
    setFeedback('')
    try {
      const data = await fetchMe()
      if (data && data.status === 'active') navigate('/')
      else setFeedback('Votre demande est toujours en attente de validation par le CEO.')
    } catch {
      setFeedback('Impossible de vérifier le statut pour le moment. Veuillez réessayer.')
    } finally {
      setChecking(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ minHeight: '100dvh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', backgroundColor: 'var(--card-bg)', borderRadius: 12, padding: '32px 28px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <Clock size={28} color="#b45309" />
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 600 }}>Demande en attente</h1>
        <p style={{ margin: '0 0 22px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Votre accès à <strong style={{ color: 'var(--text-main)' }}>{company?.name || "l'entreprise"}</strong> est en attente d’approbation par le CEO.
        </p>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 10, marginBottom: 20, textAlign: 'left' }}>
          <Building2 size={18} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>{company?.name || 'Entreprise'}</div>
            <div>{user?.firstName} {user?.lastName} · {user?.email}</div>
          </div>
        </div>

        {feedback && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, color: '#92400e', fontSize: 13, marginBottom: 16, textAlign: 'left' }}>
            <ShieldAlert size={15} style={{ flexShrink: 0 }} />
            <span>{feedback}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={handleCheckStatus} disabled={checking} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {checking ? <Loader2 size={16} className="animate-spin" /> : <><RefreshCw size={16} /> Vérifier mon statut</>}
          </button>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}
