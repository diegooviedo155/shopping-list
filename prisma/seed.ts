import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Borrar datos existentes (opcional, ten cuidado en producción)
  await prisma.shoppingItem.deleteMany({});
  console.log('Datos existentes eliminados');

  // Crear datos de ejemplo
  const sampleItems = [
    {
      name: 'Leche',
      category: 'supermercado' as const,
      status: 'este_mes' as const,
      completed: false,
      orderIndex: 0,
    },
    {
      name: 'Pan',
      category: 'supermercado' as const,
      status: 'este_mes' as const,
      completed: true,
      orderIndex: 1,
    },
    {
      name: 'Manzanas',
      category: 'verduleria' as const,
      status: 'proximo_mes' as const,
      completed: false,
      orderIndex: 0,
    },
    {
      name: 'Pollo',
      category: 'carniceria' as const,
      status: 'proximo_mes' as const,
      completed: false,
      orderIndex: 1,
    },
  ];

  // Insertar datos de ejemplo
  for (const item of sampleItems) {
    await prisma.shoppingItem.create({
      data: item,
    });
  }

  console.log('Datos de ejemplo insertados correctamente');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
