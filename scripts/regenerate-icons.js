#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🎨 Regenerando iconos PWA desde el favicon...\n');

try {
  // Ejecutar pwa-asset-generator
  const command = `npx pwa-asset-generator ./public/placeholder-logo.png ./public/icons --icon-only --background "transparent" --padding "0%" --manifest ./public/manifest.json`;
  
  console.log('📱 Generando iconos...');
  execSync(command, { stdio: 'inherit' });
  
  console.log('\n✅ ¡Iconos regenerados exitosamente!');
  console.log('📁 Iconos guardados en: public/icons/');
  console.log('🔧 Manifest actualizado: public/manifest.json');
  
} catch (error) {
  console.error('❌ Error regenerando iconos:', error.message);
  process.exit(1);
}
