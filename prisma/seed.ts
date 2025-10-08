import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Borrar datos existentes (opcional, ten cuidado en producción)
  await prisma.shoppingItem.deleteMany({});

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
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
