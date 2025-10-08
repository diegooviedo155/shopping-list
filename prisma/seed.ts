import { PrismaClient } from '@prisma/client';
import { seedCategories } from './seed-categories';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  try {
    // Primero crear las categorías
    await seedCategories();

    // Obtener las categorías creadas
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map(cat => [cat.slug, cat.id]));

    // Borrar datos existentes de items (opcional, ten cuidado en producción)
    await prisma.shoppingItem.deleteMany({});

    // Crear datos de ejemplo
    const sampleItems = [
      {
        name: 'Leche',
        categoryId: categoryMap.get('supermercado'),
        status: 'este_mes' as const,
        completed: false,
        orderIndex: 0,
      },
      {
        name: 'Pan',
        categoryId: categoryMap.get('supermercado'),
        status: 'este_mes' as const,
        completed: true,
        orderIndex: 1,
      },
      {
        name: 'Manzanas',
        categoryId: categoryMap.get('verduleria'),
        status: 'proximo_mes' as const,
        completed: false,
        orderIndex: 0,
      },
      {
        name: 'Pollo',
        categoryId: categoryMap.get('carniceria'),
        status: 'proximo_mes' as const,
        completed: false,
        orderIndex: 1,
      },
    ];

    // Insertar datos de ejemplo
    for (const item of sampleItems) {
      if (item.categoryId) {
        await prisma.shoppingItem.create({
          data: {
            name: item.name,
            categoryId: item.categoryId,
            status: item.status,
            completed: item.completed,
            orderIndex: item.orderIndex,
          },
        });
        console.log(`✅ Item creado: ${item.name}`);
      }
    }

    console.log('🎉 Seed completado exitosamente!');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
