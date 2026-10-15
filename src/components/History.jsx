import React, { useState } from 'react'
import { useStore } from '../store'
import { XCircle, CheckCircle2, Play, FileText, BarChart2, Search, Folder, Download, CheckCircle, BarChart3 } from 'lucide-react'

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, backgroundColor: '#eee', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: '12px', minWidth: '32px', textAlign: 'right' }}>{pct}%</span>
    </div>
  )
}

export default function History() {
  const { data } = useStore()
  const [filter, setFilter] = useState('all')

  // --- STATS ---
  const totalQuotes = data.quotes.filter(q => q.status !== 'draft').length // hors brouillons
  const inProgressQuotes = data.quotes.filter(q => {
    if (q.status !== 'accepted') return false
    const proj = data.projects.find(p => p.quoteId === q.id)
    return !proj || proj.status !== 'completed'
  }).length
  const completedQuotes = data.quotes.filter(q => {
    if (q.status !== 'accepted') return false
    const proj = data.projects.find(p => p.quoteId === q.id)
    return proj?.status === 'completed'
  }).length
  const cancelledQuotes = data.quotes.filter(q => q.status === 'cancelled').length
  const acceptedQuotes = inProgressQuotes + completedQuotes
  const conversionRate = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0

  const totalRevenueSigned = data.quotes
    .filter(q => q.status === 'accepted')
    .reduce((acc, q) => acc + q.total, 0)

  const completedProjects = data.projects.filter(p => p.status === 'completed')
  const activeProjects = data.projects.filter(p => p.status === 'in_progress' && data.quotes.find(q => q.id === p.quoteId)?.status === 'accepted')

  // --- CANCEL REASONS STATS ---
  const cancelReasons = {}
  data.quotes.filter(q => q.status === 'cancelled' && q.cancelReason).forEach(q => {
    const reason = q.cancelReason.split(' - ')[0]
    cancelReasons[reason] = (cancelReasons[reason] || 0) + 1
  })
  const maxCancelCount = Math.max(...Object.values(cancelReasons), 1)

  // --- FILTER DATA ---
  const filteredQuotes = data.quotes.filter(q => {
    if (q.status === 'draft') return false // hide drafts, they're in the Devis tab
    if (filter === 'inprogress') {
      if (q.status !== 'accepted') return false
      const proj = data.projects.find(p => p.quoteId === q.id)
      return !proj || proj.status !== 'completed'
    }
    if (filter === 'completed') {
      if (q.status !== 'accepted') return false
      const proj = data.projects.find(p => p.quoteId === q.id)
      return proj?.status === 'completed'
    }
    if (filter === 'cancelled') return q.status === 'cancelled'
    return q.status !== 'draft'
  })

  const getStatusStyle = (quote) => {
    if (quote.status === 'cancelled') return { text: 'Annulé / Refusé', icon: <XCircle size={12} color="#fff" />, bg: '#9CA3AF', color: '#fff' }
    if (quote.status === 'accepted') {
      const linkedProject = data.projects.find(p => p.quoteId === quote.id)
      if (linkedProject?.status === 'completed') {
        return { text: 'Terminé & Facturé', icon: <CheckCircle size={12} color="#fff" />, bg: '#8B5CF6', color: '#fff' }
      }
      return { text: 'En cours', icon: <Play size={12} color="#fff" />, bg: 'var(--color-success)', color: '#fff' }
    }
    return { text: 'Brouillon', icon: <FileText size={12} color="#fff" />, bg: 'var(--color-warning)', color: '#fff' }
  }

  const exportHistoryCSV = () => {
    const headers = ['Client', 'Montant HT (€)', 'Statut', 'Motif Annulation']
    const rows = filteredQuotes.map(q => {
      const st = getStatusStyle(q)
      return [
        q.client,
        q.total,
        st.text,
        q.cancelReason || ''
      ]
    })
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Historique_Commercial_${filter}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <BarChart3 size={26} color="#0ea5e9" /> Historique & Statistiques
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Vue d'ensemble de toute votre activité commerciale.</p>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Devis Total</p>
          <div style={{ fontSize: '36px', fontWeight: 700 }}>{totalQuotes}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Taux de Conversion</p>
          <div style={{ fontSize: '36px', fontWeight: 700, color: conversionRate >= 50 ? 'var(--color-success)' : 'var(--color-warning)' }}>{conversionRate}%</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>CA Signé (HT)</p>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-success)' }}>{totalRevenueSigned.toLocaleString()} €</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Projets Terminés</p>
          <div style={{ fontSize: '36px', fontWeight: 700 }}>{completedProjects.length}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Projets en Cours</p>
          <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-warning)' }}>{activeProjects.length}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Devis Annulés</p>
          <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-danger)' }}>{cancelledQuotes}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '40px' }}>
        {/* CONVERSION FUNNEL */}
        <div className="card">
          <h2 style={{ fontSize: '16px', marginTop: 0, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} color="#0ea5e9" /> Entonnoir Commercial
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span>Total devis émis</span><strong>{totalQuotes}</strong>
              </div>
              <MiniBar value={totalQuotes} max={totalQuotes} color="#6B7280" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} /> Acceptés / Signés
                </span>
                <strong>{acceptedQuotes}</strong>
              </div>
              <MiniBar value={acceptedQuotes} max={totalQuotes} color="var(--color-success)" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <XCircle size={14} style={{ color: 'var(--color-danger)' }} /> Annulés / Refusés
                </span>
                <strong>{cancelledQuotes}</strong>
              </div>
              <MiniBar value={cancelledQuotes} max={totalQuotes} color="var(--color-danger)" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} style={{ color: '#8B5CF6' }} /> Projets terminés & facturés
                </span>
                <strong>{completedProjects.length}</strong>
              </div>
              <MiniBar value={completedProjects.length} max={totalQuotes} color="#8B5CF6" />
            </div>
          </div>
        </div>

        {/* CANCEL REASONS */}
        <div className="card">
          <h2 style={{ fontSize: '16px', marginTop: 0, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} color="#0ea5e9" /> Motifs d'annulation
          </h2>
          {Object.keys(cancelReasons).length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Aucun devis annulé pour le moment.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(cancelReasons).map(([reason, count]) => (
                <div key={reason}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span>{reason}</span><strong>{count}</strong>
                  </div>
                  <MiniBar value={count} max={maxCancelCount} color="var(--color-danger)" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FULL HISTORY TABLE */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Folder size={18} color="#f59e0b" /> Historique complet des Devis
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={exportHistoryCSV} style={{ fontSize: '13px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} color="#3b82f6" /> Exporter Excel/CSV
            </button>
            {[['all', 'Tous'], ['inprogress', 'En cours'], ['completed', 'Terminés'], ['cancelled', 'Annulés']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} className="btn btn-secondary" style={{
                fontSize: '13px', padding: '6px 14px',
                backgroundColor: filter === val ? 'var(--text-main)' : 'transparent',
                color: filter === val ? '#fff' : 'var(--text-main)',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredQuotes.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Aucun devis trouvé.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Client</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Montant HT</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Statut</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Motif d'annulation</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map(quote => {
                const st = getStatusStyle(quote)
                const linkedProject = data.projects.find(p => p.quoteId === quote.id)
                return (
                  <tr key={quote.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <strong>{quote.client}</strong>
                      {linkedProject && <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>→ {linkedProject.name}</span>}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>{quote.total?.toLocaleString()} €</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', backgroundColor: st.bg, color: st.color }}>
                        {st.icon}
                        <span>{st.text}</span>
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--color-danger)' }}>
                      {quote.cancelReason || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
