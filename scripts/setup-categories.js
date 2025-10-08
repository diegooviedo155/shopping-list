#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Configurando sistema de categorías...\n');

try {
  // 1. Generar el cliente de Prisma
  console.log('📦 Generando cliente de Prisma...');
  execSync('pnpm prisma generate', { stdio: 'inherit' });

  // 2. Ejecutar migraciones
  console.log('\n🗄️  Ejecutando migraciones...');
  execSync('pnpm prisma migrate deploy', { stdio: 'inherit' });

  // 3. Ejecutar seed
  console.log('\n🌱 Ejecutando seed...');
  execSync('pnpm prisma db seed', { stdio: 'inherit' });

  console.log('\n✅ ¡Configuración completada exitosamente!');
  console.log('\n📋 Próximos pasos:');
  console.log('   1. Visita http://localhost:3000 para ver la aplicación');
  console.log('   2. Ve a http://localhost:3000/admin/categories para gestionar categorías');
  console.log('   3. Usa el botón "Gestionar Categorías" en la página principal');

} catch (error) {
  console.error('\n❌ Error durante la configuración:', error.message);
  process.exit(1);
}
