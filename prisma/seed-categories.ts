import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const initialCategories = [
  {
    name: 'Supermercado',
    slug: 'supermercado',
    color: '#3B82F6',
    icon: 'shopping-cart',
    orderIndex: 0,
  },
  {
    name: 'Verdulería',
    slug: 'verduleria',
    color: '#10B981',
    icon: 'carrot',
    orderIndex: 1,
  },
  {
    name: 'Carnicería',
    slug: 'carniceria',
    color: '#EF4444',
    icon: 'beef',
    orderIndex: 2,
  },
  {
    name: 'Farmacia',
    slug: 'farmacia',
    color: '#8B5CF6',
    icon: 'pill',
    orderIndex: 3,
  },
  {
    name: 'Librería',
    slug: 'libreria',
    color: '#F59E0B',
    icon: 'book',
    orderIndex: 4,
  },
  {
    name: 'Electrodomésticos',
    slug: 'electrodomesticos',
    color: '#6B7280',
    icon: 'tv',
    orderIndex: 5,
  },
]

async function seedCategories() {
  console.log('🌱 Iniciando seed de categorías...')

  try {
    // Verificar si ya existen categorías
    const existingCategories = await prisma.category.count()
    if (existingCategories > 0) {
      console.log('⚠️  Ya existen categorías en la base de datos. Saltando seed.')
      return
    }

    // Crear categorías
    for (const categoryData of initialCategories) {
      await prisma.category.create({
        data: categoryData,
      })
      console.log(`✅ Categoría creada: ${categoryData.name}`)
    }

    console.log('🎉 Seed de categorías completado exitosamente!')
  } catch (error) {
    console.error('❌ Error durante el seed de categorías:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  seedCategories()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedCategories }
