/**
 * Utilidad para limpiar completamente el store unificado
 * Esto es útil cuando hay datos corruptos o problemas de persistencia
 */

export function clearUnifiedStore() {
  if (typeof window === 'undefined') return;

  try {
    // Limpiar todos los stores relacionados
    localStorage.removeItem('unified-shopping-store');
    localStorage.removeItem('shopping-store');
    localStorage.removeItem('useStore');
    
    // También limpiar cualquier otro store que pueda estar causando conflictos
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('shopping') || key.includes('store')) {
        localStorage.removeItem(key);
      }
    });

    return true;
  } catch (error) {
    return false;
  }
}

// Función para verificar si el store está corrupto
export function isStoreCorrupted(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const storeData = localStorage.getItem('unified-shopping-store');
    if (!storeData) return false;

    const parsed = JSON.parse(storeData);
    const items = parsed.state?.items;
    
    if (!Array.isArray(items)) return true;
    
    // Verificar si hay items con formato {props: {...}} (corruptos)
    const hasCorruptedItems = items.some((item: any) => 
      item && typeof item === 'object' && item.props
    );
    
    if (hasCorruptedItems) {
      return true;
    }
    
    // Verificar si los items son objetos planos (corruptos)
    const firstItem = items[0];
    if (firstItem && typeof firstItem.name === 'string' && !firstItem.getValue) {
      return true;
    }
    
    return false;
  } catch (error) {
    return true;
  }
}

// Función para auto-reparar el store
export function autoRepairStore(): boolean {
  if (typeof window === 'undefined') return false;

  if (isStoreCorrupted()) {
    return clearUnifiedStore();
  }
  
  return false;
}
