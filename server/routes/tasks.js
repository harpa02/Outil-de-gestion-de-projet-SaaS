import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'
import { requireAuth, requireActive } from '../middleware/auth.js'

const router = Router()

// Authentification et compte actif requis pour toutes les routes tâches
router.use(requireAuth, requireActive)

// Vérification que l'utilisateur appartient à une entreprise
router.use((req, res, next) => {
  if (!req.companyId) {
    return res.status(403).json({ error: 'Vous devez rejoindre une entreprise.' })
  }
  next()
})

// GET /api/tasks - Liste des tâches avec filtres (projet, utilisateur, statut) et population
router.get('/', async (req, res) => {
  try {
    const { projectId, assignedUserId, status } = req.query
    const db = getDB()

    const filter = { companyId: req.companyId }

    if (projectId) {
      filter.projectId = new ObjectId(projectId)
    }
    if (assignedUserId) {
      filter.assignedUserId = assignedUserId === 'unassigned' ? null : new ObjectId(assignedUserId)
    }
    if (status) {
      filter.status = status
    }

    const tasks = await db.collection('tasks')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    // Récupérer les projets et utilisateurs pour enrichir les cartes Kanban
    const [projects, users] = await Promise.all([
      db.collection('projects').find({ companyId: req.companyId }).toArray(),
      db.collection('users').find({ companyId: req.companyId }).toArray()
    ])

    const projectMap = new Map(projects.map(p => [p._id.toString(), p]))
    const userMap = new Map(users.map(u => [u._id.toString(), u]))

    const populated = tasks.map(t => ({
      ...t,
      project: projectMap.get(t.projectId?.toString()) || null,
      assignedUser: t.assignedUserId ? userMap.get(t.assignedUserId.toString()) || null : null
    }))

    res.json(populated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/tasks/:id - Détail d'une tâche
router.get('/:id', async (req, res) => {
  try {
    const taskId = new ObjectId(req.params.id)
    const db = getDB()

    const task = await db.collection('tasks').findOne({
      _id: taskId,
      companyId: req.companyId
    })

    if (!task) return res.status(404).json({ error: 'Tâche introuvable dans cette entreprise' })

    const [project, user] = await Promise.all([
      db.collection('projects').findOne({ _id: task.projectId, companyId: req.companyId }),
      task.assignedUserId ? db.collection('users').findOne({ _id: task.assignedUserId, companyId: req.companyId }) : null
    ])

    res.json({
      ...task,
      project,
      assignedUser: user
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// POST /api/tasks - Créer une nouvelle tâche dans un projet
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description = '',
      projectId,
      assignedUserId = null,
      status = 'todo',
      priority = 'medium',
      dueDate = null
    } = req.body

    if (!title || !projectId) {
      return res.status(400).json({ error: 'Le titre et le projet sont obligatoires pour créer une tâche.' })
    }

    const db = getDB()
    const projectObjectId = new ObjectId(projectId)

    // Vérifier que le projet existe et appartient bien à l'entreprise
    const project = await db.collection('projects').findOne({
      _id: projectObjectId,
      companyId: req.companyId
    })

    if (!project) {
      return res.status(400).json({ error: 'Le projet spécifié n\'existe pas dans cette entreprise.' })
    }

    // Vérifier l'utilisateur assigné s'il y en a un
    let assignedUserObjectId = null
    if (assignedUserId) {
      assignedUserObjectId = new ObjectId(assignedUserId)
      const user = await db.collection('users').findOne({
        _id: assignedUserObjectId,
        companyId: req.companyId
      })
      if (!user) {
        return res.status(400).json({ error: 'L\'utilisateur assigné n\'appartient pas à cette entreprise.' })
      }
    }

    const newTask = {
      companyId: req.companyId,
      projectId: projectObjectId,
      title: title.trim(),
      description: description.trim(),
      status, // 'todo' | 'in_progress' | 'review' | 'done'
      priority, // 'low' | 'medium' | 'high' | 'urgent'
      assignedUserId: assignedUserObjectId,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('tasks').insertOne(newTask)

    // Récupérer la tâche insérée enrichie
    const inserted = { ...newTask, _id: result.insertedId, project }
    if (assignedUserObjectId) {
      inserted.assignedUser = await db.collection('users').findOne({ _id: assignedUserObjectId })
    }

    res.status(201).json(inserted)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PATCH /api/tasks/:id/status - Mise à jour rapide du statut (spécifique au Kanban)
router.patch('/:id/status', async (req, res) => {
  try {
    const taskId = new ObjectId(req.params.id)
    const { status } = req.body

    const validStatuses = ['todo', 'in_progress', 'review', 'done']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}` })
    }

    const db = getDB()
    const result = await db.collection('tasks').findOneAndUpdate(
      { _id: taskId, companyId: req.companyId },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )

    if (!result) return res.status(404).json({ error: 'Tâche introuvable' })
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// PUT /api/tasks/:id - Modifier une tâche complète
router.put('/:id', async (req, res) => {
  try {
    const taskId = new ObjectId(req.params.id)
    const { title, description, projectId, assignedUserId, status, priority, dueDate } = req.body
    const db = getDB()

    const updateDoc = {
      $set: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        updatedAt: new Date()
      }
    }

    if (projectId) {
      const pId = new ObjectId(projectId)
      const project = await db.collection('projects').findOne({ _id: pId, companyId: req.companyId })
      if (!project) return res.status(400).json({ error: 'Projet introuvable dans cette entreprise' })
      updateDoc.$set.projectId = pId
    }

    if (assignedUserId !== undefined) {
      if (assignedUserId === null || assignedUserId === '') {
        updateDoc.$set.assignedUserId = null
      } else {
        const uId = new ObjectId(assignedUserId)
        const user = await db.collection('users').findOne({ _id: uId, companyId: req.companyId })
        if (!user) return res.status(400).json({ error: 'Utilisateur introuvable dans cette entreprise' })
        updateDoc.$set.assignedUserId = uId
      }
    }

    const result = await db.collection('tasks').findOneAndUpdate(
      { _id: taskId, companyId: req.companyId },
      updateDoc,
      { returnDocument: 'after' }
    )

    if (!result) return res.status(404).json({ error: 'Tâche introuvable' })
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/tasks/:id - Supprimer une tâche
router.delete('/:id', async (req, res) => {
  try {
    const taskId = new ObjectId(req.params.id)
    const db = getDB()

    const result = await db.collection('tasks').deleteOne({
      _id: taskId,
      companyId: req.companyId
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Tâche introuvable' })
    }

    res.json({ message: 'Tâche supprimée avec succès' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
