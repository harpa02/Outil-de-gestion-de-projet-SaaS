import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Search, Briefcase, CheckSquare, UserRound, Receipt } from 'lucide-react'
import Sidebar from './Sidebar'
import { useStore } from '../store'

export default function AppLayout() {
  const { projects, tasks, clients, invoices, fetchProjects, fetchTasks, fetchClients, fetchInvoices } = useStore()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const wrapRef = useRef(null)

  useEffect(() => {
    fetchProjects().catch(() => {})
    fetchTasks().catch(() => {})
    fetchClients().catch(() => {})
    fetchInvoices().catch(() => {})
  }, [fetchProjects, fetchTasks, fetchClients, fetchInvoices])

  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const match = (value) => String(value || '').toLowerCase().includes(q)
    const items = []
    projects.forEach(p => { if (match(p.name) || match(p.description)) items.push({ type: 'Projet', label: p.name, path: '/projects', icon: Briefcase }) })
    tasks.forEach(t => { if (match(t.title) || match(t.description)) items.push({ type: 'Tâche', label: t.title, path: '/kanban', icon: CheckSquare }) })
    clients.forEach(c => { if (match(c.companyName) || match(c.contactName) || match(c.email)) items.push({ type: 'Client', label: c.companyName, path: '/clients', icon: UserRound }) })
    invoices.forEach(i => { if (match(i.ref) || match(i.clientName) || match(i.description)) items.push({ type: 'Facture', label: `${i.ref} · ${i.clientName}`, path: '/billing', icon: Receipt }) })
    return items.slice(0, 8)
  }, [query, projects, tasks, clients, invoices])

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          <div ref={wrapRef} style={{ position: 'relative', marginBottom: '20px', maxWidth: '420px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder="Rechercher projet, tâche, client, facture..."
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' }}
            />
            {open && query.trim() && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 20, overflow: 'hidden' }}>
                {results.length === 0 ? (
                  <div style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>Aucun résultat</div>
                ) : results.map((r, idx) => {
                  const Icon = r.icon
                  return (
                    <button key={`${r.type}-${r.label}-${idx}`} onClick={() => { navigate(r.path); setOpen(false); setQuery('') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'var(--text-main)' }}>
                      <Icon size={15} color="var(--text-secondary)" />
                      <span style={{ flex: 1, fontSize: 13 }}>{r.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.type}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

