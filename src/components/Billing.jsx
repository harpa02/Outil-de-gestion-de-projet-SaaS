import React, { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import InvoicePrintView from './InvoicePrintView'
import { Receipt, Plus, Printer, Trash2, Loader2, ShieldCheck, AlertCircle, Percent, Filter, RotateCcw } from 'lucide-react'
import { ROLES } from '../roleUtils'

const inputStyle = { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', boxSizing: 'border-box', background: 'var(--bg-color)', color: 'var(--text-main)' }
const STATUS = [
  { value: 'pending', label: 'En attente', bg: '#fef3c7', color: '#b45309' },
  { value: 'paid', label: 'Payée', bg: '#dcfce7', color: '#15803d' },
  { value: 'overdue', label: 'En retard', bg: '#fee2e2', color: '#b91c1c' },
]

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Date : récente → ancienne' },
  { value: 'date-asc', label: 'Date : ancienne → récente' },
  { value: 'client-asc', label: 'Client : A → Z' },
  { value: 'amount-asc', label: 'Montant : croissant' },
  { value: 'amount-desc', label: 'Montant : décroissant' },
]

const EMPTY_FORM = () => ({
  clientId: '',
  description: '',
  amountHT: '',
  status: 'pending',
  paymentMethod: 'Virement',
  date: new Date().toISOString().slice(0, 10),
})
const EMPTY_FILTERS = { clientId: '', status: '' }

export default function Billing() {
  const { user, clients, invoices, company, fetchClients, fetchInvoices, createInvoice, updateInvoiceStatus, approveInvoice, deleteInvoice } = useStore()
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [printing, setPrinting] = useState(null)
  const [approvingId, setApprovingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sort, setSort] = useState('date-desc')

  const canValidate = user?.role === ROLES.CEO || user?.role === ROLES.MANAGER
  const vatRate = Number(company?.vatRate ?? 20)
  const ttc = (invoice) => Number(invoice.totalTTC ?? (Number(invoice.amountHT || 0) + Number(invoice.amountHT || 0) * (Number(invoice.vatRate || 0) / 100)))

  useEffect(() => { Promise.all([fetchClients(), fetchInvoices()]).finally(() => setLoading(false)) }, [fetchClients, fetchInvoices])

  const handleCreate = async (e) => {
    e.preventDefault()
    await createInvoice(form)
    setShowNew(false)
    setForm(EMPTY_FORM())
  }

  const handleApprove = async (id) => {
    setApprovingId(id)
    try { await approveInvoice(id) } finally { setApprovingId(null) }
  }

  const visibleInvoices = useMemo(() => {
    const filtered = invoices.filter(invoice => {
      if (filters.clientId && String(invoice.clientId) !== filters.clientId) return false
      if (filters.status && invoice.status !== filters.status) return false
      return true
    })

    return filtered.sort((a, b) => {
      switch (sort) {
        case 'client-asc':
          return String(a.clientName || '').localeCompare(String(b.clientName || ''), 'fr', { sensitivity: 'base' })
        case 'date-asc':
          return new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)
        case 'amount-asc':
          return ttc(a) - ttc(b)
        case 'amount-desc':
          return ttc(b) - ttc(a)
        case 'date-desc':
        default:
          return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
      }
    })
  }, [invoices, filters, sort])

  if (printing) return <InvoicePrintView invoice={printing} company={company} onClose={() => setPrinting(null)} />
  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 size={28} className="animate-spin" color="var(--accent)" /></div>

  // Les totaux portent sur toutes les factures, pas seulement la sélection filtrée.
  const totalHT = invoices.reduce((s, i) => s + Number(i.amountHT || 0), 0)
  const totalTTC = invoices.reduce((s, i) => s + ttc(i), 0)
  const hasFilters = Boolean(filters.clientId || filters.status)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}><Receipt size={26} color="var(--accent)" /> Facturation</h1>
        <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowNew(true)}>
          <Plus size={16} /> Nouvelle facture
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card"><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total HT</div><div style={{ fontSize: '22px', fontWeight: 700 }}>{totalHT.toLocaleString('fr-FR')} €</div></div>
        <div className="card"><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total TTC</div><div style={{ fontSize: '22px', fontWeight: 700 }}>{totalTTC.toLocaleString('fr-FR')} €</div></div>
        <div className="card"><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Factures</div><div style={{ fontSize: '22px', fontWeight: 700 }}>{invoices.length}</div></div>
        <div className="card"><div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}><Percent size={13} /> TVA entreprise</div><div style={{ fontSize: '22px', fontWeight: 700 }}>{vatRate} %</div></div>
      </div>

      {showNew && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0 }}>Nouvelle facture</h3>
          {user?.role === ROLES.EMPLOYEE && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 13, marginBottom: 12 }}>
              <AlertCircle size={16} /> La facture sera visible mais devra être validée par un manager / CEO avant lancement.
            </div>
          )}
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Client *</label>
                {clients.length === 0 ? <p style={{ color: '#b45309', margin: 0 }}>Ajoutez d'abord un client.</p> : (
                  <select style={inputStyle} required value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                    <option value="">Sélectionner...</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Date</label>
                <input style={inputStyle} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Description</label>
              <input style={inputStyle} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Montant HT (€) *</label><input style={inputStyle} type="number" step="0.01" min="0" required value={form.amountHT} onChange={e => setForm({ ...form, amountHT: e.target.value })} /></div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>TVA (%) — globale</label>
                <div style={{ ...inputStyle, background: 'var(--bg-color)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>{vatRate} %</div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Modifiable par le CEO dans l'onglet Entreprises.</span>
              </div>
              <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Statut de paiement</label>
                <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowNew(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={!form.clientId}>Créer</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Filter size={16} color="var(--accent)" />
          <strong style={{ fontSize: 14 }}>Tris et filtres</strong>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-secondary)' }}>
            {visibleInvoices.length} facture(s) affichée(s) sur {invoices.length}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Trier par</label>
            <select style={inputStyle} value={sort} onChange={e => setSort(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Client</label>
            <select style={inputStyle} value={filters.clientId} onChange={e => setFilters({ ...filters, clientId: e.target.value })}>
              <option value="">Tous les clients</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Statut</label>
            <select style={inputStyle} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">Tous les statuts</option>
              {STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => setFilters(EMPTY_FILTERS)} disabled={!hasFilters} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34 }}>
            <RotateCcw size={14} /> Réinitialiser
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
              <th style={{ padding: '14px' }}>Réf.</th>
              <th style={{ padding: '14px' }}>Client</th>
              <th style={{ padding: '14px' }}>Description</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>HT</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>TTC</th>
              <th style={{ padding: '14px' }}>Paiement</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleInvoices.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Aucune facture pour ces critères.</td></tr>
            ) : visibleInvoices.map(inv => {
              const st = STATUS.find(s => s.value === inv.status) || STATUS[0]
              const pending = inv.approvalStatus === 'pending'
              return (
                <tr key={inv._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '14px', verticalAlign: 'top' }}>
                  <td style={{ padding: '14px', fontWeight: 600 }}>{inv.ref}</td>
                  <td style={{ padding: '14px' }}>{inv.clientName}</td>
                  <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                    <div>{inv.description}</div>
                    {pending && (
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginTop: 6, padding: '4px 8px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 12 }}>
                        <AlertCircle size={13} /> En attente de validation par un manager / CEO
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right' }}>{Number(inv.amountHT || 0).toLocaleString('fr-FR')} €</td>
                  <td style={{ padding: '14px', textAlign: 'right', fontWeight: 600 }}>{ttc(inv).toLocaleString('fr-FR')} €</td>
                  <td style={{ padding: '14px' }}>
                    <select value={inv.status} onChange={e => updateInvoiceStatus(inv._id, e.target.value)} style={{ padding: '4px 8px', borderRadius: '99px', border: '1px solid #e5e7eb', fontSize: '12px', fontWeight: 600, backgroundColor: st.bg, color: st.color }}>
                      {STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {pending && canValidate && (
                        <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => handleApprove(inv._id)} disabled={approvingId === inv._id} title="Valider">
                          {approvingId === inv._id ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />} Valider
                        </button>
                      )}
                      <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => setPrinting(inv)} title="Imprimer"><Printer size={14} /></button>
                      <button className="btn btn-secondary" style={{ padding: '6px', color: '#b91c1c' }} onClick={() => deleteInvoice(inv._id)} title="Supprimer"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
