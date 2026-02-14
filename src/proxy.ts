import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''
  
  // Extraire le sous-domaine (ex: hotel-paradis.guestskit.app → hotel-paradis)
  const subdomain = hostname.split('.')[0]
  
  // Si c'est l'admin ou localhost, on laisse passer
  if (subdomain === 'admin' || hostname.includes('localhost')) {
    return NextResponse.next()
  }
  
  // Récupérer l'hôtel correspondant au sous-domaine
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
    .select('id')
    .eq('slug', subdomain)
    .single()

  // Stocker l'ID de l'hôtel dans les headers
  if (hotel) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-hotel-id', hotel.id.toString())
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|admin).*)',
  ],
}