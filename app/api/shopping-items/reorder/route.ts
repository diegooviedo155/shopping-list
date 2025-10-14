import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { validateReorderItems } from "@/lib/validations/shopping"

export async function POST(request: NextRequest) {
  try {
    // Ensure Prisma connection
    await prisma.$connect()
    
    const body = await request.json()
    
    // Validar los datos de entrada
    const validation = validateReorderItems(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Datos inválidos",
          details: validation.error.errors.map(e => e.message).join(', ')
        }, 
        { status: 400 }
      )
    }

    const { status, sourceIndex, destIndex } = validation.data

    // Status is already in correct format (este_mes)
    const dbStatus = status

    // Get all items for the status, ordered by orderIndex
    const items = await prisma.shoppingItem.findMany({
      where: { status: dbStatus },
      orderBy: { orderIndex: "asc" },
      select: { id: true, orderIndex: true }
    })

    // Verificar que los índices son válidos
    if (sourceIndex >= items.length || destIndex >= items.length || sourceIndex < 0 || destIndex < 0) {
      return NextResponse.json(
        { error: "Índices inválidos" },
        { status: 400 }
      )
    }

    // Si no hay cambio real, no hacer nada
    if (sourceIndex === destIndex) {
      return NextResponse.json({ success: true })
    }

    // Reorder the items array
    const [reorderedItem] = items.splice(sourceIndex, 1)
    items.splice(destIndex, 0, reorderedItem)

    // Usar transacción para actualizar todos los items de una vez
    await prisma.$transaction(
      items.map((item, index) =>
        prisma.shoppingItem.update({
          where: { id: item.id },
          data: { orderIndex: index },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to reorder shopping items",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
