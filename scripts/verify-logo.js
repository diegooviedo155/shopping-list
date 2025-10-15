#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando consistencia del logo...\n');

const filesToCheck = [
  'public/placeholder-logo.png',
  'public/favicon.ico',
  'public/icons/apple-icon-180.png',
  'public/icons/manifest-icon-192.maskable.png',
  'public/icons/manifest-icon-512.maskable.png',
  'public/manifest.json'
];

let allFilesExist = true;

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`❌ ${file} - NO ENCONTRADO`);
    allFilesExist = false;
  }
});

console.log('\n📋 Verificación del manifest.json:');
try {
  const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
  console.log(`✅ Manifest válido`);
  console.log(`   - Nombre: ${manifest.name}`);
  console.log(`   - Iconos: ${manifest.icons.length}`);
  console.log(`   - Shortcuts: ${manifest.shortcuts.length}`);
} catch (error) {
  console.log(`❌ Error en manifest.json: ${error.message}`);
  allFilesExist = false;
}

if (allFilesExist) {
  console.log('\n🎉 ¡Todos los archivos del logo están en su lugar!');
  console.log('📱 Tu PWA está lista para instalarse con el nuevo logo.');
} else {
  console.log('\n⚠️  Algunos archivos faltan. Ejecuta: pnpm run regenerate-icons');
}
