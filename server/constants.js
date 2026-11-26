// Rôles métier : CEO, Manager, Salarié
export const ROLES = {
  CEO: 'ceo',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
}

export const ROLE_VALUES = [ROLES.CEO, ROLES.MANAGER, ROLES.EMPLOYEE]

export const ROLE_LABELS = {
  [ROLES.CEO]: 'CEO',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.EMPLOYEE]: 'Salarié',
}

export function isManagerOrCeo(role) {
  return role === ROLES.CEO || role === ROLES.MANAGER
}

/**
 * Règles de changement de rôle, appliquées côté serveur.
 * - Le rôle du CEO est intouchable.
 * - Le CEO peut modifier tous les rôles sauf le sien (pas de nouveau CEO).
 * - Le Manager peut uniquement promouvoir un Salarié en Manager.
 */
export function canChangeRole(actor, target, nextRole) {
  if (!ROLE_VALUES.includes(nextRole)) {
    return { ok: false, status: 400, error: `Rôle invalide. Valeurs autorisées : ${ROLE_VALUES.join(', ')}.` }
  }
  if (target.role === ROLES.CEO) {
    return { ok: false, status: 403, error: 'Le rôle du CEO ne peut pas être modifié.' }
  }
  if (actor._id.toString() === target._id.toString()) {
    return { ok: false, status: 400, error: 'Vous ne pouvez pas modifier votre propre rôle.' }
  }

  if (actor.role === ROLES.CEO) {
    if (nextRole === ROLES.CEO) {
      return { ok: false, status: 403, error: 'Une entreprise ne peut avoir qu\'un seul CEO.' }
    }
    return { ok: true }
  }

  if (actor.role === ROLES.MANAGER) {
    if (target.role !== ROLES.EMPLOYEE || nextRole !== ROLES.MANAGER) {
      return { ok: false, status: 403, error: 'Un Manager ne peut que promouvoir un Salarié en Manager.' }
    }
    return { ok: true }
  }

  return { ok: false, status: 403, error: 'Accès refusé : vous ne pouvez pas modifier les rôles.' }
}

/** "Prénom I." — utilisé pour les libellés compacts des fiches. */
export function shortName(user) {
  const first = (user?.firstName || '').trim()
  const last = (user?.lastName || '').trim()
  const initial = last ? `${last[0].toUpperCase()}.` : ''
  return `${first}${initial ? ` ${initial}` : ''}`.trim()
}
