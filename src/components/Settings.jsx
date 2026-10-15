import React, { useState, useRef } from 'react'
import { useStore } from '../store'
import { Settings as SettingsIcon } from 'lucide-react'

export default function Settings() {
  const { data, updateSettings, updatePacks, updateVehicleOptions, importAllData } = useStore()
  const [form, setForm] = useState(data.settings)
  const [saved, setSaved] = useState(false)

  const [packs, setPacks] = useState(data.packs || [])
  const [vehicleOptions, setVehicleOptions] = useState(data.vehicleOptions || [])

  const [newPackName, setNewPackName] = useState('')
  const [newPackRate, setNewPackRate] = useState(0)

  const [newOptName, setNewOptName] = useState('')
  const [newOptRate, setNewOptRate] = useState(0)

  const [printingPrices, setPrintingPrices] = useState(false)

  // —— Password change state ——
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState({ text: '', ok: false })

  const handleChangePassword = (e) => {
    e.preventDefault()
    const account = JSON.parse(localStorage.getItem('userAccount') || '{}')
    if (!account.password) { setPwdMsg({ text: 'Aucun compte trouvé.', ok: false }); return }
    if (account.password !== currentPwd) { setPwdMsg({ text: 'Mot de passe actuel incorrect.', ok: false }); return }
    if (newPwd.length < 6) { setPwdMsg({ text: 'Le nouveau mot de passe doit faire au moins 6 caractères.', ok: false }); return }
    if (newPwd !== confirmPwd) { setPwdMsg({ text: 'Les nouveaux mots de passe ne correspondent pas.', ok: false }); return }
    localStorage.setItem('userAccount', JSON.stringify({ ...account, password: newPwd }))
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    setPwdMsg({ text: 'Mot de passe modifié avec succès !', ok: true })
    setTimeout(() => setPwdMsg({ text: '', ok: false }), 4000)
  }

  // —— DB viewer state ——
  const [showDb, setShowDb] = useState(false)
  const [dbCopied, setDbCopied] = useState(false)

  const getFullDb = () => JSON.stringify(data, null, 2)

  const handleCopyDb = () => {
    navigator.clipboard.writeText(getFullDb()).then(() => {
      setDbCopied(true)
      setTimeout(() => setDbCopied(false), 2500)
    })
  }



  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `Sauvegarde_AgencyOS_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    document.body.removeChild(downloadAnchor)
  }

  const handleImportData = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        if (parsed.settings || parsed.quotes || parsed.receipts) {
          if (importAllData(parsed)) {
            alert("Sauvegarde importée avec succès ! Les données ont été rafraîchies.")
            window.location.reload()
          } else {
            alert("Erreur : le fichier de sauvegarde est invalide.")
          }
        } else {
          alert("Erreur : format de fichier non reconnu.")
        }
      } catch (err) {
        alert("Erreur lors de la lecture du fichier JSON.")
      }
    }
    reader.readAsText(file)
  }

  const handleSave = (e) => {
    e.preventDefault()
    updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = (event) => {
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
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL('image/jpeg', 0.8)
          setForm(prev => ({ ...prev, logo: compressed }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const exportPriceGridCSV = () => {
    const headers = ['Type', 'Nom Prestation / Option', 'Tarif (€)']
    const rows = [
      ...packs.map(p => ['Pack', p.name, p.rate]),
      ...vehicleOptions.map(o => ['Option', o.name, o.rate])
    ]
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Grille_Tarifaire_${form.companyName.replace(/\s+/g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (printingPrices) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', zIndex: 1000, overflowY: 'auto', padding: '40px' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setPrintingPrices(false)}>← Retour</button>
          <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimer / PDF</button>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'serif', color: '#111' }}>
          <div style={{ borderBottom: '2px solid #111', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '26px', margin: '0 0 8px 0' }}>GRILLE TARIFAIRE</h1>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}><strong>Entreprise :</strong> {form.companyName}</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}><strong>Date d'effet :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            {form.logo && <img src={form.logo} alt="Logo" style={{ maxHeight: '60px', maxWidth: '160px', objectFit: 'contain' }} />}
          </div>

          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Packs standardisés</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '32px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #111', backgroundColor: '#fcfcfc', textAlign: 'left' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Prestation / Pack</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', width: '150px' }}>Tarif HT</th>
              </tr>
            </thead>
            <tbody>
              {packs.map(p => (
                <tr key={p.id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{p.rate.toLocaleString('fr-FR')} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Options & Suppléments</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '40px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #111', backgroundColor: '#fcfcfc', textAlign: 'left' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Option / Ajustement</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', width: '150px' }}>Tarif HT</th>
              </tr>
            </thead>
            <tbody>
              {vehicleOptions.map(o => (
                <tr key={o.id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{o.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{o.rate.toLocaleString('fr-FR')} €</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ fontSize: '10px', color: '#555', marginTop: '60px', textAlign: 'center', fontStyle: 'italic' }}>
            Grille tarifaire indicative soumise aux conditions générales de vente.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', maxWidth: '900px' }}>
      <div>
        <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={26} color="#9ca3af" /> Paramètres & Tarifs
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Configurez vos informations légales et votre grille de tarifs.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Company Info Card */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Informations de l'Entreprise</h2>
          
          {/* Logo Uploader */}
          <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '6px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'white', flexShrink: 0 }}>
              {form.logo ? (
                <img src={form.logo} alt="Logo Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '24px', color: '#aaa' }}>📷</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Logo d'entreprise</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoChange} 
                style={{ fontSize: '12px', width: '100%' }} 
              />
              {form.logo && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ display: 'inline-block', fontSize: '11px', marginTop: '8px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '2px 8px' }}
                  onClick={() => setForm(prev => ({ ...prev, logo: '' }))}
                >
                  Supprimer le logo
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Nom de l'entreprise</label>
                <input 
                  type="text" 
                  value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>SIRET</label>
                <input 
                  type="text" 
                  value={form.siret}
                  onChange={e => setForm({ ...form, siret: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Forme juridique</label>
                <input 
                  type="text" 
                  value={form.legalForm || ''}
                  onChange={e => setForm({...form, legalForm: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                  placeholder="ex: Micro-entreprise"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Capital social (€)</label>
                <input 
                  type="text" 
                  value="0"
                  readOnly
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', boxSizing: 'border-box', backgroundColor: 'var(--bg-secondary, #f5f5f5)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Valeur automatique</span>
              </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Code NAF / APE</label>
                <input 
                  type="text" 
                  value={form.naf || ''}
                  onChange={e => setForm({...form, naf: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                  placeholder="ex: 7420Z"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Numéro TVA</label>
                <input 
                  type="text" 
                  value={form.vatIntra || ''}
                  onChange={e => setForm({...form, vatIntra: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                  placeholder="ex: FR12345678901"
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Adresse de facturation</label>
              <textarea 
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', minHeight: '60px', boxSizing: 'border-box' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Taux de TVA (%)</label>
                <input 
                  type="number" 
                  value={form.vatRate}
                  onChange={e => setForm({...form, vatRate: Number(e.target.value)})}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Objectif CA Annuel (€)</label>
                <input 
                  type="number" 
                  value={form.annualGoal || 20000}
                  onChange={e => setForm({...form, annualGoal: Number(e.target.value)})}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Assurance RC Pro (Nom de l'assureur et n° contrat)</label>
              <input 
                type="text"
                value={form.rcPro || ''}
                onChange={e => setForm({...form, rcPro: e.target.value})}
                placeholder="ex: AXA - Contrat n° 123456789 - Couverture France"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Enregistrer l'entreprise
            </button>
            
            {saved && <p style={{ color: 'var(--color-success)', marginTop: '12px', textAlign: 'center', fontSize: '13px' }}>Paramètres sauvegardés !</p>}
          </form>
        </div>

        {/* Pricing Grid Management Card */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ marginBottom: '8px', fontSize: '18px' }}>Gestion des Tarifs (Packs & Options)</h2>
          <p style={{ marginBottom: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Configurez vos prix standards et vos suppléments.
          </p>

          {/* Packs Section */}
          <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px' }}>Packs standardisés</h3>
          
          {packs.map((pack, idx) => (
            <div key={pack.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input 
                type="text" 
                value={pack.name}
                onChange={e => {
                  const newP = [...packs]
                  newP[idx].name = e.target.value
                  setPacks(newP)
                }}
                style={{ flex: 2, padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '13px' }}
              />
              <input 
                type="number" 
                value={pack.rate}
                onChange={e => {
                  const newP = [...packs]
                  newP[idx].rate = Number(e.target.value)
                  setPacks(newP)
                }}
                style={{ width: '70px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '13px' }}
              />
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '6px 10px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)', fontSize: '13px' }}
                onClick={() => setPacks(packs.filter(p => p.id !== pack.id))}
              >
                ❌
              </button>
            </div>
          ))}

          {/* Add Pack Form */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
            <input 
              type="text" 
              placeholder="Nouveau pack (ex: Pack Circuit)"
              value={newPackName}
              onChange={e => setNewPackName(e.target.value)}
              style={{ flex: 2, padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'white', fontSize: '12px' }}
            />
            <input 
              type="number" 
              placeholder="Prix (€)"
              value={newPackRate || ''}
              onChange={e => setNewPackRate(Number(e.target.value))}
              style={{ width: '70px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'white', fontSize: '12px' }}
            />
            <button 
              type="button" 
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 10px' }}
              onClick={() => {
                if (!newPackName) return
                setPacks([...packs, { id: 'p_' + Date.now(), name: newPackName, rate: newPackRate }])
                setNewPackName('')
                setNewPackRate(0)
              }}
            >
              +
            </button>
          </div>

          {/* Options Section */}
          <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px', marginTop: '20px' }}>Options & Suppléments</h3>

          {vehicleOptions.map((opt, idx) => (
            <div key={opt.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input 
                type="text" 
                value={opt.name}
                onChange={e => {
                  const newO = [...vehicleOptions]
                  newO[idx].name = e.target.value
                  setVehicleOptions(newO)
                }}
                style={{ flex: 2, padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '13px' }}
              />
              <input 
                type="number" 
                value={opt.rate}
                onChange={e => {
                  const newO = [...vehicleOptions]
                  newO[idx].rate = Number(e.target.value)
                  setVehicleOptions(newO)
                }}
                style={{ width: '70px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '13px' }}
              />
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '6px 10px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)', fontSize: '13px' }}
                onClick={() => setVehicleOptions(vehicleOptions.filter(o => o.id !== opt.id))}
              >
                ❌
              </button>
            </div>
          ))}

          {/* Add Option Form */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
            <input 
              type="text" 
              placeholder="Nouvelle option (ex: Option Drone)"
              value={newOptName}
              onChange={e => setNewOptName(e.target.value)}
              style={{ flex: 2, padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'white', fontSize: '12px' }}
            />
            <input 
              type="number" 
              placeholder="Prix (€)"
              value={newOptRate || ''}
              onChange={e => setNewOptRate(Number(e.target.value))}
              style={{ width: '70px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'white', fontSize: '12px' }}
            />
            <button 
              type="button" 
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 10px' }}
              onClick={() => {
                if (!newOptName) return
                setVehicleOptions([...vehicleOptions, { id: 'vo_' + Date.now(), name: newOptName, rate: newOptRate }])
                setNewOptName('')
                setNewOptRate(0)
              }}
            >
              +
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => {
                updatePacks(packs)
                updateVehicleOptions(vehicleOptions)
                alert("Grille tarifaire enregistrée avec succès !")
              }}
            >
              Enregistrer la Grille Tarifaire
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ fontSize: '12px' }}
                onClick={exportPriceGridCSV}
              >
                📥 Exporter CSV
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ fontSize: '12px' }}
                onClick={() => setPrintingPrices(true)}
              >
                🖨️ Imprimer Grille
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ——— SVG ICON HELPERS ——— */}
      {/* ——— PASSWORD SECTION ——— */}
      <div className="card" style={{ marginTop: '16px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Sécurité du Compte
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Modifiez votre mot de passe de connexion.</p>
        <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
          {[
            { label: 'Mot de passe actuel', val: currentPwd, set: setCurrentPwd, show: showCurrentPwd, toggle: () => setShowCurrentPwd(s => !s) },
            { label: 'Nouveau mot de passe', val: newPwd, set: setNewPwd, show: showNewPwd, toggle: () => setShowNewPwd(s => !s), hint: 'Min. 6 caractères' },
            { label: 'Confirmer le nouveau', val: confirmPwd, set: setConfirmPwd, show: showConfirmPwd, toggle: () => setShowConfirmPwd(s => !s) },
          ].map(({ label, val, set, show, toggle, hint }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  required
                  placeholder={hint || '••••••••'}
                  value={val}
                  onChange={e => set(e.target.value)}
                  style={{ width: '100%', padding: '9px 36px 9px 10px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={toggle} title={show ? 'Masquer' : 'Afficher'} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex', alignItems: 'center' }}>
                  {show
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>Changer le mot de passe</button>
            {pwdMsg.text && (
              <span style={{ fontSize: '13px', color: pwdMsg.ok ? 'var(--color-success, #2e7d32)' : 'var(--color-danger)', fontWeight: 500 }}>
                {pwdMsg.text}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ——— DATABASE SECTION ——— */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            Base de Données Locale
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setShowDb(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              {showDb
                ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg> Masquer</>
                : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Afficher</>
              }
            </button>
            <button className="btn btn-secondary" onClick={handleCopyDb} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              {dbCopied
                ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copié</>
                : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier JSON</>
              }
            </button>
            <button className="btn btn-secondary" onClick={handleExportData} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exporter .json
            </button>
            <label htmlFor="import-backup" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', margin: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Importer .json
              <input id="import-backup" type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: showDb ? '20px' : 0 }}>
          Visualisez l'intégralité de vos données. Exportez-les pour transférer l'application à quelqu'un.
        </p>

        {showDb && (() => {
          const sections = [
            { key: 'settings',       label: 'Paramètres Studio',    cols: ['companyName','address','siret','vatRate','annualGoal','legalForm'] },
            { key: 'clients',        label: 'Clients',               cols: ['name','email','phone','company','city'] },
            { key: 'quotes',         label: 'Devis',                 cols: ['ref','clientName','date','totalTTC','status'] },
            { key: 'receipts',       label: 'Recettes / Factures',   cols: ['ref','clientName','date','amountTTC','method','status'] },
            { key: 'expenses',       label: 'Charges',               cols: ['date','label','category','amountTTC'] },
            { key: 'mileage',        label: 'Kilométrage',           cols: ['date','destination','km','purpose'] },
            { key: 'projects',       label: 'Projets',               cols: ['name','clientName','status','startDate'] },
            { key: 'packs',          label: 'Packs Tarifaires',      cols: ['name','rate'] },
            { key: 'vehicleOptions', label: 'Options Véhicule',      cols: ['name','rate'] },
          ]

          const thStyle = {
            padding: '8px 12px',
            textAlign: 'left',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-secondary)',
            borderBottom: '2px solid var(--border-color)',
            whiteSpace: 'nowrap',
            backgroundColor: 'var(--bg-color)',
          }
          const tdStyle = {
            padding: '8px 12px',
            fontSize: '12.5px',
            color: 'var(--text-main)',
            borderBottom: '1px solid var(--border-color)',
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }
          const badgeStyle = (v) => ({
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '99px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: v === 'Payé' || v === 'Accepté' || v === 'Terminé' ? '#e8f5e9' : v === 'En attente' || v === 'En cours' ? '#fff8e1' : '#f5f5f5',
            color: v === 'Payé' || v === 'Accepté' || v === 'Terminé' ? '#2e7d32' : v === 'En attente' || v === 'En cours' ? '#f57f17' : '#616161',
          })

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {sections.map(({ key, label, cols }) => {
                const raw = data[key]
                // handle settings (object) vs arrays
                const rows = Array.isArray(raw) ? raw : (raw ? [raw] : [])
                const count = rows.length

                return (
                  <div key={key}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{label}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '99px', padding: '1px 8px' }}>
                        {count} enregistrement{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {count === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>Aucune donnée</p>
                    ) : (
                      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                          <thead>
                            <tr>
                              <th style={{ ...thStyle, width: '36px' }}>#</th>
                              {cols.map(c => <th key={c} style={thStyle}>{c}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, i) => (
                              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                                <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '11px' }}>{i + 1}</td>
                                {cols.map(c => {
                                  const v = row[c]
                                  const display = v === undefined || v === null || v === '' ? <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>—</span>
                                    : typeof v === 'boolean' ? (v ? 'Oui' : 'Non')
                                    : c === 'status' ? <span style={badgeStyle(v)}>{v}</span>
                                    : c === 'logo' ? <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>[image base64]</span>
                                    : typeof v === 'object' ? JSON.stringify(v).substring(0, 50) + '…'
                                    : String(v)
                                  return <td key={c} style={tdStyle} title={typeof v === 'string' ? v : ''}>{display}</td>
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

    </div>
  )
}

