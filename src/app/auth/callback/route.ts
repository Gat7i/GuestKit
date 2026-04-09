import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)

    // Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const hotelId = parseInt(process.env.NEXT_PUBLIC_HOTEL_ID || '0')
      if (hotelId) {
        // Upsert customer lié à cet hôtel
        await supabase
          .from('customers')
          .upsert({
            user_id: user.id,
            hotel_id: hotelId,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
          }, { onConflict: 'user_id' })
      }
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/profile`)
}