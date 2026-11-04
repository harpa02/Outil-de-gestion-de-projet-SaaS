import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'
import { requireAuth, requireActive, requireRole } from '../middleware/auth.js'
import { sanitizeUser } from './auth.js'

const router = Router()

// GET /api/companies - Liste des entreprises (informations minimales pour l'étape de sélection)
router.get('/', requireAuth, async (req, res) => {
  try {
    const db = getDB()

    // Retourner uniquement les champs nécessaires pour le choix d'entreprise
    const companies = await db.collection('companies')
      .find({}, { projection: { _id: 1, name: 1, description: 1 } })
      .sort({ name: 1 })
      .toArray()

    res.json(companies)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/companies - Créer une nouvelle entreprise et devenir son administrateur
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Le nom de l\'entreprise est requis.' })
    }

    // Génération automatique du slug à partir du nom
    const cleanSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const db = getDB()

    // Vérifier l'unicité du slug
    const existing = await db.collection('companies').findOne({ slug: cleanSlug })
    if (existing) {
      return res.status(400).json({ error: `Une entreprise avec l'identifiant "${cleanSlug}" existe déjà.` })
    }

    // Création du document entreprise
    const newCompany = {
      name: name.trim(),
      slug: cleanSlug,
      description: description?.trim() || '',
      plan: 'Pro',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('companies').insertOne(newCompany)
    const companyDoc = { ...newCompany, _id: result.insertedId }

    // Mettre à jour l'utilisateur courant : le rattacher à l'entreprise en tant qu'admin
    const updatedUser = await db.collection('users').findOneAndUpdate(
      { _id: req.user._id },
      {
        $set: {
          companyId: result.insertedId,
          role: 'admin',
          status: 'active',
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    res.status(201).json({
      company: companyDoc,
      user: sanitizeUser(updatedUser)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/companies/join/:id - Demander à rejoindre une entreprise
router.post('/join/:id', requireAuth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur n'appartient pas déjà à une entreprise
    if (req.user.companyId) {
      return res.status(400).json({ error: 'Vous appartenez déjà à une entreprise.' })
    }

    const companyId = new ObjectId(req.params.id)
    const db = getDB()

    // Vérifier que l'entreprise existe
    const company = await db.collection('companies').findOne({ _id: companyId })
    if (!company) {
      return res.status(404).json({ error: 'Entreprise introuvable.' })
    }

    // Mettre à jour l'utilisateur : rattachement avec statut en attente d'approbation
    const updatedUser = await db.collection('users').findOneAndUpdate(
      { _id: req.user._id },
      {
        $set: {
          companyId: companyId,
          role: 'member',
          status: 'pending_approval',
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    res.json({
      user: sanitizeUser(updatedUser)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/companies/members - Liste des membres de l'entreprise de l'utilisateur connecté
router.get('/members', requireAuth, requireActive, requireRole('admin', 'manager'), async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'Vous devez rejoindre une entreprise.' })
    }

    const db = getDB()

    // Récupérer tous les utilisateurs de l'entreprise (sans le hash du mot de passe)
    const members = await db.collection('users')
      .find({ companyId: req.companyId })
      .sort({ createdAt: -1 })
      .toArray()

    // Compter les membres en attente d'approbation
    const pendingCount = members.filter(m => m.status === 'pending_approval').length

    res.json({
      members: members.map(sanitizeUser),
      pendingCount
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PATCH /api/companies/members/:id/approve - Approuver un membre en attente
router.patch('/members/:id/approve', requireAuth, requireActive, requireRole('admin'), async (req, res) => {
  try {
    const memberId = new ObjectId(req.params.id)
    const db = getDB()

    // Rechercher l'utilisateur dans la même entreprise
    const updatedUser = await db.collection('users').findOneAndUpdate(
      { _id: memberId, companyId: req.companyId },
      { $set: { status: 'active', updatedAt: new Date() } },
      { returnDocument: 'after' }
    )

    if (!updatedUser) {
      return res.status(404).json({ error: 'Membre introuvable dans votre entreprise.' })
    }

    res.json(sanitizeUser(updatedUser))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/companies/members/:id/reject - Rejeter une demande d'adhésion
router.delete('/members/:id/reject', requireAuth, requireActive, requireRole('admin'), async (req, res) => {
  try {
    const memberId = new ObjectId(req.params.id)
    const db = getDB()

    // Rechercher l'utilisateur en attente dans la même entreprise
    const updatedUser = await db.collection('users').findOneAndUpdate(
      { _id: memberId, companyId: req.companyId, status: 'pending_approval' },
      {
        $set: {
          companyId: null,
          status: 'active',
          role: 'member',
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    if (!updatedUser) {
      return res.status(404).json({ error: 'Demande d\'adhésion introuvable ou déjà traitée.' })
    }

    res.json({ message: 'Demande d\'adhésion rejetée avec succès.' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PATCH /api/companies/members/:id/role - Modifier le rôle d'un membre
router.patch('/members/:id/role', requireAuth, requireActive, requireRole('admin'), async (req, res) => {
  try {
    const memberId = new ObjectId(req.params.id)
    const { role } = req.body

    // Validation du rôle
    const validRoles = ['admin', 'manager', 'member']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Rôle invalide. Valeurs autorisées : ${validRoles.join(', ')}.` })
    }

    // Interdire de modifier son propre rôle
    if (memberId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre rôle.' })
    }

    const db = getDB()

    const updatedUser = await db.collection('users').findOneAndUpdate(
      { _id: memberId, companyId: req.companyId },
      { $set: { role, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )

    if (!updatedUser) {
      return res.status(404).json({ error: 'Membre introuvable dans votre entreprise.' })
    }

    res.json(sanitizeUser(updatedUser))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
