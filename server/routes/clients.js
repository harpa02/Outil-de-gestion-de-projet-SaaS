import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'
import { requireAuth, requireActive } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireActive)
router.use((req, res, next) => {
  if (!req.companyId) return res.status(403).json({ error: 'Vous devez rejoindre une entreprise.' })
  next()
})

router.get('/', async (req, res) => {
  try {
    const db = getDB()
    const clients = await db.collection('clients')
      .find({ companyId: req.companyId })
      .sort({ createdAt: -1 })
      .toArray()
    res.json(clients)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { companyName, contactName = '', contactRole = '', contactPhone = '', email = '', address = '' } = req.body
    if (!companyName?.trim()) return res.status(400).json({ error: 'Le nom du client est requis.' })
    if (!contactName.trim()) return res.status(400).json({ error: 'Le nom du contact chez le client est requis.' })
    const db = getDB()
    const doc = {
      companyId: req.companyId,
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      contactRole: contactRole.trim(),
      contactPhone: contactPhone.trim(),
      email: email.trim(),
      address: address.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const result = await db.collection('clients').insertOne(doc)
    res.status(201).json({ ...doc, _id: result.insertedId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const clientId = new ObjectId(req.params.id)
    const { companyName, contactName, contactRole, contactPhone, email, address } = req.body
    const db = getDB()
    const result = await db.collection('clients').findOneAndUpdate(
      { _id: clientId, companyId: req.companyId },
      {
        $set: {
          ...(companyName !== undefined && { companyName: companyName.trim() }),
          ...(contactName !== undefined && { contactName: contactName.trim() }),
          ...(contactRole !== undefined && { contactRole: contactRole.trim() }),
          ...(contactPhone !== undefined && { contactPhone: contactPhone.trim() }),
          ...(email !== undefined && { email: email.trim() }),
          ...(address !== undefined && { address: address.trim() }),
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    )
    if (!result) return res.status(404).json({ error: 'Client introuvable.' })
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const clientId = new ObjectId(req.params.id)
    const db = getDB()
    const result = await db.collection('clients').deleteOne({ _id: clientId, companyId: req.companyId })
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Client introuvable.' })
    res.json({ message: 'Client supprimé.' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
