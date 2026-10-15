import React, { useState } from 'react'
import { useStore } from '../store'
import { Eye, EyeOff, AlertCircle, Rocket } from 'lucide-react'

// Reusable password input with show/hide toggle
function PasswordInput({ value, onChange, placeholder = '••••••••', required = false, style = {} }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ ...style, paddingRight: '40px' }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8C857B',
          padding: 0,
          lineHeight: 1
        }}
        title={show ? 'Masquer' : 'Afficher'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

export default function AuthPortal() {
  const { login, signup } = useStore()
  const [activeTab, setActiveTab] = useState('login')
  const [error, setError] = useState('')

  // Login states
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Micro-enterprise settings states
  const [companyName, setCompanyName] = useState('')
  const [address, setAddress] = useState('')
  const [siret, setSiret] = useState('')
  const [vatRate, setVatRate] = useState(20)
  const [legalForm] = useState('Micro-entreprise')
  const [naf, setNaf] = useState('7420Z')
  const [vatIntra, setVatIntra] = useState('')
  const [annualGoal, setAnnualGoal] = useState('')
  const [rcPro, setRcPro] = useState('')
  const [logoBase64, setLogoBase64] = useState('')

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result
        img.onload = () => {
          let width = img.width
          let height = img.height
          const maxWidth = 300
          const maxHeight = 150
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          canvas.getContext('2d').drawImage(img, 0, 0, width, height)
          setLogoBase64(canvas.toDataURL('image/jpeg', 0.8))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLoginSubmit = (e) => {
    e.preventDefault()
    setError('')
    const res = login(loginEmail, loginPassword)
    if (res.success) {
      window.location.reload()
    } else {
      setError(res.message)
    }
  }

  const handleSignupSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    const signupRes = signup({
      email,
      password,
      name,
      settings: {
        companyName,
        address,
        siret,
        vatRate: parseFloat(vatRate) || 20,
        legalForm,
        capital: '0',
        naf,
        vatIntra,
        annualGoal: parseFloat(annualGoal) || 20000,
        rcPro,
        logo: logoBase64
      }
    })

    if (signupRes.success) {
      localStorage.removeItem('onboarding_completed')
      window.location.reload()
    } else {
      setError('Erreur lors de la création du compte.')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #EAE6DF',
    borderRadius: '8px',
    backgroundColor: '#FDFBF7',
    color: '#3D3935',
    fontSize: '14px',
    boxSizing: 'border-box'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#3D3935',
    marginBottom: '6px',
    marginTop: '12px'
  }

  const optLabel = (text) => (
    <label style={labelStyle}>
      {text} <span style={{ fontWeight: 400, color: '#B0A89F', fontSize: '11px' }}>(optionnel)</span>
    </label>
  )

  const tabButtonStyle = (isActive) => ({
    flex: 1,
    padding: '12px',
    border: 'none',
    backgroundColor: isActive ? 'transparent' : '#F5F2EB',
    color: isActive ? '#3D3935' : '#8C857B',
    fontWeight: '600',
    cursor: 'pointer',
    borderBottom: isActive ? '2px solid #3D3935' : 'none',
    transition: 'all 0.2s'
  })

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#FDFBF7',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: activeTab === 'login' ? '450px' : '920px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 8px 30px rgba(61,57,53,0.08)',
        border: '1px solid #EAE6DF',
        transition: 'max-width 0.3s ease'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '28px', color: '#3D3935', margin: '0 0 4px 0' }}>
            Photographer OS
          </h2>
          <p style={{ color: '#8C857B', fontSize: '13px', margin: 0 }}>Gestion de Studio &amp; Micro-Entreprise</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: '24px', borderRadius: '8px', overflow: 'hidden' }}>
          <button type="button" style={tabButtonStyle(activeTab === 'login')} onClick={() => { setActiveTab('login'); setError('') }}>
            Se Connecter
          </button>
          <button type="button" style={tabButtonStyle(activeTab === 'signup')} onClick={() => { setActiveTab('signup'); setError('') }}>
            Créer un Compte Patron
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FCE8E6', color: '#CC8B86', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', border: '1px solid #F3C3C0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Adresse Email</label>
              <input type="email" required placeholder="jean@monstudio.fr" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mot de Passe</label>
              <PasswordInput required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={inputStyle} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', padding: '12px' }}>
              Accéder au Tableau de Bord
            </button>
          </form>

        ) : (
          /* SIGNUP FORM */
          <form onSubmit={handleSignupSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>

              {/* ---- LEFT: Identifiants ---- */}
              <div>
                <h3 style={{ borderBottom: '1px solid #EAE6DF', paddingBottom: '8px', fontSize: '14px', color: '#8C857B', margin: '0 0 4px 0', fontWeight: 600 }}>
                  1. Identifiants &amp; Profil
                </h3>

                <label style={labelStyle}>Nom Complet du Patron</label>
                <input type="text" required placeholder="Jean Dupont" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />

                <label style={labelStyle}>Adresse Email</label>
                <input type="email" required placeholder="jean@monstudio.fr" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />

                <label style={labelStyle}>Mot de Passe <span style={{ fontWeight: 400, color: '#B0A89F', fontSize: '11px' }}>(min. 6 caractères)</span></label>
                <PasswordInput required placeholder="Min. 6 caractères" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />

                <label style={labelStyle}>Confirmer le Mot de Passe</label>
                <PasswordInput required placeholder="Confirmer" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />

                <div style={{ marginTop: '16px' }}>
                  {optLabel('Logo Commercial')}
                  <input type="file" accept="image/*" onChange={handleLogoChange} style={{ ...inputStyle, padding: '6px' }} />
                  {logoBase64 && (
                    <div style={{ marginTop: '10px', textAlign: 'center', height: '55px' }}>
                      <img src={logoBase64} alt="Aperçu" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* ---- RIGHT: Micro-Entreprise ---- */}
              <div>
                <h3 style={{ borderBottom: '1px solid #EAE6DF', paddingBottom: '8px', fontSize: '14px', color: '#8C857B', margin: '0 0 4px 0', fontWeight: 600 }}>
                  2. Micro-Entreprise
                </h3>

                <label style={labelStyle}>Nom commercial du Studio</label>
                <input type="text" required placeholder="ex: Studio Lumina" value={companyName} onChange={e => setCompanyName(e.target.value)} style={inputStyle} />

                {optLabel('Adresse Professionnelle')}
                <input type="text" placeholder="123 Rue de Paris, 75001 Paris" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    {optLabel('Numéro SIRET')}
                    <input type="text" placeholder="14 chiffres" value={siret} onChange={e => setSiret(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ width: '100px' }}>
                    {optLabel('Code NAF')}
                    <input type="text" placeholder="7420Z" value={naf} onChange={e => setNaf(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    {optLabel('Num. TVA Intracom.')}
                    <input type="text" placeholder="ex: FR12345678901" value={vatIntra} onChange={e => setVatIntra(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ width: '90px' }}>
                    <label style={labelStyle}>TVA (%)</label>
                    <input type="number" required value={vatRate} onChange={e => setVatRate(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    {optLabel('Assurance RC Pro')}
                    <input type="text" placeholder="ex: AXA N° 84729" value={rcPro} onChange={e => setRcPro(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    {optLabel('Objectif CA Annuel (€)')}
                    <input type="number" placeholder="20000" value={annualGoal} onChange={e => setAnnualGoal(e.target.value)} style={inputStyle} />
                  </div>
                </div>
              </div>

            </div>

            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '24px', padding: '14px', fontSize: '15px' }}>
              <Rocket size={18} /> Créer mon Profil &amp; Initialiser le Studio
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
