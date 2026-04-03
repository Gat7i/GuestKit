import { createClient } from '@/lib/supabase/server-client'
import { getCurrentHotelServer } from '@/lib/hotel-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function GuestDetailPage({
  params
}: {
  params: Promise<{ uuid: string }>
}) {
  const { uuid } = await params
  const supabase = await createClient()
  const hotel = await getCurrentHotelServer()

  if (!hotel) {
    return notFound()
  }

  // Récupérer les informations du client
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select(`
      *,
      stays(
        id,
        booking_reference,
        check_in_date,
        check_out_date,
        status,
        room:rooms(room_number, room_type),
        companions(count)
      )
    `)
    .eq('customer_uuid', uuid)
    .eq('hotel_id', hotel.id)
    .single()

  if (customerError || !customer) {
    console.error('Erreur chargement client:', customerError)
    notFound()
  }

  // Trier les séjours par date (du plus récent au plus ancien)
  const sortedStays = customer.stays?.sort((a: any, b: any) => 
    new Date(b.check_in_date).getTime() - new Date(a.check_in_date).getTime()
  ) || []

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    checked_out: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  const statusLabels = {
    upcoming: 'À venir',
    active: 'En cours',
    checked_out: 'Terminé',
    cancelled: 'Annulé'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* En-tête */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Fiche client
            </h1>
            <p className="text-gray-600">
              {hotel.name} • Client depuis le {new Date(customer.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <Link
            href="/admin/reception/active-guests"
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            ← Retour
          </Link>
        </div>

        {/* Informations personnelles */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Informations personnelles</h2>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {customer.avatar_url ? (
                  <img
                    src={customer.avatar_url}
                    alt={customer.full_name}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-4xl text-blue-600">
                      {(customer.full_name || customer.email)[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Détails */}
              <div className="flex-1 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nom complet</p>
                  <p className="text-lg font-medium text-gray-900">
                    {customer.full_name || 'Non renseigné'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="text-lg font-medium text-gray-900">{customer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                  <p className="text-lg font-medium text-gray-900">
                    {customer.phone || 'Non renseigné'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Compte créé via</p>
                  <p className="text-lg font-medium text-gray-900 capitalize">
                    {customer.provider || 'Non spécifié'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email vérifié</p>
                  <p className="text-lg font-medium text-gray-900">
                    {customer.is_email_verified ? (
                      <span className="text-green-600">✓ Oui</span>
                    ) : (
                      <span className="text-amber-600">✗ Non</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Compte utilisateur</p>
                  <p className="text-lg font-medium text-gray-900">
                    {customer.user_id ? (
                      <span className="text-green-600">✓ Lié</span>
                    ) : (
                      <span className="text-gray-500">Client sans compte</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* UUID (affiché de manière discrète) */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-400 font-mono break-all">
                UUID: {customer.customer_uuid}
              </p>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {customer.stays?.length || 0}
            </p>
            <p className="text-sm text-gray-600">Séjour(s) total</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-3xl font-bold text-green-600 mb-2">
              {customer.stays?.filter((s: any) => s.status === 'active').length || 0}
            </p>
            <p className="text-sm text-gray-600">Séjour(s) en cours</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-3xl font-bold text-purple-600 mb-2">
              {customer.stays?.reduce((acc: number, s: any) => acc + (s.companions?.[0]?.count || 0), 0) || 0}
            </p>
            <p className="text-sm text-gray-600">Accompagnants total</p>
          </div>
        </div>

        {/* Historique des séjours */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Historique des séjours</h2>
          </div>
          
          {sortedStays.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">Aucun séjour pour ce client</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedStays.map((stay: any) => (
                <div key={stay.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[stay.status as keyof typeof statusColors]}`}>
                        {statusLabels[stay.status as keyof typeof statusLabels]}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {stay.booking_reference}
                      </span>
                    </div>
                    <Link
                      href={`/admin/reception/stays/${stay.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                      Voir détails
                      <span>→</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Arrivée</p>
                      <p className="font-medium text-gray-900">
                        {new Date(stay.check_in_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Départ</p>
                      <p className="font-medium text-gray-900">
                        {new Date(stay.check_out_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Chambre</p>
                      <p className="font-medium text-gray-900">
                        {stay.room?.room_number || '?'} • {stay.room?.room_type || '?'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Accompagnants</p>
                      <p className="font-medium text-gray-900">
                        {stay.companions?.[0]?.count || 0}
                      </p>
                    </div>
                  </div>

                  {stay.actual_check_in && (
                    <p className="text-xs text-gray-500 mt-3">
                      ✓ Arrivée effective : {new Date(stay.actual_check_in).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bouton d'action */}
        <div className="mt-6 flex justify-center">
          <Link
            href={`/admin/reception/stays/new?customers=${customer.customer_uuid}`}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md inline-flex items-center gap-2"
          >
            <span>➕</span>
            Créer un nouveau séjour pour ce client
          </Link>
        </div>
      </div>
    </div>
  )
}