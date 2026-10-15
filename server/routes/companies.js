import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'

const router = Router()

// GET /api/companies - Liste toutes les entreprises avec métriques associées
router.get('/', async (req, res) => {
  try {
    const db = getDB()
    const companies = await db.collection('companies').find().sort({ createdAt: -1 }).toArray()

    // Enrichir avec le nombre de projets et d'utilisateurs par entreprise
    const enriched = await Promise.all(
      companies.map(async (comp) => {
        const [projectCount, userCount, taskCount] = await Promise.all([
          db.collection('projects').countDocuments({ companyId: comp._id }),
          db.collection('users').countDocuments({ companyId: comp._id }),
          db.collection('tasks').countDocuments({ companyId: comp._id })
        ])
        return { ...comp, projectCount, userCount, taskCount }
      })
    )

    res.json(enriched)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/companies/:id - Détail d'une entreprise
router.get('/:id', async (req, res) => {
  try {
    const db = getDB()
    const company = await db.collection('companies').findOne({ _id: new ObjectId(req.params.id) })
    if (!company) return res.status(404).json({ error: 'Entreprise introuvable' })
    res.json(company)
  } catch {
    res.status(400).json({ error: 'Identifiant d\'entreprise invalide' })
  }
})

// POST /api/companies - Créer une nouvelle entreprise
router.post('/', async (req, res) => {
  try {
    const { name, slug, description, plan = 'Pro' } = req.body
    if (!name) {
      return res.status(400).json({ error: 'Le nom de l\'entreprise est requis' })
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const db = getDB()
    const existing = await db.collection('companies').findOne({ slug: cleanSlug })
    if (existing) {
      return res.status(400).json({ error: `Une entreprise avec l'identifiant "${cleanSlug}" existe déjà.` })
    }

    const newCompany = {
      name: name.trim(),
      slug: cleanSlug,
      description: description?.trim() || '',
      plan,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('companies').insertOne(newCompany)
    res.status(201).json({ ...newCompany, _id: result.insertedId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/companies/:id - Modifier une entreprise
router.put('/:id', async (req, res) => {
  try {
    const { name, description, plan } = req.body
    const db = getDB()
    const updateDoc = {
      $set: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(plan && { plan }),
        updatedAt: new Date()
      }
    }

    const result = await db.collection('companies').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      updateDoc,
      { returnDocument: 'after' }
    )

    if (!result) return res.status(404).json({ error: 'Entreprise introuvable' })
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/companies/:id - Supprimer une entreprise et cascade supprimer toutes ses données
router.delete('/:id', async (req, res) => {
  try {
    const companyId = new ObjectId(req.params.id)
    const db = getDB()

    const company = await db.collection('companies').findOne({ _id: companyId })
    if (!company) return res.status(404).json({ error: 'Entreprise introuvable' })

    // Suppression en cascade pour garantir une stricte intégrité
    await Promise.all([
      db.collection('companies').deleteOne({ _id: companyId }),
      db.collection('users').deleteMany({ companyId }),
      db.collection('projects').deleteMany({ companyId }),
      db.collection('tasks').deleteMany({ companyId })
    ])

    res.json({ message: `Entreprise "${company.name}" et toutes ses données associées ont été supprimées.` })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
