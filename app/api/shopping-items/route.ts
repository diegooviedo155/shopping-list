import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - User not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const categoryId = searchParams.get('category_id')

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
      .eq('user_id', user.id)
      .order('order_index', { ascending: true })

    if (status) query = query.eq('status', status)
    if (categoryId) query = query.eq('category_id', categoryId)

    const { data: items, error } = await query

    if (error) {
      console.error('Error fetching shopping items:', error)
      return NextResponse.json({ error: 'Failed to fetch shopping items' }, { status: 500 })
    }

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error in shopping items API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - User not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { name, category_id, status, completed = false } = body

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
        user_id: user.id,
        created_at: now,
        updated_at: now,
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
      return NextResponse.json({ error: 'Failed to create shopping item', details: error.message }, { status: 500 })
    }

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error in shopping items POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
