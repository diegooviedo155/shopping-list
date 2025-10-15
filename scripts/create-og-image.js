#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎨 Creando imagen Open Graph para compartir...\n');

try {
  // Crear una imagen Open Graph simple usando pwa-asset-generator
  const command = `npx pwa-asset-generator ./public/placeholder-logo.png ./public --splash-only --background "#ffffff" --padding "30%" --path "/" --manifest ./public/manifest.json --splash-only`;
  
  console.log('📱 Generando imagen Open Graph...');
  execSync(command, { stdio: 'inherit' });
  
  // Crear una imagen Open Graph específica para redes sociales (1200x630)
  const ogCommand = `npx pwa-asset-generator ./public/placeholder-logo.png ./public --splash-only --background "#ffffff" --padding "20%" --path "/" --manifest ./public/manifest.json --splash-only --splash-screen-sizes "1200x630"`;
  
  console.log('📱 Generando imagen Open Graph para redes sociales...');
  execSync(ogCommand, { stdio: 'inherit' });
  
  console.log('\n✅ ¡Imagen Open Graph generada exitosamente!');
  console.log('📁 Imagen guardada en: public/');
  console.log('🔗 Se usará automáticamente al compartir la URL');
  
} catch (error) {
  console.error('❌ Error generando imagen Open Graph:', error.message);
  process.exit(1);
}
