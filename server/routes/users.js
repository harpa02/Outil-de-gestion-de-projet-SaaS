import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'
import { requireCompany } from '../middleware/tenant.js'

const router = Router()

// Toutes les routes utilisateurs nécessitent le middleware d'isolation d'entreprise
router.use(requireCompany)

// GET /api/users - Liste des utilisateurs rattachés à l'entreprise active
router.get('/', async (req, res) => {
  try {
    const db = getDB()
    const users = await db.collection('users')
      .find({ companyId: req.companyId })
      .sort({ createdAt: -1 })
      .toArray()

    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/users/:id - Détail d'un utilisateur au sein de l'entreprise active
router.get('/:id', async (req, res) => {
  try {
    const db = getDB()
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(req.params.id), 
      companyId: req.companyId 
    })
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable dans cette entreprise' })
    res.json(user)
  } catch {
    res.status(400).json({ error: 'Identifiant d\'utilisateur invalide' })
  }
})

// POST /api/users - Créer un utilisateur au sein de l'entreprise active
router.post('/', async (req, res) => {
  try {
    const { name, email, role = 'member', avatar } = req.body
    if (!name || !email) {
      return res.status(400).json({ error: 'Le nom et l\'email sont requis.' })
    }

    const cleanEmail = email.toLowerCase().trim()
    const db = getDB()

    // Vérifier l'unicité au sein de cette entreprise
    const existing = await db.collection('users').findOne({ 
      companyId: req.companyId, 
      email: cleanEmail 
    })

    if (existing) {
      return res.status(400).json({ error: `Un utilisateur avec l'email ${cleanEmail} existe déjà dans cette entreprise.` })
    }

    const newUser = {
      companyId: req.companyId,
      name: name.trim(),
      email: cleanEmail,
      role, // 'admin' | 'manager' | 'member'
      avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('users').insertOne(newUser)
    res.status(201).json({ ...newUser, _id: result.insertedId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/users/:id - Modifier un utilisateur au sein de l'entreprise active
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, avatar } = req.body
    const userId = new ObjectId(req.params.id)
    const db = getDB()

    const updateDoc = {
      $set: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(role && { role }),
        ...(avatar && { avatar }),
        updatedAt: new Date()
      }
    }

    const result = await db.collection('users').findOneAndUpdate(
      { _id: userId, companyId: req.companyId },
      updateDoc,
      { returnDocument: 'after' }
    )

    if (!result) return res.status(404).json({ error: 'Utilisateur introuvable dans cette entreprise' })
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/users/:id - Supprimer un utilisateur de l'entreprise active
router.delete('/:id', async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id)
    const db = getDB()

    const result = await db.collection('users').deleteOne({ 
      _id: userId, 
      companyId: req.companyId 
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable dans cette entreprise' })
    }

    // Retirer l'utilisateur des projets et désassigner ses tâches
    await Promise.all([
      db.collection('projects').updateMany(
        { companyId: req.companyId },
        { $pull: { memberIds: userId } }
      ),
      db.collection('tasks').updateMany(
        { companyId: req.companyId, assignedUserId: userId },
        { $set: { assignedUserId: null, updatedAt: new Date() } }
      )
    ])

    res.json({ message: 'Utilisateur supprimé avec succès' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
