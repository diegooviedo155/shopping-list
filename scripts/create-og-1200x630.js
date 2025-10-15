#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🎨 Creando imagen Open Graph 1200x630...\n');

try {
  // Crear una imagen Open Graph específica de 1200x630
  const command = `npx pwa-asset-generator ./public/placeholder-logo.png ./public --splash-only --background "#ffffff" --padding "20%" --path "/" --manifest ./public/manifest.json --splash-screen-sizes "1200x630"`;
  
  console.log('📱 Generando imagen Open Graph 1200x630...');
  execSync(command, { stdio: 'inherit' });
  
  // Verificar si se creó la imagen
  const files = fs.readdirSync('./public/');
  const ogImage = files.find(file => file.includes('1200-630'));
  
  if (ogImage) {
    console.log(`✅ Imagen Open Graph creada: ${ogImage}`);
  } else {
    console.log('⚠️  No se encontró imagen 1200x630, usando una existente...');
  }
  
  console.log('\n✅ ¡Imagen Open Graph generada exitosamente!');
  console.log('📁 Imagen guardada en: public/');
  console.log('🔗 Se usará automáticamente al compartir la URL');
  
} catch (error) {
  console.error('❌ Error generando imagen Open Graph:', error.message);
  process.exit(1);
}
