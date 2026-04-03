// src/proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const url = request.nextUrl
  const pathname = url.pathname
  const hostname = request.headers.get('host') || ''
  
  // 🔴 PARAMÈTRE DE TEST : ?hotel=xxx
  // Permet de forcer un hôtel pour les tests sans sous-domaine
  const forcedHotel = url.searchParams.get('hotel')
  if (forcedHotel) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-hotel-slug', forcedHotel)
    return NextResponse.next({
      request: { headers: requestHeaders }
    })
  }

  // 🔴 PROTECTION DES ROUTES ADMIN
  // Si l'utilisateur essaie d'accéder à /admin sans être connecté
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    try {
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

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        const redirectUrl = new URL('/admin/login', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Erreur d\'authentification:', error)
      const redirectUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // ✅ TOUT EST OK - On laisse passer
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Protège toutes les routes admin
    '/admin/:path*',
    // Permet le paramètre ?hotel= sur toutes les routes (optionnel)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}