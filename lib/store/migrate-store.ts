/**
 * Script de migración para limpiar el store corrupto
 * Este script se ejecuta automáticamente al cargar la aplicación
 */

import { autoRepairStore, isStoreCorrupted } from './clear-store';

export function migrateStore() {
  if (typeof window === 'undefined') return;

  try {
    // Verificar si el store está corrupto y repararlo automáticamente
    if (isStoreCorrupted()) {
      autoRepairStore();
    }
  } catch (error) {
    // En caso de error, limpiar todo
    autoRepairStore();
  }
}

// Ejecutar migración automáticamente
if (typeof window !== 'undefined') {
  migrateStore();
}
