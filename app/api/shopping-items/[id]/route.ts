import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { validateUpdateItem } from "@/lib/validations/shopping"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const { id } = await params
    
    // Validar los datos de entrada
    const validation = validateUpdateItem(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Datos inválidos",
          details: validation.error.errors.map(e => e.message).join(', ')
        }, 
        { status: 400 }
      )
    }

    const updateData = validation.data
    
    // Status is already in correct format (este_mes)

    // If category is being updated, convert slug to ID
    if (updateData.category) {
      const category = await prisma.category.findUnique({
        where: { slug: updateData.category }
      })

      if (!category) {
        return NextResponse.json(
          { error: "Categoría no encontrada" },
          { status: 404 }
        )
      }

      updateData.categoryId = category.id
      delete updateData.category
    }
    
    const item = await prisma.shoppingItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    })
    
    // Return item with status as-is (already in correct format)
    const result = item
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to update shopping item",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const { id } = await params
    
    // Validar los datos de entrada
    const validation = validateUpdateItem(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Datos inválidos",
          details: validation.error.errors.map(e => e.message).join(', ')
        }, 
        { status: 400 }
      )
    }

    const updateData = validation.data
    
    // Status is already in correct format (este_mes)

    // If category is being updated, convert slug to ID
    if (updateData.category) {
      const category = await prisma.category.findUnique({
        where: { slug: updateData.category }
      })

      if (!category) {
        return NextResponse.json(
          { error: "Categoría no encontrada" },
          { status: 404 }
        )
      }

      updateData.categoryId = category.id
      delete updateData.category
    }
    
    const item = await prisma.shoppingItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    })
    
    // Return item with status as-is (already in correct format)
    const result = item
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to update shopping item",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verificar que el item existe antes de eliminarlo
    const existingItem = await prisma.shoppingItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    await prisma.shoppingItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to delete shopping item",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
