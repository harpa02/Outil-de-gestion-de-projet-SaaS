/**
 * Ancien middleware multi-tenant basé sur X-Company-Id.
 * Non utilisé: l'isolation repose sur req.companyId injecté par requireAuth (JWT).
 */
export async function requireCompany(req, res, next) {
  return res.status(410).json({ error: 'Middleware obsolète. Utilisez l\'authentification JWT.' })
}
