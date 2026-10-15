// Mock data and simple state management for Photographer OS
import { useState, useEffect } from 'react'

const DEFAULT_PHOTOS = [
  {
    id: "photo_1",
    title: "Lignes Aérodynamiques",
    description: "Une supercar capturée à l'heure dorée. Les reflets de la lumière sur la carrosserie mettent en évidence la perfection de son aérodynamisme.",
    category: "sport",
    meta: "Circuit du Mans, 2026 — Hasselblad X2D",
    src: "photos/mountain.png",
    frameStyle: "minimalist",
    frameWidth: 25,
    frameColor: "#e4dfd5",
    passepartout: 15,
    shadowDepth: 20
  },
  {
    id: "photo_2",
    title: "Beauté Intemporelle",
    description: "Focus sur la calandre chromée d'un véhicule de collection, témoignage d'une époque révolue et du savoir-faire d'antan.",
    category: "classic",
    meta: "Paris, 2025 — Leica Q3",
    src: "photos/architecture.png",
    frameStyle: "gold",
    frameWidth: 15,
    frameColor: "#141416",
    passepartout: 25,
    shadowDepth: 25
  },
  {
    id: "photo_3",
    title: "Mécanique de Précision",
    description: "Détail du poste de pilotage et du volant d'une voiture de sport. L'alliance parfaite entre cuir surpiqué et fibre de carbone.",
    category: "details",
    meta: "Studio Lumière, 2026 — Sony A7R V",
    src: "photos/portrait.png",
    frameStyle: "polaroid",
    frameWidth: 10,
    frameColor: "#fafafa",
    passepartout: 12,
    shadowDepth: 12
  }
]

const initialData = {
  quotes: [],
  projects: [],
  timeEntries: [],
  users: [
    { id: 'u1', name: 'Directeur (Vous)', costRate: 0 }
  ],
  clients: [],
  receipts: [],
  expenses: [],
  mileage: [],
  packs: [],
  vehicleOptions: [],
  photos: DEFAULT_PHOTOS,
  settings: {
    companyName: 'Mon Studio Photo',
    address: '1 Rue de la Paix, 75002 Paris',
    siret: '12345678900012',
    vatRate: 20,
    legalForm: 'Micro-entreprise',
    capital: '0',
    naf: '7420Z', // Code NAF Activités photographiques
    vatIntra: 'FR12345678901',
    annualGoal: 20000,
    rcPro: '',
    lastInvoiceNumber: 0,
    lastQuoteNumber: 0
  }
}

let globalData = null
let globalCurrentUser = null
const listeners = new Set()

export function useStore() {
  if (globalData === null) {
    const saved = localStorage.getItem('photographerData_v3')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        globalData = { 
          ...initialData, 
          ...parsed, 
          packs: parsed.packs || initialData.packs,
          vehicleOptions: parsed.vehicleOptions || initialData.vehicleOptions,
          settings: { ...initialData.settings, ...parsed.settings },
          photos: parsed.photos || initialData.photos
        }
      } catch (e) {}
    }
    if (!globalData) {
      const oldSaved = localStorage.getItem('photographerData_v2')
      if (oldSaved) {
        try {
          const parsed = JSON.parse(oldSaved)
          globalData = {
            ...initialData,
            ...parsed,
            packs: parsed.packs || initialData.packs,
            vehicleOptions: parsed.vehicleOptions || initialData.vehicleOptions,
            settings: { ...initialData.settings, ...parsed.settings },
            photos: parsed.photos || initialData.photos
          }
        } catch (e) {}
      }
    }
    if (!globalData) {
      const savedLuminaPhotos = localStorage.getItem('lumina_photos')
      if (savedLuminaPhotos) {
        try {
          const parsedPhotos = JSON.parse(savedLuminaPhotos)
          if (Array.isArray(parsedPhotos) && parsedPhotos.length > 0) {
            globalData = {
              ...initialData,
              photos: parsedPhotos
            }
          }
        } catch (e) {}
      }
    }
    if (!globalData) {
      globalData = initialData
    }
  }

  if (globalCurrentUser === null) {
    globalCurrentUser = localStorage.getItem('currentUser') || null
  }

  const [currentUser, setCurrentUserInternal] = useState(globalCurrentUser)
  const [data, setDataInternal] = useState(globalData)

  useEffect(() => {
    const listener = {
      setCurrentUser: setCurrentUserInternal,
      setData: setDataInternal
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const setData = (newDataOrFunc) => {
    const nextData = typeof newDataOrFunc === 'function' ? newDataOrFunc(globalData) : newDataOrFunc
    globalData = nextData
    listeners.forEach(l => l.setData(nextData))
  }

  const setCurrentUser = (newUser) => {
    globalCurrentUser = newUser
    listeners.forEach(l => l.setCurrentUser(newUser))
  }

  useEffect(() => {
    try {
      localStorage.setItem('photographerData_v3', JSON.stringify(data))
    } catch (e) {
      console.error("Local storage write error (quota exceeded):", e)
    }
    
    // Synchroniser avec les clés du site vitrine photograph
    if (data.photos) {
      try {
        localStorage.setItem('lumina_photos', JSON.stringify(data.photos))
      } catch (e) {
        console.error("Local storage write error (lumina_photos exceeded):", e)
      }
    }

    const existingSettings = localStorage.getItem('lumina_settings')
    let mergedSettings = {}
    if (existingSettings) {
      try { mergedSettings = JSON.parse(existingSettings) } catch (e) {}
    }
    const updatedLuminaSettings = {
      ...mergedSettings,
      companyName: data.settings.companyName,
      logo: data.settings.logo
    }
    try {
      localStorage.setItem('lumina_settings', JSON.stringify(updatedLuminaSettings))
    } catch (e) {
      console.error("Local storage write error (lumina_settings exceeded):", e)
    }
  }, [data])

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'lumina_photos') {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) {
            setData(prev => {
              if (JSON.stringify(prev.photos) !== e.newValue) {
                return { ...prev, photos: parsed }
              }
              return prev
            })
          }
        } catch (err) {}
      } else if (e.key === 'lumina_settings') {
        try {
          const parsed = JSON.parse(e.newValue)
          setData(prev => {
            const hasChanged = prev.settings.companyName !== parsed.companyName || prev.settings.logo !== parsed.logo
            if (hasChanged) {
              return {
                ...prev,
                settings: {
                  ...prev.settings,
                  companyName: parsed.companyName || prev.settings.companyName,
                  logo: parsed.logo || prev.settings.logo
                }
              }
            }
            return prev
          })
        } catch (err) {}
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = (email, password) => {
    const savedAccount = localStorage.getItem('userAccount')
    if (savedAccount) {
      try {
        const account = JSON.parse(savedAccount)
        if (account.email === email && account.password === password) {
          localStorage.setItem('currentUser', email)
          setCurrentUser(email)
          return { success: true }
        }
      } catch (e) {}
    }
    return { success: false, message: 'Identifiants incorrects.' }
  }

  const signup = (accountData) => {
    const { email, password, name, settings } = accountData
    
    // Enregistrer le compte
    localStorage.setItem('userAccount', JSON.stringify({ email, password, name }))
    localStorage.setItem('currentUser', email)
    
    // Mettre à jour les données dans l'état et forcer la sauvegarde immédiate
    setData(prev => {
      const updated = {
        ...prev,
        clients: [],
        quotes: [],
        projects: [],
        receipts: [],
        expenses: [],
        mileage: [],
        packs: [],
        vehicleOptions: [],
        users: [{ id: 'u1', name: name || 'Patron', costRate: 0 }],
        settings: {
          ...prev.settings,
          ...settings,
          companyName: settings.companyName || 'Mon Studio Photo'
        }
      }
      try {
        localStorage.setItem('photographerData_v3', JSON.stringify(updated))
      } catch (e) {}
      return updated
    })
    
    localStorage.removeItem('onboarding_completed')
    setCurrentUser(email)
    return { success: true }
  }

  const logout = () => {
    localStorage.removeItem('currentUser')
    setCurrentUser(null)
    window.location.reload()
  }

  const updateSettings = (newSettings) => {
    setData(prev => ({ ...prev, settings: newSettings }))
  }

  const updatePhotos = (newPhotos) => {
    setData(prev => ({ ...prev, photos: newPhotos }))
  }

  const addClient = (client) => {
    setData(prev => ({ ...prev, clients: [...prev.clients, { ...client, id: 'c' + Date.now() }] }))
  }

  const updateClient = (id, updatedClient) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === id ? { ...c, ...updatedClient } : c)
    }))
  }

  const deleteClient = (id) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id)
    }))
  }

  const cancelQuote = (id, reason) => {
    setData(prev => ({
      ...prev,
      quotes: prev.quotes.map(q => q.id === id ? { ...q, status: 'cancelled', cancelReason: reason } : q),
      projects: prev.projects.map(p => p.quoteId === id ? { ...p, status: 'cancelled' } : p)
    }))
  }

  const completeProject = (id, closureReason, closureNote) => {
    setData(prev => {
      const project = prev.projects.find(p => p.id === id)
      if (!project) return prev
      
      const quote = prev.quotes.find(q => q.id === project.quoteId)
      
      // Facturation à la prestation : le montant est toujours le total budget estimé du devis
      const invoicableAmount = project.tasks.reduce((acc, t) => acc + (t.estHours * t.rate), 0)

      const vatRate = prev.settings.vatRate || 20
      const vatAmount = invoicableAmount * (vatRate / 100)
      const totalTTC = invoicableAmount + vatAmount

      // Only increment if we are creating a new receipt, not updating an existing one
      const existingReceipts = prev.receipts || []
      const hasReceipt = existingReceipts.some(r => r.projectId === project.id)

      let invoiceRef = 'FAC-Error'
      let newInvoiceCount = prev.settings.lastInvoiceNumber || 0

      if (!hasReceipt) {
        const year = new Date().getFullYear()
        newInvoiceCount = (prev.settings.lastInvoiceNumber || 0) + 1
        invoiceRef = `FAC-${year}-${newInvoiceCount.toString().padStart(3, '0')}`
      }

      const newReceipt = {
        id: 'r_proj_' + project.id,
        date: new Date().toISOString().split('T')[0],
        invoiceRef: invoiceRef,
        client: quote?.client || 'Client Inconnu',
        description: `Prestation : ${project.name}`,
        amountHT: invoicableAmount,
        vatAmount: vatAmount,
        amountTTC: totalTTC,
        paymentMethod: 'Virement',
        projectId: project.id,
        status: 'En attente' // Nouveau champ de statut pour la facture
      }


      const updatedReceipts = hasReceipt 
        ? existingReceipts.map(r => r.projectId === project.id ? { ...r, amountHT: invoicableAmount, vatAmount, amountTTC: totalTTC } : r)
        : [...existingReceipts, newReceipt]

      return {
        ...prev,
        settings: { ...prev.settings, lastInvoiceNumber: newInvoiceCount },
        projects: prev.projects.map(p => p.id === id ? { ...p, status: 'completed', closureReason, closureNote, completedAt: new Date().toISOString() } : p),
        receipts: updatedReceipts
      }
    })
  }

  const addTimeEntry = (entry) => {
    setData(prev => ({
      ...prev,
      timeEntries: [...prev.timeEntries, { ...entry, id: 'te' + Date.now() }]
    }))
  }

  const addQuote = (quote) => {
    setData(prev => {
      const year = new Date().getFullYear()
      const quoteCount = (prev.settings.lastQuoteNumber || 0) + 1
      const ref = `DEV-${year}-${quoteCount.toString().padStart(3, '0')}`
      return {
        ...prev,
        settings: { ...prev.settings, lastQuoteNumber: quoteCount },
        quotes: [...prev.quotes, { ...quote, id: 'q' + Date.now(), ref }]
      }
    })
  }
  
  const convertQuoteToProject = (quote) => {
    const newProject = {
      id: 'p' + Date.now(),
      quoteId: quote.id,
      name: 'Projet: ' + quote.client,
      status: 'in_progress',
      tasks: [...quote.tasks]
    }
    setData(prev => ({
      ...prev,
      quotes: prev.quotes.map(q => q.id === quote.id ? { ...q, status: 'accepted' } : q),
      projects: [...prev.projects, newProject]
    }))
  }

  const addReceipt = (receipt) => {
    setData(prev => {
      let newLastInvoice = prev.settings.lastInvoiceNumber || 0
      if (receipt.invoiceRef && receipt.invoiceRef.startsWith(`FAC-${new Date().getFullYear()}-`)) {
        const num = parseInt(receipt.invoiceRef.split('-')[2], 10)
        if (!isNaN(num) && num > newLastInvoice) {
          newLastInvoice = num
        }
      }
      return {
        ...prev,
        settings: { ...prev.settings, lastInvoiceNumber: newLastInvoice },
        receipts: [...(prev.receipts || []), { ...receipt, id: 'r' + Date.now(), status: receipt.status || 'Payé' }]
      }
    })
  }

  const updateReceiptStatus = (id, status) => {
    setData(prev => ({
      ...prev,
      receipts: (prev.receipts || []).map(r => r.id === id ? { ...r, status } : r)
    }))
  }

  const deleteReceipt = (id) => {
    setData(prev => ({
      ...prev,
      receipts: (prev.receipts || []).filter(r => r.id !== id)
    }))
  }

  const addExpense = (expense) => {
    setData(prev => ({
      ...prev,
      expenses: [...(prev.expenses || []), { ...expense, id: 'e' + Date.now() }]
    }))
  }

  const deleteExpense = (id) => {
    setData(prev => ({
      ...prev,
      expenses: (prev.expenses || []).filter(e => e.id !== id)
    }))
  }

  const addMileage = (entry) => {
    setData(prev => ({
      ...prev,
      mileage: [...(prev.mileage || []), { ...entry, id: 'm' + Date.now() }]
    }))
  }

  const deleteMileage = (id) => {
    setData(prev => ({
      ...prev,
      mileage: (prev.mileage || []).filter(m => m.id !== id)
    }))
  }

  const updatePacks = (newPacks) => {
    setData(prev => ({ ...prev, packs: newPacks }))
  }

  const updateVehicleOptions = (newOptions) => {
    setData(prev => ({ ...prev, vehicleOptions: newOptions }))
  }

  const importAllData = (newData) => {
    if (newData && typeof newData === 'object') {
      setData(prev => ({
        ...prev,
        ...newData,
        // Assurer de garder les paramètres fusionnés proprement
        settings: { ...prev.settings, ...(newData.settings || {}) }
      }))
      return true
    }
    return false
  }

  return {
    data,
    currentUser,
    login,
    signup,
    logout,
    addTimeEntry,
    addQuote,
    convertQuoteToProject,
    addClient,
    updateClient,
    deleteClient,
    updateSettings,
    cancelQuote,
    completeProject,
    addReceipt,
    updateReceiptStatus,
    deleteReceipt,
    addExpense,
    deleteExpense,
    addMileage,
    deleteMileage,
    updatePacks,
    updateVehicleOptions,
    importAllData,
    updatePhotos
  }
}
