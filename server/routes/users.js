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

    // Construire le filtre : masquer les membres en attente sauf si l'utilisateur est admin
    const filter = { companyId: req.companyId }
    if (req.user.role !== 'admin') {
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

// PUT /api/users/:id - Modifier un utilisateur (soi-même ou admin uniquement)
router.put('/:id', async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id)

    // Vérifier que l'utilisateur modifie son propre profil ou est admin
    const isSelf = userId.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que votre propre profil.' })
    }

    const { firstName, lastName, email, role, avatar } = req.body
    const db = getDB()

    const updateFields = { updatedAt: new Date() }

    // Champs modifiables par l'utilisateur lui-même
    if (firstName) updateFields.firstName = firstName.trim()
    if (lastName) updateFields.lastName = lastName.trim()
    if (email) updateFields.email = email.toLowerCase().trim()
    if (avatar) updateFields.avatar = avatar

    // Seul un admin peut modifier le rôle d'un autre utilisateur
    if (role && isAdmin && !isSelf) {
      updateFields.role = role
    }

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

// DELETE /api/users/:id - Supprimer un utilisateur (admin uniquement)
router.delete('/:id', async (req, res) => {
  try {
    // Seul un admin peut supprimer un utilisateur
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Seul un administrateur peut supprimer un utilisateur.' })
    }

    const userId = new ObjectId(req.params.id)
    const db = getDB()

    const result = await db.collection('users').deleteOne({
      _id: userId,
      companyId: req.companyId
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable dans cette entreprise.' })
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

    res.json({ message: 'Utilisateur supprimé avec succès.' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
