#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up Supabase for Lo Que Falta...\n')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!')
  console.log('📝 Please create a .env.local file with your Supabase credentials:')
  console.log(`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  `)
  console.log('\n📖 See supabase-config.example.md for detailed instructions.')
  process.exit(1)
}

// Read .env.local
const envContent = fs.readFileSync(envPath, 'utf8')
const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL=')
const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=')

if (!hasSupabaseUrl || !hasSupabaseKey) {
  console.log('❌ Missing Supabase credentials in .env.local!')
  console.log('📝 Please add the following to your .env.local file:')
  console.log(`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  `)
  process.exit(1)
}

console.log('✅ Supabase credentials found in .env.local')

// Check if Supabase CLI is installed
try {
  execSync('supabase --version', { stdio: 'pipe' })
  console.log('✅ Supabase CLI is installed')
} catch (error) {
  console.log('❌ Supabase CLI not found!')
  console.log('📦 Please install it:')
  console.log('   npm install -g supabase')
  console.log('   or')
  console.log('   brew install supabase/tap/supabase')
  process.exit(1)
}

console.log('\n📋 Next steps:')
console.log('1. Copy env.example to .env.local:')
console.log('   cp env.example .env.local')
console.log('2. Go to your Supabase dashboard: https://supabase.com/dashboard')
console.log('3. Create a new project or use an existing one')
console.log('4. Go to Settings > API and copy your project URL and anon key')
console.log('5. Update your .env.local file with the credentials')
console.log('6. Go to SQL Editor in your Supabase dashboard')
console.log('7. Run the SQL from supabase/schema.sql')
console.log('8. Go to Authentication > Providers and enable Google/Apple if needed')
console.log('9. Set up OAuth redirect URLs:')
console.log('   - Google: http://localhost:3000/auth/callback')
console.log('   - Apple: http://localhost:3000/auth/callback')

console.log('\n🎉 Setup complete! Run "pnpm dev" to start the application.')
