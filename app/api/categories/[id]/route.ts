import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { UpdateCategoryData } from '@/lib/types/category'

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params
    const body: UpdateCategoryData = await request.json()

    console.log('PATCH request received:', { id, body })

    // Test database connection first
    await prisma.$connect()
    console.log('Database connected successfully')

    // Verificar si la categoría existe
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    console.log('Existing category:', existingCategory)

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Si se está actualizando el slug, verificar que no exista otro con el mismo slug
    if (body.slug && body.slug !== existingCategory.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: body.slug }
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'Category with this slug already exists' },
          { status: 409 }
        )
      }
    }

    // Actualizar la categoría
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: body
    })

    console.log('Category updated successfully:', updatedCategory)
    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Error updating category:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to update category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params

    // Verificar si la categoría existe
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true }
        }
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Si la categoría tiene items, no permitir eliminación
    if (existingCategory._count.items > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with items. Please move or delete items first.' },
        { status: 400 }
      )
    }

    // Eliminar la categoría
    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
