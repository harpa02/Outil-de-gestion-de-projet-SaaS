import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'
import { requireCompany } from '../middleware/tenant.js'

const router = Router()

// Isolation d'entreprise obligatoire
router.use(requireCompany)

// GET /api/projects - Liste des projets de l'entreprise avec membres et avancement
router.get('/', async (req, res) => {
  try {
    const db = getDB()
    const projects = await db.collection('projects')
      .find({ companyId: req.companyId })
      .sort({ createdAt: -1 })
      .toArray()

    const users = await db.collection('users')
      .find({ companyId: req.companyId })
      .toArray()

    const userMap = new Map(users.map(u => [u._id.toString(), u]))

    // Enrichissement avec tâches et membres
    const enriched = await Promise.all(
      projects.map(async (p) => {
        const tasks = await db.collection('tasks')
          .find({ companyId: req.companyId, projectId: p._id })
          .toArray()

        const members = (p.memberIds || [])
          .map(mId => userMap.get(mId.toString()))
          .filter(Boolean)

        const totalTasks = tasks.length
        const completedTasks = tasks.filter(t => t.status === 'done').length

        return {
          ...p,
          members,
          totalTasks,
          completedTasks,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        }
      })
    )

    res.json(enriched)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/projects/:id - Détail d'un projet
router.get('/:id', async (req, res) => {
  try {
    const projectId = new ObjectId(req.params.id)
    const db = getDB()

    const project = await db.collection('projects').findOne({
      _id: projectId,
      companyId: req.companyId
    })

    if (!project) return res.status(404).json({ error: 'Projet introuvable dans cette entreprise' })

    const [tasks, users] = await Promise.all([
      db.collection('tasks').find({ companyId: req.companyId, projectId }).sort({ createdAt: -1 }).toArray(),
      db.collection('users').find({ companyId: req.companyId }).toArray()
    ])

    const userMap = new Map(users.map(u => [u._id.toString(), u]))

    const populatedTasks = tasks.map(t => ({
      ...t,
      assignedUser: t.assignedUserId ? userMap.get(t.assignedUserId.toString()) : null
    }))

    const members = (project.memberIds || [])
      .map(mId => userMap.get(mId.toString()))
      .filter(Boolean)

    res.json({
      ...project,
      tasks: populatedTasks,
      members
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// POST /api/projects - Créer un nouveau projet
router.post('/', async (req, res) => {
  try {
    const { name, description = '', status = 'in_progress', memberIds = [] } = req.body
    if (!name) {
      return res.status(400).json({ error: 'Le nom du projet est requis' })
    }

    // Convertir et valider les membres comme appartenant à cette entreprise
    const memberObjectIds = memberIds.map(id => new ObjectId(id))
    const db = getDB()

    const validMembersCount = await db.collection('users').countDocuments({
      _id: { $in: memberObjectIds },
      companyId: req.companyId
    })

    if (memberObjectIds.length > 0 && validMembersCount !== memberObjectIds.length) {
      return res.status(400).json({ error: 'Certains utilisateurs assignés n\'appartiennent pas à cette entreprise.' })
    }

    const newProject = {
      companyId: req.companyId,
      name: name.trim(),
      description: description.trim(),
      status, // 'planning' | 'in_progress' | 'completed' | 'archived'
      memberIds: memberObjectIds,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('projects').insertOne(newProject)
    res.status(201).json({ ...newProject, _id: result.insertedId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/projects/:id - Modifier un projet (nom, description, statut, membres)
router.put('/:id', async (req, res) => {
  try {
    const projectId = new ObjectId(req.params.id)
    const { name, description, status, memberIds } = req.body
    const db = getDB()

    const updateDoc = {
      $set: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(status && { status }),
        updatedAt: new Date()
      }
    }

    if (Array.isArray(memberIds)) {
      const memberObjectIds = memberIds.map(id => new ObjectId(id))
      const validMembersCount = await db.collection('users').countDocuments({
        _id: { $in: memberObjectIds },
        companyId: req.companyId
      })
      if (memberObjectIds.length > 0 && validMembersCount !== memberObjectIds.length) {
        return res.status(400).json({ error: 'Certains membres n\'appartiennent pas à cette entreprise.' })
      }
      updateDoc.$set.memberIds = memberObjectIds
    }

    const result = await db.collection('projects').findOneAndUpdate(
      { _id: projectId, companyId: req.companyId },
      updateDoc,
      { returnDocument: 'after' }
    )

    if (!result) return res.status(404).json({ error: 'Projet introuvable' })
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/projects/:id - Supprimer un projet et ses tâches associées
router.delete('/:id', async (req, res) => {
  try {
    const projectId = new ObjectId(req.params.id)
    const db = getDB()

    const result = await db.collection('projects').deleteOne({
      _id: projectId,
      companyId: req.companyId
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Projet introuvable' })
    }

    // Supprimer les tâches rattachées à ce projet
    await db.collection('tasks').deleteMany({
      projectId,
      companyId: req.companyId
    })

    res.json({ message: 'Projet et tâches associées supprimés avec succès' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
