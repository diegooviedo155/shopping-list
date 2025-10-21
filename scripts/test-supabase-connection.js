const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testSupabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno de Supabase no encontradas')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Presente' : 'Faltante')
    return
  }

  console.log('🔗 Conectando a Supabase...')
  console.log('URL:', supabaseUrl)

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Probar conexión básica
    const { data, error } = await supabase.from('list_access_requests').select('count').limit(1)
    
    if (error) {
      console.error('❌ Error al conectar con Supabase:', error.message)
      
      if (error.message.includes('relation "list_access_requests" does not exist')) {
        console.log('💡 La tabla list_access_requests no existe. Necesitas ejecutar la migración SQL.')
      }
    } else {
      console.log('✅ Conexión a Supabase exitosa')
      console.log('📊 Datos de prueba:', data)
    }
  } catch (err) {
    console.error('❌ Error inesperado:', err.message)
  }
}

testSupabaseConnection()
