import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateUpdateItem } from "@/lib/validations/shopping"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { id } = params
    
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
    
    // Convert status from 'este-mes' to 'este_mes' if needed
    if (updateData.status) {
      const normalizedStatus = updateData.status.replace(/-/g, '_')
      updateData.status = normalizedStatus as any
    }
    
    console.log('Updating item with data:', updateData)
    
    const item = await prisma.shoppingItem.update({
      where: { id },
      data: updateData,
    })
    
    return NextResponse.json(item)
  } catch (error) {
    console.error("Error updating shopping item:", error)
    return NextResponse.json({ 
      error: "Failed to update shopping item",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

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
    console.error("Error deleting shopping item:", error)
    return NextResponse.json({ 
      error: "Failed to delete shopping item",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
