// Mock Supabase client for development when Supabase is not configured
export const createMockSupabaseClient = () => ({
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      // Simular login exitoso para cualquier email/password
      const mockUser = {
        id: 'mock-user-id',
        email: email,
        user_metadata: {
          full_name: email.split('@')[0]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      return { 
        data: { 
          user: mockUser,
          session: {
            user: mockUser,
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token'
          }
        }, 
        error: null 
      }
    },
    signUp: async ({ email, password, options }: { email: string; password: string; options?: any }) => {
      // Simular registro exitoso
      const mockUser = {
        id: 'mock-user-id',
        email: email,
        user_metadata: {
          full_name: options?.data?.full_name || email.split('@')[0]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      return { 
        data: { 
          user: mockUser,
          session: {
            user: mockUser,
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token'
          }
        }, 
        error: null 
      }
    },
    signOut: async () => ({ error: null }),
    signInWithOAuth: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getSession: async () => ({ data: { session: null } })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        order: () => ({
          order: () => ({ data: [], error: null })
        })
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: null })
        }),
        single: async () => ({ data: null, error: null })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({ data: null, error: null })
          }),
          single: async () => ({ data: null, error: null })
        })
      }),
      delete: () => ({
        eq: async () => ({ error: null })
      })
    })
  })
})

export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
