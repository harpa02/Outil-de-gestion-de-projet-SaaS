import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// URL de base de l'API - configurable via variable d'environnement Vite
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Helper pour les appels fetch avec le header multi-tenant
async function apiFetch(path, options = {}, companyId = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (companyId) headers['X-Company-Id'] = companyId

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Erreur serveur')
  }
  return res.json()
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [companies, setCompanies] = useState([])
  const [currentCompany, setCurrentCompany] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentCompany')) || null } catch { return null }
  })
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentUser')) || null } catch { return null }
  })

  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Persister l'entreprise et l'utilisateur actifs dans localStorage
  useEffect(() => {
    if (currentCompany) {
      localStorage.setItem('currentCompany', JSON.stringify(currentCompany))
    } else {
      localStorage.removeItem('currentCompany')
    }
  }, [currentCompany])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('currentUser')
    }
  }, [currentUser])

  // ── Entreprises ──────────────────────────────
  const fetchCompanies = useCallback(async () => {
    try {
      const data = await apiFetch('/companies')
      setCompanies(data)
      return data
    } catch (e) {
      setError(e.message)
      return []
    }
  }, [])

  const createCompany = useCallback(async (payload) => {
    const created = await apiFetch('/companies', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    setCompanies(prev => [created, ...prev])
    return created
  }, [])

  const updateCompany = useCallback(async (id, payload) => {
    const updated = await apiFetch(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    setCompanies(prev => prev.map(c => c._id === id ? updated : c))
    if (currentCompany?._id === id) setCurrentCompany(updated)
    return updated
  }, [currentCompany])

  const deleteCompany = useCallback(async (id) => {
    await apiFetch(`/companies/${id}`, { method: 'DELETE' })
    setCompanies(prev => prev.filter(c => c._id !== id))
    if (currentCompany?._id === id) {
      setCurrentCompany(null)
      setCurrentUser(null)
      setProjects([])
      setUsers([])
      setTasks([])
    }
  }, [currentCompany])

  // ── Utilisateurs ─────────────────────────────
  const fetchUsers = useCallback(async (companyId) => {
    if (!companyId) return []
    try {
      const data = await apiFetch('/users', {}, companyId)
      setUsers(data)
      return data
    } catch (e) {
      setError(e.message)
      return []
    }
  }, [])

  const createUser = useCallback(async (payload, companyId) => {
    const created = await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, companyId)
    setUsers(prev => [created, ...prev])
    return created
  }, [])

  const updateUser = useCallback(async (id, payload, companyId) => {
    const updated = await apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }, companyId)
    setUsers(prev => prev.map(u => u._id === id ? updated : u))
    if (currentUser?._id === id) setCurrentUser(updated)
    return updated
  }, [currentUser])

  const deleteUser = useCallback(async (id, companyId) => {
    await apiFetch(`/users/${id}`, { method: 'DELETE' }, companyId)
    setUsers(prev => prev.filter(u => u._id !== id))
    if (currentUser?._id === id) setCurrentUser(null)
  }, [currentUser])

  // ── Projets ──────────────────────────────────
  const fetchProjects = useCallback(async (companyId) => {
    if (!companyId) return []
    try {
      const data = await apiFetch('/projects', {}, companyId)
      setProjects(data)
      return data
    } catch (e) {
      setError(e.message)
      return []
    }
  }, [])

  const createProject = useCallback(async (payload, companyId) => {
    const created = await apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, companyId)
    setProjects(prev => [created, ...prev])
    return created
  }, [])

  const updateProject = useCallback(async (id, payload, companyId) => {
    const updated = await apiFetch(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }, companyId)
    setProjects(prev => prev.map(p => p._id === id ? updated : p))
    return updated
  }, [])

  const deleteProject = useCallback(async (id, companyId) => {
    await apiFetch(`/projects/${id}`, { method: 'DELETE' }, companyId)
    setProjects(prev => prev.filter(p => p._id !== id))
    setTasks(prev => prev.filter(t => t.projectId !== id))
  }, [])

  // ── Tâches ───────────────────────────────────
  const fetchTasks = useCallback(async (companyId, filters = {}) => {
    if (!companyId) return []
    try {
      const params = new URLSearchParams(filters).toString()
      const data = await apiFetch(`/tasks${params ? '?' + params : ''}`, {}, companyId)
      setTasks(data)
      return data
    } catch (e) {
      setError(e.message)
      return []
    }
  }, [])

  const createTask = useCallback(async (payload, companyId) => {
    const created = await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, companyId)
    setTasks(prev => [created, ...prev])
    return created
  }, [])

  const updateTask = useCallback(async (id, payload, companyId) => {
    const updated = await apiFetch(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }, companyId)
    setTasks(prev => prev.map(t => t._id === id ? updated : t))
    return updated
  }, [])

  const updateTaskStatus = useCallback(async (id, status, companyId) => {
    const updated = await apiFetch(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }, companyId)
    setTasks(prev => prev.map(t => t._id === id ? { ...t, ...updated } : t))
    return updated
  }, [])

  const deleteTask = useCallback(async (id, companyId) => {
    await apiFetch(`/tasks/${id}`, { method: 'DELETE' }, companyId)
    setTasks(prev => prev.filter(t => t._id !== id))
  }, [])

  // ── Connexion (sélection entreprise + utilisateur) ──
  const login = useCallback(async (companyId, userId) => {
    const comps = companies.length ? companies : await fetchCompanies()
    const comp = comps.find(c => c._id === companyId)
    if (!comp) throw new Error('Entreprise introuvable')
    const usrs = await fetchUsers(companyId)
    const user = usrs.find(u => u._id === userId)
    if (!user) throw new Error('Utilisateur introuvable')
    setCurrentCompany(comp)
    setCurrentUser(user)
    return { company: comp, user }
  }, [companies, fetchCompanies, fetchUsers])

  const logout = useCallback(() => {
    setCurrentCompany(null)
    setCurrentUser(null)
    setProjects([])
    setUsers([])
    setTasks([])
    localStorage.removeItem('currentCompany')
    localStorage.removeItem('currentUser')
  }, [])

  const value = {
    companies,
    currentCompany,
    currentUser,
    projects,
    users,
    tasks,
    loading,
    error,
    setError,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    login,
    logout,
    setCurrentCompany,
    setCurrentUser,
  }

  return React.createElement(StoreContext.Provider, { value }, children)
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}

