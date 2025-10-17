import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getAuthenticatedUserId, getUserIdFromRequest } from '@/lib/auth/server-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const categoryId = searchParams.get('category_id')

    // Intentar obtener el usuario del token JWT primero
    let user_id = getUserIdFromRequest(request)
    
    if (!user_id) {
      // Si no se puede obtener del token, intentar con cookies
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              // No-op for server-side
            },
          },
        }
      )

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Error getting authenticated user:', authError)
        return NextResponse.json(
          { error: 'Unauthorized - User not authenticated' },
          { status: 401 }
        )
      }
      
      user_id = user.id
    }

    // Usar el cliente de Supabase básico para la consulta
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    let query = supabase
      .from('shopping_items')
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          icon,
          color
        )
      `)
      .eq('user_id', user_id)
      .order('order_index', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data: items, error } = await query

    if (error) {
      console.error('Error fetching shopping items:', error)
      return NextResponse.json(
        { error: 'Failed to fetch shopping items' },
        { status: 500 }
      )
    }

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error in shopping items API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category_id, status, completed = false } = body

    // Intentar obtener el usuario del token JWT primero
    let user_id = getUserIdFromRequest(request)
    
    if (!user_id) {
      // Si no se puede obtener del token, intentar con cookies
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              // No-op for server-side
            },
          },
        }
      )

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Error getting authenticated user:', authError)
        return NextResponse.json(
          { error: 'Unauthorized - User not authenticated' },
          { status: 401 }
        )
      }
      
      user_id = user.id
    }

    // Usar el cliente de Supabase básico para la consulta
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const now = new Date().toISOString()
    
    const { data: item, error } = await supabase
      .from('shopping_items')
      .insert({
        id: crypto.randomUUID(),
        name,
        category_id,
        status,
        completed,
        order_index: 0,
        user_id,
        created_at: now,
        updated_at: now
      })
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          icon,
          color
        )
      `)
      .single()

    if (error) {
      console.error('Error creating shopping item:', error)
      return NextResponse.json(
        { error: 'Failed to create shopping item', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error in shopping items POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
