import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ ownerId: string; itemId: string }> }

/**
 * PATCH /api/shared-lists/[ownerId]/items/[itemId]
 *
 * Permite que un miembro con acceso aprobado actualice el campo `completed`
 * de un item de la lista del propietario.
 *
 * Solo se acepta el campo `completed` para limitar el alcance de la operación.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { ownerId, itemId } = await params

    // El propietario puede modificar sus propios items sin verificar acceso compartido
    const isOwner = user.id === ownerId

    if (!isOwner) {
      // Verificar que el usuario tiene acceso aprobado a la lista del propietario
      const { data: access, error: accessError } = await supabase
        .from('shared_list_access')
        .select('id')
        .eq('list_owner_id', ownerId)
        .eq('member_id', user.id)
        .single()

      if (accessError || !access) {
        return NextResponse.json({ error: 'No tienes acceso a esta lista' }, { status: 403 })
      }
    }

    const body = await request.json()

    // Solo permitir actualizar `completed`
    if (typeof body.completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Solo se puede actualizar el campo completed' },
        { status: 400 }
      )
    }

    // Actualizar el item (debe pertenecer al propietario)
    const { data: updatedItem, error: updateError } = await supabase
      .from('shopping_items')
      .update({
        completed: body.completed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('user_id', ownerId)
      .select()
      .single()

    if (updateError || !updatedItem) {
      console.error('Error updating shared list item:', updateError)
      return NextResponse.json({ error: 'Error al actualizar el item' }, { status: 500 })
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error in PATCH /api/shared-lists/[ownerId]/items/[itemId]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
