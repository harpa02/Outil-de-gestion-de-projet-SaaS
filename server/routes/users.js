import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'
import { requireAuth, requireActive } from '../middleware/auth.js'
import { sanitizeUser } from './auth.js'

const router = Router()

// Toutes les routes utilisateurs nécessitent authentification et compte actif
router.use(requireAuth, requireActive)

// GET /api/users - Liste des utilisateurs rattachés à l'entreprise de l'utilisateur connecté
router.get('/', async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'Vous devez rejoindre une entreprise.' })
    }

    const db = getDB()

    // Construire le filtre : masquer les membres en attente sauf si l'utilisateur est CEO
    const filter = { companyId: req.companyId }
    if (req.user.role !== 'ceo') {
      filter.status = 'active'
    }

    const users = await db.collection('users')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    // Retourner les utilisateurs sans le hash du mot de passe
    res.json(users.map(sanitizeUser))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/users/:id - Détail d'un utilisateur au sein de l'entreprise active
router.get('/:id', async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'Vous devez rejoindre une entreprise.' })
    }

    const db = getDB()
    const user = await db.collection('users').findOne({
      _id: new ObjectId(req.params.id),
      companyId: req.companyId
    })

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable dans cette entreprise.' })

    res.json(sanitizeUser(user))
  } catch {
    res.status(400).json({ error: 'Identifiant d\'utilisateur invalide.' })
  }
})

// PUT /api/users/:id - Modifier son propre profil (rôle et service gérés ailleurs)
router.put('/:id', async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id)

    if (userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que votre propre profil.' })
    }

    const { firstName, lastName, email, phone, avatar } = req.body
    const db = getDB()

    const updateFields = { updatedAt: new Date() }

    if (firstName) updateFields.firstName = firstName.trim()
    if (lastName) updateFields.lastName = lastName.trim()
    if (email) updateFields.email = email.toLowerCase().trim()
    if (phone !== undefined) updateFields.phone = String(phone).trim()
    if (avatar) updateFields.avatar = avatar

    const result = await db.collection('users').findOneAndUpdate(
      { _id: userId, companyId: req.companyId },
      { $set: updateFields },
      { returnDocument: 'after' }
    )

    if (!result) return res.status(404).json({ error: 'Utilisateur introuvable dans cette entreprise.' })

    res.json(sanitizeUser(result))
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// PATCH /api/users/:id/department-request - Demander (ou annuler) un changement de service
router.patch('/:id/department-request', async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id)
    if (userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que votre propre demande.' })
    }
    if (!req.companyId) {
      return res.status(403).json({ error: 'Vous devez rejoindre une entreprise.' })
    }

    const db = getDB()
    const { departmentId } = req.body

    let request = null
    if (departmentId) {
      const department = await db.collection('departments').findOne({
        _id: new ObjectId(departmentId),
        companyId: req.companyId,
      })
      if (!department) return res.status(400).json({ error: 'Service introuvable dans votre entreprise.' })
      request = {
        departmentId: department._id,
        departmentName: department.name,
        requestedAt: new Date(),
        status: 'pending',
      }
    }

    const updated = await db.collection('users').findOneAndUpdate(
      { _id: userId, companyId: req.companyId },
      { $set: { departmentChangeRequest: request, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )
    if (!updated) return res.status(404).json({ error: 'Utilisateur introuvable.' })

    res.json(sanitizeUser(updated))
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/users/:id - Supprimer son propre compte uniquement
router.delete('/:id', async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id)

    if (userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que votre propre compte.' })
    }

    const db = getDB()
    const result = await db.collection('users').deleteOne({ _id: userId })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' })
    }

    if (req.companyId) {
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
    }

    res.json({ message: 'Compte supprimé avec succès.' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
