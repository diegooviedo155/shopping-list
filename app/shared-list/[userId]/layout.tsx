import { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ userId: string }>
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { userId } = await params
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  // Obtener información del propietario
  let ownerName = 'Usuario'
  let ownerEmail = ''
  
  try {
    const supabase = await createServerClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()
    
    if (profile) {
      ownerName = profile.full_name || profile.email?.split('@')[0] || 'Usuario'
      ownerEmail = profile.email || ''
    }
  } catch (error) {
    console.error('Error fetching owner profile for metadata:', error)
  }
  
  const title = `Lista de Compras - ${ownerName} | Lo Que Falta`
  const description = `Lista de compras compartida por ${ownerName}. Colabora en esta lista y nunca olvides lo que necesitas comprar.`
  const url = `${baseUrl}/shared-list/${userId}`
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Lo Que Falta',
      type: 'website',
      images: [
        {
          url: '/apple-splash-2048-1536.jpg',
          width: 2048,
          height: 1536,
          alt: `Lista de Compras - ${ownerName}`,
        },
      ],
      locale: 'es_ES',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/apple-splash-2048-1536.jpg'],
    },
    alternates: {
      canonical: url,
    },
  }
}

export default function SharedListLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

