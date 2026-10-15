import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'

/**
 * Middleware d'isolation logicielle multi-tenant stricte.
 * Vérifie l'en-tête X-Company-Id ou le paramètre companyId,
 * s'assure que l'entreprise existe dans MongoDB, et injecte
 * companyId dans la requête pour filtrer systématiquement les données.
 */
export async function requireCompany(req, res, next) {
  try {
    const rawCompanyId = 
      req.headers['x-company-id'] || 
      req.query.companyId || 
      req.params.companyId

    if (!rawCompanyId) {
      return res.status(400).json({ 
        error: 'Isolation multi-tenant : L\'en-tête X-Company-Id ou le paramètre companyId est obligatoire.' 
      })
    }

    let companyObjectId
    try {
      companyObjectId = new ObjectId(rawCompanyId)
    } catch {
      return res.status(400).json({ error: 'Format de companyId invalide.' })
    }

    const db = getDB()
    const company = await db.collection('companies').findOne({ _id: companyObjectId })

    if (!company) {
      return res.status(404).json({ error: 'Entreprise introuvable dans le système.' })
    }

    req.company = company
    req.companyId = companyObjectId
    next()
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du contrôle d\'isolation multi-tenant : ' + error.message })
  }
}
