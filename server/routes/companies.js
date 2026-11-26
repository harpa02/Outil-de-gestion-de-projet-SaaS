import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'
import { requireAuth, requireActive, requireRole } from '../middleware/auth.js'
import { sanitizeUser } from './auth.js'
import { ROLES, canChangeRole } from '../constants.js'

const router = Router()

function isSameCompany(req, companyId) {
  return Boolean(req.companyId && req.companyId.toString() === companyId.toString())
}

// GET /api/companies - Liste des entreprises
router.get('/', requireAuth, async (req, res) => {
  try {
    const db = getDB()
    const companies = await db.collection('companies').find({}).sort({ name: 1 }).toArray()
    const enriched = await Promise.all(companies.map(async (company) => {
      const [userCount, projectCount, taskCount] = await Promise.all([
        db.collection('users').countDocuments({ companyId: company._id }),
        db.collection('projects').countDocuments({ companyId: company._id }),
        db.collection('tasks').countDocuments({ companyId: company._id }),
      ])
      return { ...company, userCount, projectCount, taskCount }
    }))
    res.json(enriched)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/companies - Créer une entreprise (uniquement depuis l'onboarding)
router.post('/', requireAuth, async (req, res) => {
  try {
    if (req.user.companyId) {
      return res.status(400).json({ error: 'Vous appartenez déjà à une entreprise (un utilisateur = une entreprise).' })
    }

    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Le nom de l\'entreprise est requis.' })
    }

    const cleanSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const db = getDB()

    const existing = await db.collection('companies').findOne({ slug: cleanSlug })
    if (existing) {
      return res.status(400).json({ error: `Une entreprise avec l'identifiant "${cleanSlug}" existe déjà.` })
    }

    const vatRate = Number(req.body.vatRate)
    const newCompany = {
      name: name.trim(),
      slug: cleanSlug,
      description: description?.trim() || '',
      plan: req.body.plan?.trim() || 'Pro',
      vatRate: Number.isFinite(vatRate) && vatRate >= 0 ? vatRate : 20,
      createdBy: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('companies').insertOne(newCompany)
    const companyDoc = { ...newCompany, _id: result.insertedId }

    // Le CEO appartient toujours au service « CEO » créé avec l'entreprise.
    const ceoDepartmentResult = await db.collection('departments').insertOne({
      companyId: result.insertedId,
      name: 'CEO',
      createdBy: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      system: true,
    })

    const updatedUser = await db.collection('users').findOneAndUpdate(
      { _id: req.user._id },
      {
        $set: {
          companyId: result.insertedId,
          role: ROLES.CEO,
          status: 'active',
          jobTitle: 'CEO',
          departmentId: ceoDepartmentResult.insertedId,
          managedDepartmentId: null,
          departmentChangeRequest: null,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    res.status(201).json({
      company: companyDoc,
      user: sanitizeUser(updatedUser),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/companies/:id - CEO : tous les champs ; Manager : description uniquement
router.put('/:id', requireAuth, requireActive, async (req, res) => {
  try {
    const companyId = new ObjectId(req.params.id)
    const db = getDB()
    const company = await db.collection('companies').findOne({ _id: companyId })
    if (!company) return res.status(404).json({ error: 'Entreprise introuvable.' })
    if (!isSameCompany(req, companyId)) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que votre entreprise.' })
    }

    const isCeo = req.user.role === ROLES.CEO
    const isManager = req.user.role === ROLES.MANAGER
    if (!isCeo && !isManager) {
      return res.status(403).json({ error: 'Accès refusé.' })
    }

    const update = { updatedAt: new Date() }

    if (isCeo) {
      const { name, description, plan, vatRate } = req.body
      if (name !== undefined) {
        if (!name.trim()) return res.status(400).json({ error: 'Le nom de l\'entreprise est requis.' })
        const cleanSlug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const existing = await db.collection('companies').findOne({ slug: cleanSlug, _id: { $ne: companyId } })
        if (existing) return res.status(400).json({ error: `Une entreprise avec l'identifiant "${cleanSlug}" existe déjà.` })
        update.name = name.trim()
        update.slug = cleanSlug
      }
      if (description !== undefined) update.description = description.trim()
      if (plan !== undefined) update.plan = plan.trim() || company.plan
      if (vatRate !== undefined) {
        const rate = Number(vatRate)
        if (!Number.isFinite(rate) || rate < 0) {
          return res.status(400).json({ error: 'La TVA doit être un pourcentage positif.' })
        }
        update.vatRate = rate
      }
    } else {
      const forbidden = ['name', 'plan', 'vatRate'].filter(key => req.body[key] !== undefined)
      if (forbidden.length > 0) {
        return res.status(403).json({ error: 'Un Manager ne peut modifier que la description de l\'entreprise.' })
      }
      if (req.body.description !== undefined) update.description = req.body.description.trim()
    }

    const updated = await db.collection('companies').findOneAndUpdate(
      { _id: companyId },
      { $set: update },
      { returnDocument: 'after' }
    )
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/companies/:id - Créateur (CEO) uniquement
router.delete('/:id', requireAuth, requireActive, requireRole(ROLES.CEO), async (req, res) => {
  try {
    const companyId = new ObjectId(req.params.id)
    const db = getDB()
    const company = await db.collection('companies').findOne({ _id: companyId })
    if (!company) return res.status(404).json({ error: 'Entreprise introuvable.' })
    if (!company.createdBy || company.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Seul le créateur de l\'entreprise peut la supprimer.' })
    }

    await Promise.all([
      db.collection('tasks').deleteMany({ companyId }),
      db.collection('projects').deleteMany({ companyId }),
      db.collection('clients').deleteMany({ companyId }),
      db.collection('invoices').deleteMany({ companyId }),
      db.collection('departments').deleteMany({ companyId }),
      db.collection('users').deleteMany({ companyId }),
      db.collection('companies').deleteOne({ _id: companyId }),
    ])
    res.json({ message: 'Entreprise supprimée avec succès.' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/companies/join/:id - Demander à rejoindre une entreprise
router.post('/join/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.companyId) {
      return res.status(400).json({ error: 'Vous appartenez déjà à une entreprise (un utilisateur = une entreprise).' })
    }

    const companyId = new ObjectId(req.params.id)
    const db = getDB()

    const company = await db.collection('companies').findOne({ _id: companyId })
    if (!company) {
      return res.status(404).json({ error: 'Entreprise introuvable.' })
    }

    const updatedUser = await db.collection('users').findOneAndUpdate(
      { _id: req.user._id, companyId: null },
      {
        $set: {
          companyId,
          role: ROLES.EMPLOYEE,
          status: 'pending_approval',
          jobTitle: '',
          departmentId: null,
          managedDepartmentId: null,
          departmentChangeRequest: null,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )
    if (!updatedUser) {
      return res.status(400).json({ error: 'Vous appartenez déjà à une entreprise (un utilisateur = une entreprise).' })
    }

    res.json({ user: sanitizeUser(updatedUser) })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/companies/members - Membres de l'entreprise (CEO / Manager)
router.get('/members', requireAuth, requireActive, requireRole(ROLES.CEO, ROLES.MANAGER), async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'Vous devez rejoindre une entreprise.' })
    }

    const db = getDB()
    const members = await db.collection('users')
      .find({ companyId: req.companyId })
      .sort({ createdAt: -1 })
      .toArray()

    const pendingCount = members.filter(m => m.status === 'pending_approval').length

    res.json({
      members: members.map(sanitizeUser),
      pendingCount,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PATCH /api/companies/members/:id/approve - Approuver une adhésion (CEO)
router.patch('/members/:id/approve', requireAuth, requireActive, requireRole(ROLES.CEO), async (req, res) => {
  try {
    const memberId = new ObjectId(req.params.id)
    const db = getDB()

    const updatedUser = await db.collection('users').findOneAndUpdate(
      { _id: memberId, companyId: req.companyId, status: 'pending_approval' },
      { $set: { status: 'active', role: ROLES.EMPLOYEE, updatedAt: new Date() } },
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

// DELETE /api/companies/members/:id/reject - Refuser une adhésion (CEO)
router.delete('/members/:id/reject', requireAuth, requireActive, requireRole(ROLES.CEO), async (req, res) => {
  try {
    const memberId = new ObjectId(req.params.id)
    const db = getDB()

    const updatedUser = await db.collection('users').findOneAndUpdate(
      { _id: memberId, companyId: req.companyId, status: 'pending_approval' },
      {
        $set: {
          companyId: null,
          status: 'active',
          role: ROLES.EMPLOYEE,
          updatedAt: new Date(),
        },
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

// PATCH /api/companies/members/:id/role - Matrice de permissions des rôles
router.patch('/members/:id/role', requireAuth, requireActive, async (req, res) => {
  try {
    const memberId = new ObjectId(req.params.id)
    const db = getDB()
    const target = await db.collection('users').findOne({
      _id: memberId,
      companyId: req.companyId,
      status: 'active',
    })
    if (!target) return res.status(404).json({ error: 'Membre introuvable dans votre entreprise.' })

    const decision = canChangeRole(req.user, target, req.body.role)
    if (!decision.ok) return res.status(decision.status).json({ error: decision.error })

    const updatedUser = await db.collection('users').findOneAndUpdate(
      { _id: memberId, companyId: req.companyId },
      { $set: { role: req.body.role, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )

    res.json(sanitizeUser(updatedUser))
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// PATCH /api/companies/members/:id/assignment - Service, poste et service managé
router.patch('/members/:id/assignment', requireAuth, requireActive, async (req, res) => {
  try {
    const memberId = new ObjectId(req.params.id)
    const db = getDB()
    const target = await db.collection('users').findOne({
      _id: memberId,
      companyId: req.companyId,
      status: 'active',
    })
    if (!target) return res.status(404).json({ error: 'Membre introuvable dans votre entreprise.' })

    if (target.role === ROLES.CEO) {
      return res.status(403).json({ error: 'Le service du CEO est géré dans les paramètres de l\'entreprise.' })
    }

    const isCeo = req.user.role === ROLES.CEO
    const isManager = req.user.role === ROLES.MANAGER
    const isSelfManager = isManager && target._id.toString() === req.user._id.toString()

    if (!isCeo && !(isManager && (target.role === ROLES.EMPLOYEE || isSelfManager))) {
      return res.status(403).json({ error: 'Accès refusé.' })
    }

    const update = { updatedAt: new Date() }

    const checkDepartment = async (value) => {
      if (value === null || value === '') return null
      const department = await db.collection('departments').findOne({
        _id: new ObjectId(value),
        companyId: req.companyId,
      })
      if (!department) throw new Error('Service introuvable dans votre entreprise.')
      return department._id
    }

    if (req.body.departmentId !== undefined) {
      update.departmentId = await checkDepartment(req.body.departmentId)
    }
    if (req.body.jobTitle !== undefined) {
      update.jobTitle = String(req.body.jobTitle).trim()
    }
    if (req.body.managedDepartmentId !== undefined) {
      if (!isCeo && !isSelfManager) {
        return res.status(403).json({ error: 'Seul le CEO peut désigner le service d\'un autre Manager.' })
      }
      update.managedDepartmentId = await checkDepartment(req.body.managedDepartmentId)
    }

    const updated = await db.collection('users').findOneAndUpdate(
      { _id: memberId, companyId: req.companyId },
      { $set: update },
      { returnDocument: 'after' }
    )
    res.json(sanitizeUser(updated))
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// PATCH /api/companies/members/:id/department-request - Traiter une demande de service
router.patch('/members/:id/department-request', requireAuth, requireActive, async (req, res) => {
  try {
    const memberId = new ObjectId(req.params.id)
    const db = getDB()
    const target = await db.collection('users').findOne({
      _id: memberId,
      companyId: req.companyId,
      status: 'active',
    })
    if (!target) return res.status(404).json({ error: 'Membre introuvable dans votre entreprise.' })
    if (!target.departmentChangeRequest) {
      return res.status(400).json({ error: 'Aucune demande de changement en attente.' })
    }

    const isCeo = req.user.role === ROLES.CEO
    const isManager = req.user.role === ROLES.MANAGER
    if (target.role === ROLES.CEO || (!isCeo && !(isManager && target.role === ROLES.EMPLOYEE))) {
      return res.status(403).json({ error: 'Seul le supérieur hiérarchique peut traiter cette demande.' })
    }

    const approved = Boolean(req.body.approved)
    let newDepartmentId = target.departmentId || null
    if (approved) {
      const department = await db.collection('departments').findOne({
        _id: new ObjectId(target.departmentChangeRequest.departmentId),
        companyId: req.companyId,
      })
      if (!department) return res.status(400).json({ error: 'Le service demandé n\'existe plus.' })
      newDepartmentId = department._id
    }

    const updated = await db.collection('users').findOneAndUpdate(
      { _id: memberId, companyId: req.companyId },
      {
        $set: {
          departmentId: newDepartmentId,
          departmentChangeRequest: null,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )
    res.json(sanitizeUser(updated))
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
