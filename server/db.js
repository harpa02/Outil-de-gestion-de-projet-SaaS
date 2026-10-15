import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saas_pm'

let client = null
let db = null

export async function connectDB() {
  if (db) return db

  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
    })

    await client.connect()
    db = client.db()
    console.log(`[MongoDB] Connecté avec succès à : ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`)

    // Initialisation des index pour optimiser les requêtes et préparer le Sharding (Partie II)
    await initIndexes()

    return db
  } catch (error) {
    console.error('[MongoDB] Erreur de connexion:', error.message)
    throw error
  }
}

export function getDB() {
  if (!db) {
    throw new Error('La base de données n\'est pas encore connectée. Appelez connectDB() d\'abord.')
  }
  return db
}

export function getClient() {
  return client
}

async function initIndexes() {
  try {
    const companies = db.collection('companies')
    const users = db.collection('users')
    const projects = db.collection('projects')
    const tasks = db.collection('tasks')

    // Index entreprises
    await companies.createIndex({ slug: 1 }, { unique: true })

    // Index utilisateurs (Clé composite companyId + email pour garantir l'unicité par entreprise)
    await users.createIndex({ companyId: 1, email: 1 }, { unique: true })
    await users.createIndex({ companyId: 1 })

    // Index projets (Clé de partition companyId pour l'isolation et le sharding)
    await projects.createIndex({ companyId: 1, createdAt: -1 })
    await projects.createIndex({ companyId: 1, status: 1 })

    // Index tâches (Optimisation des requêtes Kanban et filtres par projet/assigné)
    await tasks.createIndex({ companyId: 1, projectId: 1, status: 1 })
    await tasks.createIndex({ companyId: 1, assignedUserId: 1 })
    await tasks.createIndex({ companyId: 1, status: 1 })

    console.log('[MongoDB] Index créés avec succès (Isolation multi-tenant & préparation Sharding).')
  } catch (err) {
    console.warn('[MongoDB] Avertissement lors de la création des index:', err.message)
  }
}

export async function closeDB() {
  if (client) {
    await client.close()
    client = null
    db = null
    console.log('[MongoDB] Déconnexion effectuée.')
  }
}
