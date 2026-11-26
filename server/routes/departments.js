import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'
import { requireAuth, requireActive, requireRole } from '../middleware/auth.js'
import { ROLES } from '../constants.js'

const router = Router()

router.use(requireAuth, requireActive)
router.use((req, res, next) => {
  if (!req.companyId) return res.status(403).json({ error: 'Vous devez rejoindre une entreprise.' })
  next()
})

// Le service « CEO » auquel le CEO est affecté ne peut ni être renommé ni supprimé.
async function isCeoDepartment(db, companyId, departmentId) {
  const department = await db.collection('departments').findOne({ _id: departmentId, companyId })
  if (!department || String(department.name).toLowerCase() !== 'ceo') return false
  const ceo = await db.collection('users').findOne({ companyId, role: ROLES.CEO, departmentId })
  return Boolean(ceo)
}

// GET /api/departments — lecture pour tous les membres actifs
router.get('/', async (req, res) => {
  try {
    const departments = await getDB()
      .collection('departments')
      .find({ companyId: req.companyId })
      .sort({ name: 1 })
      .toArray()
    res.json(departments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/departments — création réservée au CEO
router.post('/', requireRole(ROLES.CEO), async (req, res) => {
  try {
    const name = String(req.body.name || '').trim()
    if (!name) return res.status(400).json({ error: 'Le nom du service est requis.' })

    const db = getDB()
    const existing = await db.collection('departments').findOne({
      companyId: req.companyId,
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    })
    if (existing) return res.status(400).json({ error: 'Ce service existe déjà.' })

    const doc = {
      companyId: req.companyId,
      name,
      createdBy: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = await db.collection('departments').insertOne(doc)
    res.status(201).json({ ...doc, _id: result.insertedId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/departments/:id — renommage réservé au CEO
router.put('/:id', requireRole(ROLES.CEO), async (req, res) => {
  try {
    const name = String(req.body.name || '').trim()
    if (!name) return res.status(400).json({ error: 'Le nom du service est requis.' })

    const db = getDB()
    const departmentId = new ObjectId(req.params.id)
    if (await isCeoDepartment(db, req.companyId, departmentId)) {
      return res.status(400).json({ error: 'Le service « CEO » du CEO ne peut pas être renommé.' })
    }
    const result = await db.collection('departments').findOneAndUpdate(
      { _id: departmentId, companyId: req.companyId },
      { $set: { name, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )
    if (!result) return res.status(404).json({ error: 'Service introuvable.' })
    res.json(result)
  } catch {
    res.status(400).json({ error: 'Identifiant de service invalide.' })
  }
})

// DELETE /api/departments/:id — suppression réservée au CEO
router.delete('/:id', requireRole(ROLES.CEO), async (req, res) => {
  try {
    const departmentId = new ObjectId(req.params.id)
    const db = getDB()
    if (await isCeoDepartment(db, req.companyId, departmentId)) {
      return res.status(400).json({ error: 'Le service « CEO » du CEO ne peut pas être supprimé.' })
    }
    const result = await db.collection('departments').deleteOne({
      _id: departmentId,
      companyId: req.companyId,
    })
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Service introuvable.' })

    await Promise.all([
      db.collection('users').updateMany(
        { companyId: req.companyId, departmentId },
        { $set: { departmentId: null, updatedAt: new Date() } }
      ),
      db.collection('users').updateMany(
        { companyId: req.companyId, managedDepartmentId: departmentId },
        { $set: { managedDepartmentId: null, updatedAt: new Date() } }
      ),
      db.collection('users').updateMany(
        { companyId: req.companyId, 'departmentChangeRequest.departmentId': departmentId },
        { $set: { departmentChangeRequest: null, updatedAt: new Date() } }
      ),
    ])

    res.json({ message: 'Service supprimé.' })
  } catch {
    res.status(400).json({ error: 'Identifiant de service invalide.' })
  }
})

export default router
