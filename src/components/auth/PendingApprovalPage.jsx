import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Clock, RefreshCw, LogOut, CheckCircle2, Building2, ShieldAlert } from 'lucide-react'

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
      if (data && data.status === 'active') {
        navigate('/')
      } else {
        setFeedback('Votre demande est toujours en attente de validation par un administrateur.')
      }
    } catch {
      setFeedback('Impossible de vérifier le statut pour le moment. Veuillez réessayer.')
    } finally {
      setChecking(false)
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
        maxWidth: '480px',
        backgroundColor: 'var(--card-bg)',
        borderRadius: '16px',
        padding: '40px 36px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        border: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        {/* Animated icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          backgroundColor: '#fef3c7',
          color: '#d97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 4px 14px rgba(217, 119, 6, 0.15)'
        }}>
          <Clock size={32} />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>
          Demande d'adhésion en attente
        </h2>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 24px' }}>
          Votre demande pour rejoindre l'entreprise a bien été envoyée.
          Un <strong>administrateur</strong> doit examiner et approuver votre profil avant que vous ne puissiez accéder à l'espace de travail.
        </p>

        {/* Détails du compte */}
        <div style={{
          backgroundColor: 'var(--bg-color)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          padding: '16px',
          textAlign: 'left',
          marginBottom: '24px',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Compte :</span>
            <strong style={{ color: 'var(--text-main)' }}>
              {user?.firstName} {user?.lastName}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Email :</span>
            <span style={{ color: 'var(--text-main)' }}>{user?.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Entreprise visée :</span>
            <span style={{ color: '#6366f1', fontWeight: 600 }}>{company?.name || 'Entreprise sélectionnée'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Statut :</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: '#d97706',
              fontWeight: 600,
              fontSize: '12px'
            }}>
              ● En attente d'approbation
            </span>
          </div>
        </div>

        {feedback && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '8px',
            color: '#b45309',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            {feedback}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              fontWeight: 600
            }}
          >
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Vérification en cours...' : 'Vérifier si ma demande a été acceptée'}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              fontSize: '13px'
            }}
          >
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}

