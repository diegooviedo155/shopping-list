/**
 * Script manual para limpiar el store desde la consola del navegador
 * Ejecutar en la consola del navegador: 
 * 
 * 1. Abrir DevTools (F12)
 * 2. Ir a la pestaña Console
 * 3. Copiar y pegar este código
 * 4. Presionar Enter
 */

(function clearStore() {
  try {
    console.log('🧹 Starting manual store cleanup...');
    
    // Limpiar todos los stores relacionados
    const storesToClear = [
      'unified-shopping-store',
      'shopping-store', 
      'useStore'
    ];
    
    let clearedCount = 0;
    storesToClear.forEach(storeName => {
      if (localStorage.getItem(storeName)) {
        localStorage.removeItem(storeName);
        console.log(`✅ Cleared ${storeName}`);
        clearedCount++;
      }
    });
    
    // Limpiar cualquier otro store que contenga 'shopping' o 'store'
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.includes('shopping') || key.includes('store')) {
        localStorage.removeItem(key);
        console.log(`✅ Cleared additional store: ${key}`);
        clearedCount++;
      }
    });
    
    console.log(`🎉 Store cleanup completed! Cleared ${clearedCount} stores.`);
    console.log('🔄 Please refresh the page to see the changes.');
    
    // Opcional: recargar automáticamente
    if (confirm('Store cleared successfully! Would you like to reload the page now?')) {
      window.location.reload();
    }
    
  } catch (error) {
    console.error('❌ Error during store cleanup:', error);
  }
})();
