#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 Generando favicon.ico desde el logo...\n');

try {
  // Leer el logo PNG
  const logoPath = './public/placeholder-logo.png';
  
  if (!fs.existsSync(logoPath)) {
    throw new Error('Logo no encontrado en: ' + logoPath);
  }
  
  // Leer el archivo PNG
  const pngBuffer = fs.readFileSync(logoPath);
  
  // Crear favicon.ico (simplemente copiar el PNG como ICO para simplicidad)
  const faviconPath = './public/favicon.ico';
  fs.writeFileSync(faviconPath, pngBuffer);
  
  console.log('✅ Favicon generado exitosamente!');
  console.log('📁 Favicon guardado en: public/favicon.ico');
  
} catch (error) {
  console.error('❌ Error generando favicon:', error.message);
  process.exit(1);
}
