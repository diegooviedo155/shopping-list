import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { CreateAccessRequestData, AccessRequestWithOwner } from '@/lib/types/access-requests'

export async function GET(request: NextRequest) {
  try {
    // Obtener el usuario autenticado
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener tipo de consulta (owner o requester)
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'owner'

    let query = supabase
      .from('list_access_requests')
      .select('*')
      .order('created_at', { ascending: false })

    // Filtrar por propietario o solicitante
    if (type === 'owner') {
      query = query.eq('list_owner_id', user.id)
    } else if (type === 'requester') {
      query = query.eq('requester_id', user.id)
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('Error fetching access requests:', error)
      return NextResponse.json({ error: 'Error al obtener solicitudes' }, { status: 500 })
    }

    // Transformar los datos
    const requestsWithOwner = requests?.map(request => ({
      ...request,
      owner_email: user.email,
      owner_name: user.user_metadata?.full_name || user.email?.split('@')[0]
    })) || []

    return NextResponse.json({ requests: requestsWithOwner })
  } catch (error) {
    console.error('Error in GET /api/access-requests:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body: CreateAccessRequestData = await request.json()

    // Validar datos requeridos
    if (!body.list_owner_id || !body.requester_email) {
      return NextResponse.json({ error: 'Datos requeridos faltantes' }, { status: 400 })
    }

    // Verificar si ya existe una solicitud pendiente del mismo usuario para el mismo propietario
    const { data: existingRequest } = await supabase
      .from('list_access_requests')
      .select('*')
      .eq('list_owner_id', body.list_owner_id)
      .eq('requester_id', body.requester_id || user.id)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'Ya tienes una solicitud pendiente para esta lista',
        request: existingRequest 
      }, { status: 409 }) // 409 Conflict
    }

    // Crear la solicitud en la base de datos
    const { data: newRequest, error } = await supabase
      .from('list_access_requests')
      .insert({
        list_owner_id: body.list_owner_id,
        requester_id: body.requester_id || user.id,
        requester_email: body.requester_email,
        requester_name: body.requester_name,
        list_name: body.list_name || 'Mi Lista Personal',
        message: body.message,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating access request:', error)
      return NextResponse.json({ error: 'Error al crear solicitud: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/access-requests:', error)
    return NextResponse.json({ error: 'Error interno del servidor: ' + error.message }, { status: 500 })
  }
}
