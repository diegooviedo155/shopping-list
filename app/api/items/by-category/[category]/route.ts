import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { convertItemToFrontend } from '@/lib/utils/status-conversion'

interface Context {
  params: Promise<{
    category: string
  }>
}

export async function GET(
  request: Request,
  { params }: Context
) {
  try {
    const { category } = await params;

    if (!category) {
      throw new Error('Category parameter is required');
    }

    // Decode the category from the URL
    const decodedCategory = decodeURIComponent(category);

    // First, find the category by slug to get its ID
    const categoryRecord = await prisma.category.findUnique({
      where: { slug: decodedCategory }
    });

    if (!categoryRecord) {
      return NextResponse.json(
        { 
          error: 'Categoría no encontrada',
          details: `No se encontró la categoría con slug: ${decodedCategory}`
        },
        { status: 404 }
      );
    }

    // Get items for the specific category using the category ID
    const items = await prisma.shoppingItem.findMany({
      where: { categoryId: categoryRecord.id },
      include: {
        category: true
      },
      orderBy: { orderIndex: 'asc' }
    });

    // Convert database status format to frontend format
    const convertedItems = items.map(item => convertItemToFrontend(item));

    return NextResponse.json(convertedItems);
  } catch (error) {
    console.error('Error fetching items by category:', error);
    return NextResponse.json(
      { 
        error: 'Error al cargar los productos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
