import { ObjectId } from 'mongodb'
import { getDB } from './db.js'

/**
 * Initialise automatiquement des données de démonstration multi-entreprises
 * si la base de données est vide au démarrage.
 */
export async function seedInitialData() {
  const db = getDB()
  const companyCount = await db.collection('companies').countDocuments()

  if (companyCount > 0) {
    console.log(`[Seed] Base de données déjà initialisée (${companyCount} entreprise(s) existante(s)).`)
    return
  }

  console.log('[Seed] Base de données vide : injection des données de démarrage multi-entreprises...')

  // 1. Création de deux entreprises distinctes pour tester l'isolation
  const companyAId = new ObjectId()
  const companyBId = new ObjectId()

  const companies = [
    {
      _id: companyAId,
      name: 'Acme Innovation SaaS',
      slug: 'acme-innovation',
      description: 'Startup spécialisée dans les solutions Cloud & SaaS B2B.',
      plan: 'Enterprise',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: companyBId,
      name: 'Nova Studio Digital',
      slug: 'nova-studio',
      description: 'Agence créative et studio de design de produits digitaux.',
      plan: 'Pro',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  await db.collection('companies').insertMany(companies)

  // 2. Utilisateurs Entreprise A
  const userA1 = {
    _id: new ObjectId(),
    companyId: companyAId,
    name: 'Alice Martin',
    email: 'alice@acme.com',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Alice%20Martin',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const userA2 = {
    _id: new ObjectId(),
    companyId: companyAId,
    name: 'Bob Dupont',
    email: 'bob@acme.com',
    role: 'manager',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Bob%20Dupont',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const userA3 = {
    _id: new ObjectId(),
    companyId: companyAId,
    name: 'Claire Leroy',
    email: 'claire@acme.com',
    role: 'member',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Claire%20Leroy',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  // Utilisateurs Entreprise B (stricte étanchéité)
  const userB1 = {
    _id: new ObjectId(),
    companyId: companyBId,
    name: 'David Moreau',
    email: 'david@nova.io',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=David%20Moreau',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const userB2 = {
    _id: new ObjectId(),
    companyId: companyBId,
    name: 'Emma Bernard',
    email: 'emma@nova.io',
    role: 'member',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Emma%20Bernard',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  await db.collection('users').insertMany([userA1, userA2, userA3, userB1, userB2])

  // 3. Projets
  const projectA1Id = new ObjectId()
  const projectA2Id = new ObjectId()
  const projectB1Id = new ObjectId()

  const projects = [
    {
      _id: projectA1Id,
      companyId: companyAId,
      name: 'Refonte Plateforme Web v2',
      description: 'Migration complète vers architecture micro-services et nouveau tableau de bord.',
      status: 'in_progress',
      memberIds: [userA1._id, userA2._id, userA3._id],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: projectA2Id,
      companyId: companyAId,
      name: 'Application Mobile iOS/Android',
      description: 'Développement de l\'application mobile compagnon avec notifications push.',
      status: 'planning',
      memberIds: [userA1._id, userA3._id],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: projectB1Id,
      companyId: companyBId,
      name: 'Identité Visuelle & Branding 2026',
      description: 'Création de la nouvelle charte graphique, kit UI et design system.',
      status: 'in_progress',
      memberIds: [userB1._id, userB2._id],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  await db.collection('projects').insertMany(projects)

  // 4. Tâches pour le Kanban (Entreprise A)
  const tasks = [
    {
      companyId: companyAId,
      projectId: projectA1Id,
      title: 'Modélisation des schémas MongoDB & Multi-tenancy',
      description: 'Définir les collections companies, users, projects, tasks avec clé d\'isolation companyId.',
      status: 'done',
      priority: 'high',
      assignedUserId: userA1._id,
      dueDate: new Date(Date.now() + 86400000 * 2),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      companyId: companyAId,
      projectId: projectA1Id,
      title: 'Implémentation du Tableau Kanban interactif',
      description: 'Permettre le drag & drop ou le déplacement direct des tâches entre colonnes de statut.',
      status: 'in_progress',
      priority: 'urgent',
      assignedUserId: userA2._id,
      dueDate: new Date(Date.now() + 86400000 * 4),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      companyId: companyAId,
      projectId: projectA1Id,
      title: 'Conteneurisation Docker & Docker Compose',
      description: 'Créer le Dockerfile multi-stage et le compose.yml avec healthcheck MongoDB.',
      status: 'review',
      priority: 'high',
      assignedUserId: userA1._id,
      dueDate: new Date(Date.now() + 86400000 * 3),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      companyId: companyAId,
      projectId: projectA1Id,
      title: 'Rédaction des Spécifications Techniques & Fonctionnelles',
      description: 'Rédiger la documentation avec schémas JSON et anticipation sharding Partie II.',
      status: 'todo',
      priority: 'medium',
      assignedUserId: userA3._id,
      dueDate: new Date(Date.now() + 86400000 * 7),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      companyId: companyAId,
      projectId: projectA2Id,
      title: 'Spécification de l\'API GraphQL / REST mobile',
      description: 'Définir les endpoints d\'authentification et de synchronisation hors-ligne.',
      status: 'todo',
      priority: 'low',
      assignedUserId: userA3._id,
      dueDate: new Date(Date.now() + 86400000 * 10),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Tâches Entreprise B (étanches à A)
    {
      companyId: companyBId,
      projectId: projectB1Id,
      title: 'Design System Figma & Tokens de couleur',
      description: 'Création des composants réutilisables boutons, formulaires et cartes.',
      status: 'in_progress',
      priority: 'high',
      assignedUserId: userB2._id,
      dueDate: new Date(Date.now() + 86400000 * 5),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  await db.collection('tasks').insertMany(tasks)

  console.log('[Seed] Données initiales créées avec succès pour "Acme Innovation SaaS" et "Nova Studio Digital".')
}
