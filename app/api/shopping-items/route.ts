import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateCreateItem } from "@/lib/validations/shopping"
import { toDatabaseStatus, toFrontendStatus } from "@/lib/utils/status-conversion"

export async function GET() {
  try {
    // Verificar la conexión a la base de datos
    await prisma.$connect()
    
    // Obtener todos los items
    const items = await prisma.shoppingItem.findMany({
      orderBy: {
        orderIndex: "asc",
      },
    })
    
    // Convert database status format (este_mes) to frontend format (este-mes)
    const result = items.map(item => ({
      ...item,
      status: toFrontendStatus(item.status)
    }))
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Failed to fetch shopping items",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar los datos de entrada
    const validation = validateCreateItem(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Datos inválidos",
          details: validation.error.errors.map(e => e.message).join(', ')
        }, 
        { status: 400 }
      )
    }

    const { name, category, status } = validation.data

    // Convert frontend status format (este-mes) to database format (este_mes)
    const dbStatus = toDatabaseStatus(status)

    // Get the highest order index for the status
    const maxOrderItem = await prisma.shoppingItem.findFirst({
      where: { status: dbStatus },
      orderBy: { orderIndex: "desc" },
    })

    const orderIndex = (maxOrderItem?.orderIndex ?? -1) + 1

    const item = await prisma.shoppingItem.create({
      data: {
        name: name.trim(),
        category: category as any,
        status: dbStatus,
        completed: false,
        orderIndex,
      },
    })

    // Convert database status format (este_mes) to frontend format (este-mes)
    const result = {
      ...item,
      status: toFrontendStatus(item.status)
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to create shopping item",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
