import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Building2, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login } = useStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const data = await login(email, password)
      const user = data.user
      if (!user.companyId) navigate('/onboarding')
      else if (user.status === 'pending_approval') navigate('/pending')
      else navigate('/')
    } catch (e) {
      setErr(e.message || 'Erreur lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      boxSizing: 'border-box',
      backgroundColor: 'var(--bg-color)'
    }}>
      <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card-bg)' }}>
            <Building2 size={18} color="var(--text-main)" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-main)' }}>AgencyOS</span>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 600, color: 'var(--text-main)' }}>Connexion</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>Connectez-vous à votre espace.</p>
          </div>

          {err && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', background: '#fef2f2', fontSize: 13, marginBottom: 16 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{err}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label htmlFor="email" style={labelStyle}>Adresse e-mail</label>
              <input id="email" type="email" required autoFocus autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nom@entreprise.fr" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="password" style={labelStyle}>Mot de passe</label>
              <input id="password" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Votre mot de passe" style={inputStyle} />
            </div>
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Connexion…</> : 'Se connecter'}
            </button>
          </form>
        </div>

        <p style={{ margin: '18px 0 0', fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
          Pas encore de compte ? <Link to="/register" style={{ color: 'var(--text-main)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-main)', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }
const buttonStyle = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', marginTop: 4, borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent)', color: 'var(--card-bg)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
