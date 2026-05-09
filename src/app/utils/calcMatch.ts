// src/utils/calcMatchPercent.ts

/**
 * Calculates rootCause match percentage between any two users
 * using Jaccard similarity: matched / union * 100
 *
 * Works for any role combination:
 *  - BRAND      → brandDetails.rootCauses
 *  - PRACTITIONER → practitionerDetails.rootCauses
 *  - USER       → patientDetails.rootCauses
 */
export const calcMatchPercent = (
  causesA: string[],
  causesB: string[]
): number => {
  if (!causesA?.length || !causesB?.length) return 0
  const setA = new Set(causesA)
  const matched = causesB.filter(c => setA.has(c)).length
  const union = new Set([...causesA, ...causesB]).size
  return Math.round((matched / union) * 100)
}

/**
 * Extracts rootCauses from any user object regardless of role.
 * Pass the full user with their details relation included.
 *
 * Usage:
 *   const causes = extractRootCauses(user);
 *   const match  = calcMatchPercent(causesA, causesB);
 */
export const extractRootCauses = (user: {
  role?: string
  brandDetails?: { rootCauses?: string[] } | null
  practitionerDetails?: { rootCauses?: string[] } | null
  patientDetails?: { rootCauses?: string[] } | null
}): string[] => {
  switch (user.role) {
    case 'BRAND':
      return user.brandDetails?.rootCauses ?? []
    case 'PRACTITIONER':
      return user.practitionerDetails?.rootCauses ?? []
    case 'USER':
      return user.patientDetails?.rootCauses ?? []
    default:
      return []
  }
}

/**
 * One-shot helper: extract + calculate in a single call.
 *
 * Usage:
 *   const match = calcUserMatch(brandUser, doctorUser);
 */
export const calcUserMatch = (
  userA: Parameters<typeof extractRootCauses>[0],
  userB: Parameters<typeof extractRootCauses>[0]
): number => {
  return calcMatchPercent(extractRootCauses(userA), extractRootCauses(userB))
}
