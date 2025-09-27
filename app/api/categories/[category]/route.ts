import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface Context {
  params: {
    category: string
  }
}

export async function GET(
  request: Request,
  { params }: Context
) {
  try {
    // Get the category from the URL path
    const { category } = await Promise.resolve({ category: params.category });

    if (!category) {
      throw new Error('Category parameter is required');
    }

    // Decode the category from the URL
    const decodedCategory = decodeURIComponent(category);

    // Create Supabase client
    const supabase = await createClient();

    // Get items for the specific category
    const { data: items, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('category', decodedCategory)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json(items || []);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { 
        error: 'Error al cargar los productos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
