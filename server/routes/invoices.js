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
    const invoices = await db.collection('invoices').find({ companyId: req.companyId }).sort({ date: -1, createdAt: -1 }).toArray()
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { clientId, description = '', amountHT, vatRate = 20, status = 'pending', paymentMethod = 'Virement', date } = req.body
    if (!clientId) return res.status(400).json({ error: 'Le client est requis.' })
    const ht = Number(amountHT)
    if (!(ht > 0)) return res.status(400).json({ error: 'Le montant HT doit être supérieur à 0.' })

    const db = getDB()
    const client = await db.collection('clients').findOne({ _id: new ObjectId(clientId), companyId: req.companyId })
    if (!client) return res.status(400).json({ error: 'Client introuvable.' })

    const vat = Number(vatRate) || 0
    const vatAmount = +(ht * (vat / 100)).toFixed(2)
    const totalTTC = +(ht + vatAmount).toFixed(2)
    const count = await db.collection('invoices').countDocuments({ companyId: req.companyId })
    const ref = `FAC-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const needsApproval = req.user.role === 'member'
    const doc = {
      companyId: req.companyId,
      clientId: client._id,
      clientName: client.companyName,
      ref,
      description: (description || '').trim() || `Prestation pour ${client.companyName}`,
      amountHT: +ht.toFixed(2),
      vatRate: vat,
      vatAmount,
      totalTTC,
      status: ['pending', 'paid', 'overdue'].includes(status) ? status : 'pending',
      paymentMethod,
      date: date ? new Date(date) : new Date(),
      createdBy: req.user._id,
      approvalStatus: needsApproval ? 'pending' : 'approved',
      approvedAt: needsApproval ? null : new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const result = await db.collection('invoices').insertOne(doc)
    res.status(201).json({ ...doc, _id: result.insertedId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PATCH /api/invoices/:id/approve - Valider une facture (manager/admin)
router.patch('/:id/approve', async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Seul un manager ou un administrateur peut valider une facture.' })
    }
    const db = getDB()
    const result = await db.collection('invoices').findOneAndUpdate(
      { _id: new ObjectId(req.params.id), companyId: req.companyId },
      { $set: { approvalStatus: 'approved', approvedAt: new Date(), approvedBy: req.user._id, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )
    if (!result) return res.status(404).json({ error: 'Facture introuvable.' })
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    if (!['pending', 'paid', 'overdue'].includes(status)) return res.status(400).json({ error: 'Statut invalide.' })
    const db = getDB()
    const result = await db.collection('invoices').findOneAndUpdate(
      { _id: new ObjectId(req.params.id), companyId: req.companyId },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )
    if (!result) return res.status(404).json({ error: 'Facture introuvable.' })
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const db = getDB()
    const result = await db.collection('invoices').deleteOne({ _id: new ObjectId(req.params.id), companyId: req.companyId })
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Facture introuvable.' })
    res.json({ message: 'Facture supprimée.' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
