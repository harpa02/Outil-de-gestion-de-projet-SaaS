// Rôles et règles d'affichage partagées côté client.
export const ROLES = {
  CEO: 'ceo',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
}

export const ROLE_OPTIONS = [
  { value: ROLES.CEO, label: 'CEO', color: '#6d28d9', bg: '#f5f3ff' },
  { value: ROLES.MANAGER, label: 'Manager', color: '#1d4ed8', bg: '#eff6ff' },
  { value: ROLES.EMPLOYEE, label: 'Salarié', color: '#047857', bg: '#ecfdf5' },
]

export function roleInfo(role) {
  return ROLE_OPTIONS.find(r => r.value === role) || ROLE_OPTIONS[2]
}

export function isManagerOrCeo(role) {
  return role === ROLES.CEO || role === ROLES.MANAGER
}

/** Prénom + première lettre du nom de famille. */
export function shortName(user) {
  const first = (user?.firstName || '').trim()
  const last = (user?.lastName || '').trim()
  const initial = last ? `${last[0].toUpperCase()}.` : ''
  return `${first}${initial ? ` ${initial}` : ''}`.trim()
}

/** Libellé compact : "Prénom I. - Service" ou "Prénom I. - Manager - Service". */
export function memberLabel(user, departments = []) {
  const department = departments.find(d => String(d._id) === String(user?.departmentId))
  const base = shortName(user)
  if (user?.role === ROLES.MANAGER) {
    return [base, 'Manager', department?.name].filter(Boolean).join(' - ')
  }
  return department?.name ? `${base} - ${department.name}` : base
}

/**
 * Sous-titre compact d'une fiche membre : "Poste · Service".
 * Évite le doublon "CEO · CEO" lorsque le poste et le service ont le même nom.
 */
export function memberSubtitle(member, departments = []) {
  const department = departments.find(d => String(d._id) === String(member?.departmentId))
  const job = (member?.jobTitle || '').trim() || roleInfo(member?.role).label
  const service = department?.name || ''
  if (!service) return job || 'Sans service'
  if (job.toLowerCase() === service.toLowerCase()) return job
  return `${job} · ${service}`
}

/** Même matrice que server/constants.js (les deux côtés restent synchronisés). */
export function canChangeRole(actor, target, nextRole) {
  if (!actor || !target) return false
  if (target.role === ROLES.CEO) return false
  if (String(actor._id) === String(target._id)) return false

  if (actor.role === ROLES.CEO) return nextRole !== ROLES.CEO
  if (actor.role === ROLES.MANAGER) {
    return target.role === ROLES.EMPLOYEE && nextRole === ROLES.MANAGER
  }
  return false
}

/** Un supérieur peut traiter la demande de changement de service. */
export function canApproveDepartmentRequest(actor, target) {
  if (!actor || !target || target.role === ROLES.CEO) return false
  if (actor.role === ROLES.CEO) return true
  if (actor.role === ROLES.MANAGER) return target.role === ROLES.EMPLOYEE
  return false
}
