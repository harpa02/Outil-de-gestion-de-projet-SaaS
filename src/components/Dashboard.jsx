import React, { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { Briefcase, CheckCircle2, AlertTriangle, Receipt, Calendar, ArrowUpRight, Wallet, Clock } from 'lucide-react'

const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} €`
const dateFmt = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
const ttc = (i) => Number(i.amountHT || 0) * (1 + Number(i.vatRate || 0) / 100)

const invStatus = {
  pending: { label: 'En attente', color: '#b45309', bg: '#fef3c7' },
  paid: { label: 'Payée', color: '#15803d', bg: '#dcfce7' },
  overdue: { label: 'En retard', color: '#b91c1c', bg: '#fee2e2' },
}
const projStatus = {
  planning: { label: 'Planification', color: '#374151', bg: '#f3f4f6' },
  in_progress: { label: 'En cours', color: '#b45309', bg: '#fef3c7' },
  completed: { label: 'Terminé', color: '#15803d', bg: '#dcfce7' },
  archived: { label: 'Archivé', color: '#6b7280', bg: '#f3f4f6' },
}
const priority = { urgent: { label: 'Urgent', color: '#b91c1c' }, high: { label: 'Élevé', color: '#c2410c' }, medium: { label: 'Moyen', color: '#1d4ed8' }, low: { label: 'Bas', color: '#6b7280' } }

function Stat({ icon: Icon, label, value, detail, tone }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value}</div>
          {detail && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>{detail}</div>}
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${tone}14`, color: tone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} /></div>
      </div>
    </div>
  )
}

function Section({ title, action, children }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>{title}</h3>
        {action}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

export default function Dashboard() {
  const { company, user, projects, tasks, invoices, fetchProjects, fetchUsers, fetchTasks, fetchInvoices } = useStore()

  useEffect(() => {
    fetchProjects().catch(() => {})
    fetchUsers().catch(() => {})
    fetchTasks().catch(() => {})
    fetchInvoices().catch(() => {})
  }, [fetchProjects, fetchUsers, fetchTasks, fetchInvoices])

  const data = useMemo(() => {
    const now = new Date()
    const startToday = new Date(now); startToday.setHours(0, 0, 0, 0)
    const endWeek = new Date(startToday); endWeek.setDate(endWeek.getDate() + 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const isOverdue = (t) => t.dueDate && t.status !== 'done' && (d => (d.setHours(0, 0, 0, 0), d < startToday))(new Date(t.dueDate))
    const isWeek = (t) => t.dueDate && t.status !== 'done' && (d => (d.setHours(0, 0, 0, 0), d >= startToday && d < endWeek))(new Date(t.dueDate))
    const isUrgent = (t) => t.status !== 'done' && (t.priority === 'urgent' || isOverdue(t))

    const openTasks = tasks.filter(t => t.status !== 'done')
    const overdueTasks = openTasks.filter(isOverdue)
    const weekTasks = openTasks.filter(isWeek)
    const urgentCount = openTasks.filter(isUrgent).length
    const completion = tasks.length ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0

    const paidMonth = invoices.filter(i => i.status === 'paid' && ((d) => d >= monthStart && d < monthEnd)(new Date(i.date || i.createdAt))).reduce((s, i) => s + ttc(i), 0)
    const toBill = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + ttc(i), 0)
    const sums = {
      paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + ttc(i), 0),
      pending: invoices.filter(i => i.status === 'pending').reduce((s, i) => s + ttc(i), 0),
      overdue: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + ttc(i), 0),
    }
    const invTotal = sums.paid + sums.pending + sums.overdue
    const recentInvoices = [...invoices].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).slice(0, 4)

    const attentionTasks = openTasks
      .filter(t => isUrgent(t) || isWeek(t))
      .sort((a, b) => (Number(isUrgent(b)) - Number(isUrgent(a))) || (new Date(a.dueDate || '9999') - new Date(b.dueDate || '9999')))
    const byProject = new Map()
    attentionTasks.forEach(t => {
      const pid = t.projectId?._id || t.projectId?.toString?.() || t.projectId || 'none'
      if (!byProject.has(pid)) byProject.set(pid, [])
      byProject.get(pid).push(t)
    })

    const projectCards = projects.map(p => {
      const pid = p._id?.toString?.() || p._id
      const ptasks = attentionTasks.filter(t => (t.projectId?._id || t.projectId?.toString?.() || t.projectId) === pid)
      const hasUrgent = ptasks.some(isUrgent)
      const hasOverdue = ptasks.some(isOverdue)
      return { ...p, attention: ptasks.slice(0, 3), hasUrgent, hasOverdue }
    }).sort((a, b) => (Number(b.hasUrgent || b.hasOverdue) - Number(a.hasUrgent || a.hasOverdue)) || (new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)))

    const noProject = (byProject.get('none') || []).slice(0, 4)
    return { openTasks: openTasks.length, overdueTasks: overdueTasks.length, weekTasks: weekTasks.length, urgentCount, completion, activeProjects: projects.filter(p => p.status === 'in_progress').length, paidMonth, toBill, sums, invTotal, recentInvoices, projectCards: projectCards.slice(0, 6), noProject }
  }, [projects, tasks, invoices])

  const firstName = user?.firstName?.trim() || user?.name?.trim().split(/\s+/)[0] || user?.email?.split('@')[0] || 'Utilisateur'
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'capitalize' }}>{today}</div>
          <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.1 }}>Bonjour, {firstName}</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>{company?.name || 'Votre espace'} · vue d&apos;ensemble de l&apos;activité</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/projects" className="btn btn-secondary">Projets</Link>
          <Link to="/billing" className="btn btn-primary">Facturation</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <Stat icon={Briefcase} label="Projets actifs" value={data.activeProjects} detail={`${projects.length} au total`} tone="#0f766e" />
        <Stat icon={CheckCircle2} label="Tâches ouvertes" value={data.openTasks} detail={`${data.completion}% complétées`} tone="#2563eb" />
        <Stat icon={AlertTriangle} label="Urgent / en retard" value={data.urgentCount} detail={`${data.overdueTasks} en retard`} tone="#dc2626" />
        <Stat icon={Clock} label="Cette semaine" value={data.weekTasks} detail="Échéances proches" tone="#b45309" />
        <Stat icon={Receipt} label="À facturer" value={fmt(data.toBill)} detail="En attente + retard" tone="#7c3aed" />
        <Stat icon={Wallet} label="Encaissé ce mois" value={fmt(data.paidMonth)} detail="Factures payées" tone="#15803d" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)', gap: 20 }}>
        <Section title="Projets & à traiter" action={<Link to="/kanban" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>Kanban <ArrowUpRight size={14} /></Link>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.projectCards.length === 0 && <p style={{ margin: 0 }}>Aucun projet.</p>}
            {data.projectCards.map(p => {
              const st = projStatus[p.status] || projStatus.planning
              const urgent = p.hasUrgent || p.hasOverdue
              return (
                <div key={p._id} style={{ padding: 16, border: `1px solid ${urgent ? '#fecaca' : 'var(--border-color)'}`, borderRadius: 12, background: urgent ? '#fff7f7' : 'var(--card-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                        {urgent && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#fee2e2', color: '#b91c1c' }}>{p.hasOverdue ? 'En retard' : 'Urgent'}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{p.completedTasks || 0}/{p.totalTasks || 0} tâches</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div style={{ marginTop: 10, height: 7, background: '#eef2f7', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${p.progress || 0}%`, height: '100%', background: urgent ? '#dc2626' : 'var(--accent)' }} />
                  </div>
                  {p.attention.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {p.attention.map(t => {
                        const pr = priority[t.priority] || priority.medium
                        const d = t.dueDate ? new Date(t.dueDate) : null
                        if (d) d.setHours(0, 0, 0, 0)
                        const today = new Date(); today.setHours(0, 0, 0, 0)
                        const overdue = d && d < today && t.status !== 'done'
                        return (
                          <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, padding: '8px 10px', borderRadius: 8, background: overdue || t.priority === 'urgent' ? '#fff' : '#f8fafc', border: '1px solid #edf2f7' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t.title}</div>
                              <div style={{ fontSize: 12, color: pr.color, marginTop: 2 }}>{pr.label}</div>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: overdue ? '#dc2626' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{t.dueDate ? `${overdue ? 'Retard · ' : ''}${dateFmt(t.dueDate)}` : 'Sans échéance'}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
            {data.noProject.length > 0 && (
              <div style={{ paddingTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Autres tâches à traiter</div>
                {data.noProject.map(t => <div key={t._id} style={{ fontSize: 13, padding: '8px 0', borderTop: '1px solid var(--border-color)' }}>{t.title}</div>)}
              </div>
            )}
          </div>
        </Section>

        <Section title="Facturation" action={<Link to="/billing" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>Voir tout <ArrowUpRight size={14} /></Link>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            {[['Payé', data.sums.paid, '#15803d'], ['En attente', data.sums.pending, '#b45309'], ['En retard', data.sums.overdue, '#dc2626']].map(([label, value, color]) => {
              const pct = data.invTotal ? Math.max((value / data.invTotal) * 100, value > 0 ? 4 : 0) : 0
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}><span style={{ color: 'var(--text-secondary)' }}>{label}</span><span style={{ fontWeight: 600 }}>{fmt(value)}</span></div>
                  <div style={{ height: 8, background: '#eef2f7', borderRadius: 99, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: color }} /></div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data.recentInvoices.length === 0 ? <p style={{ margin: 0 }}>Aucune facture.</p> : data.recentInvoices.map(inv => {
              const st = invStatus[inv.status] || invStatus.pending
              return (
                <div key={inv._id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{inv.ref} <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>· {inv.clientName}</span></div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{dateFmt(inv.date || inv.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(ttc(inv))}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      </div>
    </div>
  )
}