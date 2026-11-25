import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const UNDER_CONSTRUCTION_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GuestKit — Bientôt disponible</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #2563eb, #4f46e5); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: white; }
    .card { text-align: center; padding: 3rem 2rem; max-width: 480px; }
    .logo { font-size: 2.5rem; font-weight: 800; letter-spacing: -1px; margin-bottom: 1rem; }
    .logo span { opacity: 0.7; }
    h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.75rem; }
    p { opacity: 0.8; line-height: 1.6; font-size: 1rem; }
    .badge { display: inline-block; margin-top: 2rem; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 100px; padding: 0.4rem 1.2rem; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Guest<span>Kit</span></div>
    <h1>Site en construction</h1>
    <p>Nous préparons quelque chose d'exceptionnel pour révolutionner l'expérience client hôtelière.</p>
    <div class="badge">✦ Bientôt disponible</div>
  </div>
</body>
</html>`

export async function middleware(request: NextRequest) {
  // Page "en construction" pour le domaine racine (hors /lesorangers)
  if (request.nextUrl.pathname === '/') {
    return new NextResponse(UNDER_CONSTRUCTION_HTML, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  if (request.nextUrl.pathname.startsWith('/admin/login')) {
    return response
  }

  // getUser() valide le JWT côté Supabase (contrairement à getSession())
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Utiliser nextUrl.clone() pour conserver le basePath dans le redirect
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/', '/admin/:path*'],
}
