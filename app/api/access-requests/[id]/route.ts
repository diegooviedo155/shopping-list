import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { UpdateAccessRequestData } from '@/lib/types/access-requests'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    
    // Obtener el usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body: UpdateAccessRequestData = await request.json()
    const { id: requestId } = await params

    // Verificar que el usuario es el propietario de la lista
    const { data: existingRequest, error: fetchError } = await supabase
      .from('list_access_requests')
      .select('list_owner_id')
      .eq('id', requestId)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (existingRequest.list_owner_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado para modificar esta solicitud' }, { status: 403 })
    }

    // Actualizar el estado de la solicitud
    const { data: updatedRequest, error } = await supabase
      .from('list_access_requests')
      .update({ status: body.status })
      .eq('id', requestId)
      .select()
      .single()

    if (error) {
      console.error('Error updating access request:', error)
      return NextResponse.json({ error: 'Error al actualizar solicitud' }, { status: 500 })
    }

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error('Error in PUT /api/access-requests/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    
    // Obtener el usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: requestId } = await params

    // Verificar que el usuario es el propietario de la lista
    const { data: existingRequest, error: fetchError } = await supabase
      .from('list_access_requests')
      .select('list_owner_id')
      .eq('id', requestId)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (existingRequest.list_owner_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado para eliminar esta solicitud' }, { status: 403 })
    }

    // Eliminar la solicitud
    const { error } = await supabase
      .from('list_access_requests')
      .delete()
      .eq('id', requestId)

    if (error) {
      console.error('Error deleting access request:', error)
      return NextResponse.json({ error: 'Error al eliminar solicitud' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/access-requests/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
