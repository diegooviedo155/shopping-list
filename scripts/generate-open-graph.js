#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🎨 Generando imagen Open Graph para compartir...\n');

try {
  // Crear imagen Open Graph usando pwa-asset-generator
  const command = `npx pwa-asset-generator ./public/placeholder-logo.png ./public --splash-only --background "#ffffff" --padding "20%" --path "/" --manifest ./public/manifest.json`;
  
  console.log('📱 Generando imagen Open Graph...');
  execSync(command, { stdio: 'inherit' });
  
  console.log('\n✅ ¡Imagen Open Graph generada exitosamente!');
  console.log('📁 Imagen guardada en: public/');
  console.log('🔗 Se usará automáticamente al compartir la URL');
  
} catch (error) {
  console.error('❌ Error generando imagen Open Graph:', error.message);
  process.exit(1);
}
