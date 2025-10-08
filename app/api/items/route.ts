import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get all items ordered by category and order_index
    const { data: items, error } = await supabase
      .from('shopping_items')
      .select('*')
      .order('category', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(items || []);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error al cargar los productos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
