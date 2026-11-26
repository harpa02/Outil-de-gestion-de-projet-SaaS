import { getDB } from './db.js'
import { ROLES } from './constants.js'

/**
 * Migration idempotentale des données existantes vers le nouveau modèle :
 * - admin -> ceo, member -> employee
 * - un seul CEO par entreprise (le créateur de préférence)
 * - valeurs par défaut pour les nouveaux champs utilisateur/entreprise
 */
export async function migrateData() {
  const db = getDB()
  const users = db.collection('users')
  const companies = db.collection('companies')
  const departments = db.collection('departments')
  const now = new Date()

  await users.updateMany(
    { role: 'admin' },
    { $set: { role: ROLES.CEO, updatedAt: now } }
  )
  await users.updateMany(
    { role: 'member' },
    { $set: { role: ROLES.EMPLOYEE, updatedAt: now } }
  )

  const companyDocs = await companies.find({}).toArray()
  for (const company of companyDocs) {
    const ceos = await users
      .find({ companyId: company._id, role: ROLES.CEO })
      .sort({ createdAt: 1 })
      .toArray()

    if (ceos.length === 0) {
      let target = company.createdBy
        ? await users.findOne({ _id: company.createdBy, companyId: company._id })
        : null
      if (!target) target = await users.findOne({ companyId: company._id })
      if (target) {
        await users.updateOne({ _id: target._id }, { $set: { role: ROLES.CEO, updatedAt: now } })
      }
    } else if (ceos.length > 1) {
      const keeper = ceos.find(
        u => company.createdBy && u._id.toString() === company.createdBy.toString()
      ) || ceos[0]
      for (const ceo of ceos) {
        if (ceo._id.toString() !== keeper._id.toString()) {
          await users.updateOne({ _id: ceo._id }, { $set: { role: ROLES.MANAGER, updatedAt: now } })
        }
      }
    }

    // Le CEO doit toujours figurer dans le service « CEO » de son entreprise.
    // La migration est idempotente : elle réutilise le service existant.
    const ceo = await users.findOne({ companyId: company._id, role: ROLES.CEO })
    if (ceo) {
      let ceoDepartment = await departments.findOne({ companyId: company._id, name: 'CEO' })
      if (!ceoDepartment) {
        const inserted = await departments.insertOne({
          companyId: company._id,
          name: 'CEO',
          createdBy: ceo._id,
          createdAt: now,
          updatedAt: now,
          system: true,
        })
        ceoDepartment = { _id: inserted.insertedId, name: 'CEO' }
      }
      await users.updateOne(
        { _id: ceo._id },
        { $set: { departmentId: ceoDepartment._id, jobTitle: 'CEO', updatedAt: now } }
      )
    }
  }

  await users.updateMany({ phone: { $exists: false } }, { $set: { phone: '' } })
  await users.updateMany({ jobTitle: { $exists: false } }, { $set: { jobTitle: '' } })
  await users.updateMany({ departmentId: { $exists: false } }, { $set: { departmentId: null } })
  await users.updateMany({ managedDepartmentId: { $exists: false } }, { $set: { managedDepartmentId: null } })
  await users.updateMany({ departmentChangeRequest: { $exists: false } }, { $set: { departmentChangeRequest: null } })
  await companies.updateMany({ vatRate: { $exists: false } }, { $set: { vatRate: 20 } })

  console.log('[Migration] Rôles (ceo/manager/employee), service CEO, TVA et champs profil à jour.')
}
