import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const hotelSlug = requestUrl.searchParams.get('hotel')

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

    if (user && hotelSlug) {
      // Récupérer l'ID de l'hôtel à partir du slug
      const { data: hotel } = await supabase
        .from('hotels')
        .select('id')
        .eq('slug', hotelSlug)
        .single()

      if (hotel) {
        // Mettre à jour le customer avec le bon hotel_id
        await supabase
          .from('customers')
          .update({ hotel_id: hotel.id })
          .eq('id', user.id)
      }
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/profile`)
}