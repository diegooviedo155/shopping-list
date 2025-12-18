import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Obtener el usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener listas compartidas donde el usuario es miembro
    const { data: sharedLists, error } = await supabase
      .from('shared_list_access')
      .select('*')
      .eq('member_id', user.id)
      .order('granted_at', { ascending: false })

    if (error) {
      console.error('Error fetching shared lists:', error)
      return NextResponse.json({ error: 'Error al obtener listas compartidas' }, { status: 500 })
    }

    // Obtener información de los propietarios
    const ownerIds = [...new Set(sharedLists?.map(list => list.list_owner_id) || [])]
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', ownerIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    }

    // Crear mapa de propietarios
    const ownersMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Transformar los datos para incluir información del propietario
    const listsWithOwner = sharedLists?.map(list => {
      const owner = ownersMap.get(list.list_owner_id)
      // Extraer nombre del email de forma más inteligente
      const emailUsername = owner?.email?.split('@')[0] || 'Usuario'
      // Capitalizar primera letra: "diego" -> "Diego"
      const capitalizedName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1)
      
      return {
        ...list,
        owner_email: owner?.email || 'usuario@ejemplo.com',
        owner_name: owner?.full_name || capitalizedName
      }
    }) || []

    return NextResponse.json({ sharedLists: listsWithOwner })
  } catch (error) {
    console.error('Error in GET /api/shared-lists/my-access:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
