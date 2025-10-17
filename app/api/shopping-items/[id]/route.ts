import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'
import { getAuthenticatedUserId, getUserIdFromRequest } from '@/lib/auth/server-auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Intentar obtener el usuario autenticado de las cookies primero
    let user_id = await getAuthenticatedUserId()
    
    // Si no se puede obtener de las cookies, intentar extraer del token JWT
    if (!user_id) {
      user_id = getUserIdFromRequest(request)
    }
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      )
    }

    const { data: item, error } = await supabase
      .from('shopping_items')
      .update(body)
      .eq('id', id)
      .eq('user_id', user_id) // Ensure RLS is respected
      .select()
      .single()

    if (error) {
      console.error('Error updating shopping item:', error)
      return NextResponse.json(
        { error: 'Failed to update shopping item' },
        { status: 500 }
      )
    }

    if (!item) {
      return NextResponse.json({ error: 'Shopping item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error in shopping items PATCH API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Intentar obtener el usuario autenticado de las cookies primero
    let user_id = await getAuthenticatedUserId()
    
    // Si no se puede obtener de las cookies, intentar extraer del token JWT
    if (!user_id) {
      user_id = getUserIdFromRequest(request)
    }
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id) // Ensure RLS is respected

    if (error) {
      console.error('Error deleting shopping item:', error)
      return NextResponse.json(
        { error: 'Failed to delete shopping item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in shopping items DELETE API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
