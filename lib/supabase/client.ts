import { createBrowserClient } from '@supabase/ssr'
import { createMockSupabaseClient, isSupabaseConfigured } from './mock'

// Check if Supabase is configured
const isConfigured = isSupabaseConfigured()

// Client-side Supabase client usando @supabase/ssr para compartir sesión con el servidor
export const supabase = isConfigured 
  ? createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : createMockSupabaseClient() as any

// For use in client components
export const createClientComponentClient = () => isConfigured
  ? createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : createMockSupabaseClient() as any
