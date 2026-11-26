import React from 'react'

export default function InvoicePrintView({ invoice, company, onClose }) {
  const amountHT = Number(invoice.amountHT || 0)
  const vatRate = Number(invoice.vatRate || 0)
  const vatAmount = amountHT * (vatRate / 100)
  const totalTTC = amountHT + vatAmount

  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-print-area')
    if (window.html2pdf) window.html2pdf().from(element).save(`Facture_${invoice.ref}.pdf`)
    else alert('Génération PDF indisponible.')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1000, overflowY: 'auto' }}>
      <div className="no-print" style={{ padding: '16px 24px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={onClose}>Retour</button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>Imprimer</button>
          <button className="btn btn-primary" onClick={handleDownloadPDF}>Télécharger PDF</button>
        </div>
      </div>

      <div id="invoice-print-area" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', color: '#111' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px' }}>{company?.name || 'Entreprise'}</h1>
            {company?.description && <p style={{ margin: 0, color: '#555' }}>{company.description}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '40px', color: '#e5e7eb' }}>FACTURE</h2>
            <p style={{ margin: '4px 0 0', fontWeight: 600 }}>N° {invoice.ref}</p>
            <p style={{ margin: 0, color: '#555' }}>Date : {new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px', padding: '14px', border: '1px solid #eee', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Facturé à</div>
            <div style={{ fontWeight: 600 }}>{invoice.clientName}</div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}><strong>Description :</strong> {invoice.description}</div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #111' }}>
              <th style={{ textAlign: 'left', padding: '10px 6px' }}>Désignation</th>
              <th style={{ textAlign: 'right', padding: '10px 6px' }}>Montant HT</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px 6px' }}>{invoice.description}</td>
              <td style={{ padding: '12px 6px', textAlign: 'right' }}>{amountHT.toLocaleString('fr-FR')} €</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span>Total HT</span><span>{amountHT.toLocaleString('fr-FR')} €</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}><span>TVA ({vatRate}%)</span><span>{vatAmount.toLocaleString('fr-FR')} €</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 700, fontSize: '18px' }}><span>Total TTC</span><span>{totalTTC.toLocaleString('fr-FR')} €</span></div>
          </div>
        </div>

        <p style={{ marginTop: '48px', fontSize: '12px', color: '#666' }}>Mode de règlement : {invoice.paymentMethod || 'Virement'} · Statut : {{ pending: 'En attente', paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée' }[invoice.status] || invoice.status}</p>
      </div>
    </div>
  )
}
