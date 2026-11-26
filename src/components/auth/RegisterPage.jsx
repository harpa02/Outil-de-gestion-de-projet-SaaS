import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Building2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

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
    if (password.length < 6) return setErr('Le mot de passe doit comporter au moins 6 caractères.')
    if (password !== confirmPassword) return setErr('Les mots de passe ne correspondent pas.')
    setLoading(true)
    try {
      await register(firstName, lastName, email, password)
      navigate('/onboarding')
    } catch (e) {
      setErr(e.message || 'Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card-bg)' }}>
            <Building2 size={18} color="var(--text-main)" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-main)' }}>AgencyOS</span>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '28px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '4px 10px', borderRadius: 99 }}>1. Informations</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>→ 2. Entreprise</span>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 600 }}>Créer un compte</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>Renseignez vos informations pour commencer.</p>
          </div>

          {err && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', background: '#fef2f2', fontSize: 13, marginBottom: 16 }}><AlertCircle size={16} /><span>{err}</span></div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label htmlFor="firstName" style={labelStyle}>Prénom</label><input id="firstName" required autoFocus autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} /></div>
              <div><label htmlFor="lastName" style={labelStyle}>Nom</label><input id="lastName" required autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} /></div>
            </div>
            <div><label htmlFor="email" style={labelStyle}>Adresse e-mail</label><input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nom@entreprise.fr" style={inputStyle} /></div>
            <div><label htmlFor="password" style={labelStyle}>Mot de passe</label><input id="password" type="password" required minLength={6} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Au moins 6 caractères" style={inputStyle} /></div>
            <div>
              <label htmlFor="confirmPassword" style={labelStyle}>Confirmer le mot de passe</label>
              <input id="confirmPassword" type="password" required minLength={6} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
              {confirmPassword && password === confirmPassword && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#15803d', marginTop: 4 }}><CheckCircle2 size={12} /> Les mots de passe correspondent</div>}
            </div>
            <button type="submit" disabled={loading} style={buttonStyle}>{loading ? <><Loader2 size={16} className="animate-spin" /> Création…</> : 'Continuer'}</button>
          </form>
        </div>

        <p style={{ margin: '18px 0 0', fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
          Déjà un compte ? <Link to="/login" style={{ color: 'var(--text-main)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-main)', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }
const buttonStyle = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', marginTop: 4, borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
