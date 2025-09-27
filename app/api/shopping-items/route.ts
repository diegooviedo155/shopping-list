import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateCreateItem } from "@/lib/validations/shopping"

export async function GET() {
  try {
    console.log('Fetching items from database...')
    
    // Verificar la conexión a la base de datos
    await prisma.$connect()
    console.log('Database connection successful')
    
    // Obtener todos los items
    const items = await prisma.shoppingItem.findMany({
      orderBy: {
        orderIndex: "asc",
      },
    })

    console.log(`Found ${items.length} items in the database`)
    
    // Si no hay items, devolver un array vacío
    const result = Array.isArray(items) ? items : []
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching shopping items:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch shopping items",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  } finally {
    // Cerrar la conexión a la base de datos
    await prisma.$disconnect().catch(console.error)
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

    // Get the highest order index for the status
    const maxOrderItem = await prisma.shoppingItem.findFirst({
      where: { status },
      orderBy: { orderIndex: "desc" },
    })

    const orderIndex = (maxOrderItem?.orderIndex ?? -1) + 1

    const item = await prisma.shoppingItem.create({
      data: {
        name: name.trim(),
        category,
        status,
        completed: false,
        orderIndex,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("Error creating shopping item:", error)
    return NextResponse.json({ 
      error: "Failed to create shopping item",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
