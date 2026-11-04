import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Building2, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useStore()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')

    if (password.length < 6) {
      setErr('Le mot de passe doit comporter au moins 6 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setErr('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    try {
      await register(firstName, lastName, email, password)
      // Étape 1 validée avec succès -> passage direct à l'étape 2 (Entreprise)
      navigate('/onboarding')
    } catch (e) {
      setErr(e.message || 'Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
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
        padding: '36px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        border: '1px solid var(--border-color)'
      }}>
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
            Créer un compte
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            Inscription par étapes à la plateforme SaaS
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
              backgroundColor: '#6366f1',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>1</div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Vos informations</span>
          </div>

          <div style={{ width: '24px', height: '1px', backgroundColor: 'var(--border-color)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.5 }}>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>2</div>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Entreprise</span>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Prénom *</label>
              <input
                type="text"
                required
                autoFocus
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Jean"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Nom *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Dupont"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Adresse email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jean.dupont@exemple.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Mot de passe * (min. 6 caractères)</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Confirmer le mot de passe *</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
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
              marginTop: '8px',
              fontWeight: 600
            }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>Étape suivante : Choisir mon entreprise <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          Vous avez déjà un compte ?{' '}
          <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
            Se connecter
          </Link>
        </div>
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
