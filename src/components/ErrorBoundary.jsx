import React from 'react'
import { AlertTriangle, RotateCcw, LogOut } from 'lucide-react'

/**
 * Évite l'écran blanc en cas d'erreur de rendu non prévue.
 * Offre un rechargement simple et une réinitialisation complète de la session
 * (utile notamment après une suppression de la base Mongo).
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Erreur de rendu :', error, info)
  }

  resetSession = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('company')
    window.location.assign('/login')
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-main)',
        fontFamily: 'inherit',
      }}>
        <div className="card" style={{ maxWidth: '520px', width: '100%', textAlign: 'center', padding: '32px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fef2f2', color: '#dc2626',
          }}>
            <AlertTriangle size={28} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Une erreur est survenue</h2>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-secondary)' }}>
            L'application n'a pas pu afficher cette page. Si vous venez de réinitialiser la base de données,
            réinitialisez votre session puis créez à nouveau un compte.
          </p>
          <details style={{ textAlign: 'left', marginBottom: '20px', fontSize: 12, color: 'var(--text-secondary)' }}>
            <summary style={{ cursor: 'pointer' }}>Détails techniques</summary>
            <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', marginTop: 8 }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </details>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <RotateCcw size={15} /> Recharger
            </button>
            <button className="btn btn-secondary" onClick={this.resetSession} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <LogOut size={15} /> Réinitialiser la session
            </button>
          </div>
        </div>
      </div>
    )
  }
}
