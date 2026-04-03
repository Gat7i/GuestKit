import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // ✅ CORRECTION 1: Utiliser user_id au lieu de id
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select(`
      customer_uuid,
      full_name,
      email,
      avatar_url,
      stays(
        id,
        booking_reference,
        check_in_date,
        check_out_date,
        status,
        room:rooms(
          room_number,
          room_type
        )
      )
    `)
    .eq('user_id', user.id)
    .maybeSingle()

  if (customerError) {
    console.error('Erreur chargement client:', customerError)
  }

  // ✅ Filtrer les séjours actifs
  const activeStays = customer?.stays?.filter((stay: any) => 
    stay.status === 'active'
  ) || []

  const pastStays = customer?.stays?.filter((stay: any) => 
    stay.status !== 'active'
  ) || []

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Profil */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Mon profil
          </h1>
          
          <div className="flex items-center gap-4 mb-6">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                👤
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {customer?.full_name || user.user_metadata?.full_name || user.email}
              </p>
              <p className="text-sm text-gray-500">
                {user.email} • Connecté avec {user.app_metadata?.provider || 'email'}
              </p>
            </div>
          </div>

          {/* Séjour actif */}
          {activeStays.length > 0 ? (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Séjour en cours
              </h2>
              <div className="space-y-3">
                {activeStays.map((stay: any) => (
                  <Link
                    key={stay.id}
                    href={`/stays/${stay.id}`}
                    className="block bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">
                          🏨 Chambre {stay.room?.room_number || '?'} • {stay.room?.room_type || ''}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          📅 Du {new Date(stay.check_in_date).toLocaleDateString('fr-FR')} 
                          au {new Date(stay.check_out_date).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Réf: {stay.booking_reference}
                        </p>
                      </div>
                      <span className="text-green-600 font-medium">Voir détails →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="font-medium text-amber-800">
                    Vous n'avez pas de séjour actif
                  </p>
                  <p className="text-sm text-amber-600">
                    Présentez-vous à la réception pour enregistrer votre arrivée.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Anciens séjours */}
          {pastStays.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Historique des séjours
              </h2>
              <div className="space-y-2">
                {pastStays.map((stay: any) => (
                  <Link
                    key={stay.id}
                    href={`/stays/${stay.id}`}
                    className="block bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">
                          Chambre {stay.room?.room_number || '?'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(stay.check_in_date).toLocaleDateString('fr-FR')} → {new Date(stay.check_out_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className="text-gray-400 text-sm">Voir</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bouton déconnexion */}
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  )
}