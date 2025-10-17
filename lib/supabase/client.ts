import { createClient } from '@supabase/supabase-js'
import { createMockSupabaseClient, isSupabaseConfigured } from './mock'

// Check if Supabase is configured
const isConfigured = isSupabaseConfigured()

// Client-side Supabase client
export const supabase = isConfigured 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    )
  : createMockSupabaseClient() as any

// For use in client components
export const createClientComponentClient = () => isConfigured
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  : createMockSupabaseClient() as any
