import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const url = request.nextUrl
  const forcedHotel = url.searchParams.get('hotel')

if (forcedHotel) {
  // Forcer un hôtel via le paramètre ?hotel=paradis
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-hotel-slug', forcedHotel)
  return NextResponse.next({
    request: { headers: requestHeaders }
  })
}
  const hostname = request.headers.get('host') || ''
  
  // Extraire le sous-domaine (ex: hotel-paradis.guestskit.app → hotel-paradis)
  const subdomain = hostname.split('.')[0]
  
  // Ignorer les domaines principaux et localhost
  const mainDomains = ['guestskit', 'www', 'localhost']
  if (mainDomains.includes(subdomain) || hostname.includes('localhost')) {
    return NextResponse.next()
  }
  
  // Pour les sous-domaines d'hôtels
  try {
    // Vérifier si ce sous-domaine correspond à un hôtel
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {},
          remove() {},
        },
      }
    )

    const { data: hotel } = await supabase
      .from('hotels')
      .select('id, name')
      .eq('slug', subdomain)
      .single()

    if (hotel) {
      // CORRECTION : Utiliser Headers standard
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-hotel-id', hotel.id.toString())
      requestHeaders.set('x-hotel-slug', subdomain)
      requestHeaders.set('x-hotel-name', hotel.name)
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du sous-domaine:', error)
  }
  
  // Si le sous-domaine n'existe pas, rediriger vers le site vitrine
  return NextResponse.redirect(new URL('https://guestskit.app', request.url))
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|admin).*)',
  ],
}