import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { completed, status } = await request.json();

    if (typeof completed === 'undefined' && !status) {
      return NextResponse.json(
        { error: 'Se requiere al menos un campo para actualizar (completed o status)' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Prepare update data
    const updateData: { 
      completed?: boolean;
      status?: string;
      updated_at?: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (typeof completed !== 'undefined') {
      updateData.completed = completed;
    }
    
    if (status) {
      updateData.status = status;
    }

    // Update the item
    const { data, error } = await supabase
      .from('shopping_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error al actualizar el ítem',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
