import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Helper pour les appels API avec le token JWT
async function apiFetch(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('company')
    const err = await res.json().catch(() => ({ error: 'Non authentifié' }))
    throw new Error(err.error || 'Session expirée')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Erreur serveur')
  }

  return res.json()
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null } catch { return null }
  })
  const [company, setCompany] = useState(() => {
    try { return JSON.parse(localStorage.getItem('company')) || null } catch { return null }
  })

  const [companies, setCompanies] = useState([])
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [pendingMembers, setPendingMembers] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Synchronisation avec localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [user])

  useEffect(() => {
    if (company) {
      localStorage.setItem('company', JSON.stringify(company))
    } else {
      localStorage.removeItem('company')
    }
  }, [company])

  // Helper interne pour passer le token courant
  const authFetch = useCallback((path, options = {}) => {
    return apiFetch(path, options, token)
  }, [token])

  // ── Authentification ───────────────────────────────────────────
  const fetchMe = useCallback(async () => {
    if (!token) return null
    setLoading(true)
    try {
      const data = await authFetch('/auth/me')
      const { company: compData, ...userData } = data
      setUser(userData)
      if (compData) {
        setCompany(compData)
      } else if (!userData.companyId) {
        setCompany(null)
      }
      return data
    } catch (e) {
      setError(e.message)
      if (e.message.includes('Session expirée') || e.message.includes('introuvable')) {
        setToken(null)
        setUser(null)
        setCompany(null)
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [token, authFetch])

  const register = useCallback(async (firstName, lastName, email, password) => {
    setError(null)
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, password })
    })
    setToken(data.token)
    setUser(data.user)
    setCompany(null)
    return data
  }, [])

  const login = useCallback(async (email, password) => {
    setError(null)
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    setToken(data.token)
    setUser(data.user)

    // Charger les infos complètes avec l'entreprise
    try {
      const me = await apiFetch('/auth/me', {}, data.token)
      if (me.company) setCompany(me.company)
      else setCompany(null)
    } catch {
      // Ignorer si pas encore d'entreprise
    }

    return data
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setCompany(null)
    setCompanies([])
    setProjects([])
    setUsers([])
    setTasks([])
    setPendingMembers([])
    setPendingCount(0)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('company')
  }, [])

  // Auto-chargement du profil au démarrage si token présent
  useEffect(() => {
    if (token) {
      fetchMe()
    }
  }, [token, fetchMe])

  // ── Entreprises (onboarding & adhésion) ────────────────────────
  const fetchCompanies = useCallback(async () => {
    try {
      const data = await authFetch('/companies')
      setCompanies(data)
      return data
    } catch (e) {
      setError(e.message)
      return []
    }
  }, [authFetch])

  const createCompanyAndJoin = useCallback(async (name, description) => {
    const data = await authFetch('/companies', {
      method: 'POST',
      body: JSON.stringify({ name, description })
    })
    setCompany(data.company)
    setUser(data.user)
    return data
  }, [authFetch])

  const joinCompany = useCallback(async (companyId) => {
    const data = await authFetch(`/companies/join/${companyId}`, {
      method: 'POST'
    })
    setUser(data.user)
    return data
  }, [authFetch])

  // ── Gestion des membres (admin & manager) ─────────────────────
  const fetchMembers = useCallback(async () => {
    try {
      const data = await authFetch('/companies/members')
      setUsers(data.members || [])
      const pending = (data.members || []).filter(m => m.status === 'pending_approval')
      setPendingMembers(pending)
      setPendingCount(data.pendingCount || pending.length)
      return data
    } catch (e) {
      setError(e.message)
      return { members: [], pendingCount: 0 }
    }
  }, [authFetch])

  const approveMember = useCallback(async (memberId) => {
    const updated = await authFetch(`/companies/members/${memberId}/approve`, {
      method: 'PATCH'
    })
    await fetchMembers()
    return updated
  }, [authFetch, fetchMembers])

  const rejectMember = useCallback(async (memberId) => {
    const res = await authFetch(`/companies/members/${memberId}/reject`, {
      method: 'DELETE'
    })
    await fetchMembers()
    return res
  }, [authFetch, fetchMembers])

  const changeMemberRole = useCallback(async (memberId, role) => {
    const updated = await authFetch(`/companies/members/${memberId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    })
    await fetchMembers()
    return updated
  }, [authFetch, fetchMembers])

  // ── Utilisateurs (membres de l'entreprise) ─────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      const data = await authFetch('/users')
      setUsers(data)
      return data
    } catch (e) {
      setError(e.message)
      return []
    }
  }, [authFetch])

  const updateUser = useCallback(async (id, payload) => {
    const updated = await authFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    setUsers(prev => prev.map(u => u._id === id ? updated : u))
    if (user?._id === id) setUser(updated)
    return updated
  }, [authFetch, user])

  const deleteUser = useCallback(async (id) => {
    await authFetch(`/users/${id}`, { method: 'DELETE' })
    setUsers(prev => prev.filter(u => u._id !== id))
  }, [authFetch])

  // ── Projets ──────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    try {
      const data = await authFetch('/projects')
      setProjects(data)
      return data
    } catch (e) {
      setError(e.message)
      return []
    }
  }, [authFetch])

  const createProject = useCallback(async (payload) => {
    const created = await authFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    setProjects(prev => [created, ...prev])
    return created
  }, [authFetch])

  const updateProject = useCallback(async (id, payload) => {
    const updated = await authFetch(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    setProjects(prev => prev.map(p => p._id === id ? updated : p))
    return updated
  }, [authFetch])

  const deleteProject = useCallback(async (id) => {
    await authFetch(`/projects/${id}`, { method: 'DELETE' })
    setProjects(prev => prev.filter(p => p._id !== id))
    setTasks(prev => prev.filter(t => t.projectId !== id))
  }, [authFetch])

  // ── Tâches ───────────────────────────────────────────────────
  const fetchTasks = useCallback(async (filtersOrCompanyId = {}, maybeFilters = {}) => {
    try {
      // Compatibilité si l'ancien code passe (companyId, filters)
      const filters = typeof filtersOrCompanyId === 'object' && filtersOrCompanyId !== null && !filtersOrCompanyId._bsontype
        ? filtersOrCompanyId
        : maybeFilters

      const params = new URLSearchParams(filters).toString()
      const data = await authFetch(`/tasks${params ? '?' + params : ''}`)
      setTasks(data)
      return data
    } catch (e) {
      setError(e.message)
      return []
    }
  }, [authFetch])

  const createTask = useCallback(async (payload) => {
    const created = await authFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    setTasks(prev => [created, ...prev])
    return created
  }, [authFetch])

  const updateTask = useCallback(async (id, payload) => {
    const updated = await authFetch(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    setTasks(prev => prev.map(t => t._id === id ? updated : t))
    return updated
  }, [authFetch])

  const updateTaskStatus = useCallback(async (id, status) => {
    const updated = await authFetch(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
    setTasks(prev => prev.map(t => t._id === id ? { ...t, ...updated } : t))
    return updated
  }, [authFetch])

  const deleteTask = useCallback(async (id) => {
    await authFetch(`/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t._id !== id))
  }, [authFetch])

  const value = {
    // Auth & state
    token,
    user,
    company,
    // Alias rétro-compatibilité
    currentUser: user ? { ...user, name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email } : null,
    currentCompany: company,
    setCurrentUser: setUser,
    setCurrentCompany: setCompany,

    // Données métier
    companies,
    projects,
    users: users.map(u => ({ ...u, name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.email })),
    tasks,
    pendingMembers,
    pendingCount,
    loading,
    error,
    setError,

    // Fonctions Auth
    register,
    login,
    logout,
    fetchMe,

    // Fonctions Entreprise
    fetchCompanies,
    createCompanyAndJoin,
    joinCompany,

    // Fonctions Membres
    fetchMembers,
    approveMember,
    rejectMember,
    changeMemberRole,

    // CRUD Utilisateurs
    fetchUsers,
    updateUser,
    deleteUser,

    // CRUD Projets
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,

    // CRUD Tâches
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
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
