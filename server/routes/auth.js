import { Router } from 'express'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getDB } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Clé secrète JWT (à remplacer en production via variable d'environnement)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

// Durée de validité du token JWT (7 jours)
const JWT_EXPIRES_IN = '7d'

/**
 * Fonction utilitaire pour retirer le champ passwordHash d'un document utilisateur.
 * Utilisée dans toutes les réponses API pour ne jamais exposer le hash.
 * @param {Object} user - Document utilisateur MongoDB
 * @returns {Object|null} - Utilisateur sans passwordHash
 */
export function sanitizeUser(user) {
  if (!user) return null
  const { passwordHash, ...rest } = user
  return rest
}

/**
 * Génère un token JWT pour un utilisateur donné.
 * @param {ObjectId} userId - Identifiant MongoDB de l'utilisateur
 * @returns {string} - Token JWT signé
 */
function generateToken(userId) {
  return jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// POST /api/auth/register - Inscription d'un nouvel utilisateur
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body

    // Validation des champs obligatoires
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis (firstName, lastName, email, password).' })
    }

    // Validation de la longueur du mot de passe
    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' })
    }

    const cleanEmail = email.toLowerCase().trim()
    const db = getDB()

    // Vérification de l'unicité de l'email (globale, insensible à la casse)
    const existing = await db.collection('users').findOne({ email: cleanEmail })
    if (existing) {
      return res.status(400).json({ error: 'Un compte avec cet email existe déjà.' })
    }

    // Hashage du mot de passe avec bcrypt (salt rounds = 10)
    const passwordHash = await bcrypt.hash(password, 10)

    // Création du document utilisateur
    const newUser = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      passwordHash,
      companyId: null,
      role: 'member',
      status: 'active',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName.trim() + ' ' + lastName.trim())}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('users').insertOne(newUser)
    const userDoc = { ...newUser, _id: result.insertedId }

    // Génération du token JWT
    const token = generateToken(userDoc._id)

    res.status(201).json({
      token,
      user: sanitizeUser(userDoc)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/auth/login - Connexion d'un utilisateur existant
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'L\'email et le mot de passe sont requis.' })
    }

    const cleanEmail = email.toLowerCase().trim()
    const db = getDB()

    // Recherche de l'utilisateur par email (insensible à la casse)
    const user = await db.collection('users').findOne({ email: cleanEmail })
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' })
    }

    // Vérification du mot de passe avec bcrypt
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' })
    }

    // Génération du token JWT
    const token = generateToken(user._id)

    res.json({
      token,
      user: sanitizeUser(user)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/auth/me - Récupération du profil de l'utilisateur connecté
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userResponse = sanitizeUser(req.user)

    // Si l'utilisateur appartient à une entreprise, inclure les données de celle-ci
    if (req.user.companyId) {
      const db = getDB()
      const company = await db.collection('companies').findOne({ _id: new ObjectId(req.user.companyId) })
      userResponse.company = company || null
    }

    res.json(userResponse)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
