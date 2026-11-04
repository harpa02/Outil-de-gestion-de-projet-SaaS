import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'

// Clé secrète JWT (à remplacer en production via variable d'environnement)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

/**
 * Middleware d'authentification JWT.
 * Lit le token depuis l'en-tête Authorization: Bearer <token>,
 * vérifie sa validité, récupère l'utilisateur en base et l'injecte
 * dans req.user et req.companyId.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token d\'authentification manquant.' })
    }

    const token = authHeader.split(' ')[1]

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return res.status(401).json({ error: 'Token invalide ou expiré.' })
    }

    const db = getDB()
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur introuvable.' })
    }

    // Injecter l'utilisateur et son companyId dans la requête
    req.user = user
    req.companyId = user.companyId ? new ObjectId(user.companyId) : null

    next()
  } catch (error) {
    res.status(500).json({ error: 'Erreur d\'authentification : ' + error.message })
  }
}

/**
 * Middleware vérifiant que l'utilisateur a le statut 'active'.
 * Doit être utilisé APRÈS requireAuth.
 * Refuse l'accès si le statut est 'pending_approval'.
 */
export function requireActive(req, res, next) {
  if (req.user.status === 'pending_approval') {
    return res.status(403).json({ error: 'Votre compte est en attente d\'approbation par un administrateur.' })
  }

  if (req.user.status !== 'active') {
    return res.status(403).json({ error: 'Votre compte n\'est pas actif.' })
  }

  next()
}

/**
 * Middleware de vérification des rôles.
 * Retourne un middleware qui vérifie que req.user.role est dans la liste des rôles autorisés.
 * @param  {...string} roles - Liste des rôles autorisés (ex: 'admin', 'manager')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Accès refusé. Rôle requis : ${roles.join(' ou ')}.` })
    }
    next()
  }
}
