/**
 * Utility functions for converting between frontend and database status formats
 * Frontend uses: "este-mes", "proximo-mes" (with hyphens)
 * Database uses: "este_mes", "proximo_mes" (with underscores)
 */

export type FrontendStatus = 'este-mes' | 'proximo-mes'
export type DatabaseStatus = 'este_mes' | 'proximo_mes'

/**
 * Convert frontend status format to database format
 * @param frontendStatus - Status in frontend format (este-mes)
 * @returns Status in database format (este_mes)
 */
export function toDatabaseStatus(frontendStatus: string): DatabaseStatus {
  return frontendStatus.replace(/-/g, '_') as DatabaseStatus
}

/**
 * Convert database status format to frontend format
 * @param databaseStatus - Status in database format (este_mes)
 * @returns Status in frontend format (este-mes)
 */
export function toFrontendStatus(databaseStatus: string): FrontendStatus {
  return databaseStatus.replace(/_/g, '-') as FrontendStatus
}

/**
 * Convert an object with status field from database to frontend format
 * @param item - Object with status field in database format
 * @returns Object with status field in frontend format
 */
export function convertItemToFrontend<T extends { status: string }>(item: T): T {
  return {
    ...item,
    status: toFrontendStatus(item.status)
  }
}

