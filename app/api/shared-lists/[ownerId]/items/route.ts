import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  try {
    const supabase = await createServerClient()
    
    // Obtener el usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { ownerId } = await params

    // Verificar que el usuario tiene acceso a la lista del propietario
    const { data: access, error: accessError } = await supabase
      .from('shared_list_access')
      .select('*')
      .eq('list_owner_id', ownerId)
      .eq('member_id', user.id)
      .single()

    if (accessError || !access) {
      return NextResponse.json({ error: 'No tienes acceso a esta lista' }, { status: 403 })
    }

    // Obtener solo los items de "este_mes" del propietario
    const { data: items, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('user_id', ownerId)
      .eq('status', 'este_mes')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching shared list items:', error)
      return NextResponse.json({ error: 'Error al obtener items' }, { status: 500 })
    }

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error in GET /api/shared-lists/[ownerId]/items:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
