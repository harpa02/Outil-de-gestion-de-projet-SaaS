import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

import { connectDB, getDB } from './db.js'
import { seedInitialData } from './seed.js'

import authRouter from './routes/auth.js'
import companiesRouter from './routes/companies.js'
import usersRouter from './routes/users.js'
import projectsRouter from './routes/projects.js'
import tasksRouter from './routes/tasks.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares globaux
app.use(cors())
app.use(express.json())

// Logs des requêtes API (authentification JWT, plus de X-Company-Id)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`)
  }
  next()
})

// Route de santé (Healthcheck utile pour Docker / monitoring)
app.get('/api/health', (req, res) => {
  try {
    const db = getDB()
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    })
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', message: err.message })
  }
})

// Enregistrement des routes API
app.use('/api/auth', authRouter)
app.use('/api/companies', companiesRouter)
app.use('/api/users', usersRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/tasks', tasksRouter)

// Gestion du frontend en production (Single Page Application)
const distPath = path.join(__dirname, '../dist')
if (fs.existsSync(distPath)) {
  console.log(`[Static] Distribution frontend servie depuis : ${distPath}`)
  app.use(express.static(distPath))

  // Redirection des routes SPA (sauf /api) vers index.html
  app.get('/{*path}', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'))
    } else {
      res.status(404).json({ error: 'Endpoint API introuvable' })
    }
  })
}

// Démarrage du serveur et initialisation MongoDB
async function startServer() {
  try {
    await connectDB()
    await seedInitialData()

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`)
      console.log(`🚀 SaaS Project Manager démarré sur http://0.0.0.0:${PORT}`)
      console.log(`📁 API disponible sur http://localhost:${PORT}/api`)
      console.log(`=======================================================`)
    })
  } catch (error) {
    console.error('Erreur fatale au démarrage du serveur:', error)
    process.exit(1)
  }
}

startServer()
