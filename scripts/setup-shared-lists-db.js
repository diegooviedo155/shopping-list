const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function setupSharedListsDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno de Supabase no encontradas')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Presente' : 'Faltante')
    return
  }

  console.log('🔗 Conectando a Supabase...')

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })

    const migrationFilePath = path.join(__dirname, '../supabase/migrations/20250121_shared_lists_complete.sql')
    const migrationSql = fs.readFileSync(migrationFilePath, 'utf8')

    console.log('📄 Ejecutando migración completa...')

    // Dividir el SQL en consultas individuales
    const queries = migrationSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'))

    console.log(`📝 Ejecutando ${queries.length} consultas...`)

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      if (query.trim()) {
        console.log(`\n🔄 Ejecutando consulta ${i + 1}/${queries.length}:`)
        console.log(query.substring(0, 100) + (query.length > 100 ? '...' : ''))
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: query })
          
          if (error) {
            console.error(`❌ Error en consulta ${i + 1}:`, error.message)
            // Continuar con las siguientes consultas
          } else {
            console.log(`✅ Consulta ${i + 1} ejecutada exitosamente`)
            if (data) {
              console.log('📊 Resultado:', data)
            }
          }
        } catch (err) {
          console.error(`❌ Error ejecutando consulta ${i + 1}:`, err.message)
        }
      }
    }

    // Verificar que las tablas se crearon
    console.log('\n🔍 Verificando tablas creadas...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['list_access_requests', 'shared_list_access'])

    if (tablesError) {
      console.error('❌ Error verificando tablas:', tablesError.message)
    } else {
      console.log('✅ Tablas encontradas:', tables?.map(t => t.table_name) || [])
    }

    // Verificar datos de prueba
    console.log('\n📊 Verificando datos de prueba...')
    
    const { data: requests, error: requestsError } = await supabase
      .from('list_access_requests')
      .select('*')

    if (requestsError) {
      console.error('❌ Error verificando solicitudes:', requestsError.message)
    } else {
      console.log(`✅ Solicitudes encontradas: ${requests?.length || 0}`)
      if (requests && requests.length > 0) {
        console.log('📋 Primera solicitud:', {
          id: requests[0].id,
          requester_name: requests[0].requester_name,
          status: requests[0].status
        })
      }
    }

    const { data: sharedAccess, error: sharedError } = await supabase
      .from('shared_list_access')
      .select('*')

    if (sharedError) {
      console.error('❌ Error verificando acceso compartido:', sharedError.message)
    } else {
      console.log(`✅ Accesos compartidos encontrados: ${sharedAccess?.length || 0}`)
      if (sharedAccess && sharedAccess.length > 0) {
        console.log('📋 Primer acceso:', {
          id: sharedAccess[0].id,
          list_name: sharedAccess[0].list_name,
          member_id: sharedAccess[0].member_id
        })
      }
    }

    console.log('\n🎉 ¡Configuración de base de datos completada!')

  } catch (error) {
    console.error('❌ Error inesperado:', error.message)
  }
}

setupSharedListsDatabase()
