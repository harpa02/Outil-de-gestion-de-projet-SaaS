import React, { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import { Users, Plus, Trash2, Pencil, X, Check, User, Mail, MapPin, Loader2, Receipt, Eye } from 'lucide-react'

const inputStyle = {
  width: '100%',
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  fontSize: '13px',
  backgroundColor: 'var(--card-bg)',
  color: 'var(--text-main)',
  boxSizing: 'border-box'
}
const badge = (bg, color) => ({ display: 'inline-block', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', backgroundColor: bg, color })

export default function Clients() {
  const { clients, invoices, fetchClients, fetchInvoices, createClient, updateClient, deleteClient } = useStore()
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', address: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ companyName: '', contactName: '', email: '', address: '' })
  const [selected, setSelected] = useState(null)

  useEffect(() => { Promise.all([fetchClients(), fetchInvoices()]).finally(() => setLoading(false)) }, [fetchClients, fetchInvoices])

  const handleSave = async (e) => {
    e.preventDefault()
    await createClient(form)
    setShowNew(false)
    setForm({ companyName: '', contactName: '', email: '', address: '' })
  }

  const startEdit = (c) => {
    setEditingId(c._id)
    setEditForm({ companyName: c.companyName || '', contactName: c.contactName || '', email: c.email || '', address: c.address || '' })
  }

  const handleUpdate = async (e, id) => {
    e.preventDefault()
    await updateClient(id, editForm)
    setEditingId(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce client ?')) return
    await deleteClient(id)
  }

  const ttc = (i) => Number(i.amountHT || 0) + Number(i.amountHT || 0) * (Number(i.vatRate || 0) / 100)
  const fiche = useMemo(() => {
    if (!selected) return null
    const ci = invoices
      .filter(i => String(i.clientId) === String(selected._id))
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
    const stats = {
      pendingTTC: ci.filter(i => i.status === 'pending').reduce((s, i) => s + ttc(i), 0),
      paidTTC: ci.filter(i => i.status === 'paid').reduce((s, i) => s + ttc(i), 0),
      overdueTTC: ci.filter(i => i.status === 'overdue').reduce((s, i) => s + ttc(i), 0),
    }
    return { invoices: ci, stats }
  }, [selected, invoices])

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 size={28} className="animate-spin" color="#10b981" /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Users size={26} color="#10b981" /> Clients
        </h1>
        <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowNew(true)}>
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      {showNew && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0 }}>Ajouter un client</h3>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Entreprise *</label>
                <input style={inputStyle} required value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Contact</label>
                <input style={inputStyle} value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>E-mail</label>
              <input type="email" style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="nom@entreprise.fr" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Adresse</label>
              <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowNew(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Aucun client pour le moment.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {clients.map(c => {
            const editing = editingId === c._id
            return (
              <div key={c._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {editing ? (
                  <form onSubmit={(e) => handleUpdate(e, c._id)} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input style={inputStyle} required value={editForm.companyName} onChange={e => setEditForm({ ...editForm, companyName: e.target.value })} placeholder="Entreprise" />
                    <input style={inputStyle} value={editForm.contactName} onChange={e => setEditForm({ ...editForm, contactName: e.target.value })} placeholder="Contact" />
                    <input style={inputStyle} type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="E-mail" />
                    <textarea style={{ ...inputStyle, minHeight: '48px' }} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} placeholder="Adresse" />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => setEditingId(null)}><X size={14} /></button>
                      <button type="submit" className="btn btn-primary" style={{ padding: '6px 10px' }}><Check size={14} /></button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h3 style={{ margin: 0 }}>{c.companyName}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', flex: 1 }}>
                      {c.contactName && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} color="#8c857b" /> {c.contactName}</div>}
                      {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} color="#8c857b" /> {c.email}</div>}
                      {c.address && <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-secondary)' }}><MapPin size={14} color="#8c857b" style={{ marginTop: 2 }} /> <span>{c.address}</span></div>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setSelected(c)}><Eye size={14} /> Fiche</button>
                      <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => startEdit(c)} title="Modifier"><Pencil size={14} /></button>
                      <button className="btn btn-secondary" style={{ padding: '6px', color: '#ef4444' }} onClick={() => handleDelete(c._id)} title="Supprimer"><Trash2 size={14} /></button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selected && fiche && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: '0 0 6px' }}>{selected.companyName}</h2>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selected.contactName && <span><User size={13} /> {selected.contactName}</span>}
                  {selected.email && <a href={`mailto:${selected.email}`} style={{ color: 'inherit' }}><Mail size={13} /> {selected.email}</a>}
                  {selected.address && <span><MapPin size={13} /> {selected.address}</span>}
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              <div className="card" style={{ padding: '12px' }}><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>En attente (TTC)</div><div style={{ fontWeight: 700 }}>{fiche.stats.pendingTTC.toLocaleString('fr-FR')} €</div></div>
              <div className="card" style={{ padding: '12px' }}><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Payé (TTC)</div><div style={{ fontWeight: 700, color: '#15803d' }}>{fiche.stats.paidTTC.toLocaleString('fr-FR')} €</div></div>
              <div className="card" style={{ padding: '12px' }}><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>En retard (TTC)</div><div style={{ fontWeight: 700, color: '#b91c1c' }}>{fiche.stats.overdueTTC.toLocaleString('fr-FR')} €</div></div>
            </div>

            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><Receipt size={18} /> Factures</h3>
            {fiche.invoices.length === 0 ? <div style={{ color: 'var(--text-secondary)' }}>Aucune facture.</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {fiche.invoices.map(inv => {
                  const invLabel = { pending: 'En attente', paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée' }[inv.status] || inv.status
                  return (
                    <div key={inv._id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <span><strong>{inv.ref}</strong> · {inv.description}</span>
                      <span>{ttc(inv).toLocaleString('fr-FR')} € TTC · <span style={badge(inv.status === 'paid' ? '#dcfce7' : inv.status === 'overdue' ? '#fee2e2' : '#fef3c7', inv.status === 'paid' ? '#15803d' : inv.status === 'overdue' ? '#b91c1c' : '#b45309')}>{invLabel}</span></span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
