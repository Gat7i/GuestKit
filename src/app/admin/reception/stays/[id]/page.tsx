import { createClient } from '@/lib/supabase/server-client'
import { getCurrentHotelServer } from '@/lib/hotel-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StayActions from './StayActions'

export default async function StayDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const hotel = await getCurrentHotelServer()

  if (!hotel) {
    return notFound()
  }

  // Récupérer le séjour avec toutes ses relations (SANS la jointure profiles)
  const { data: stay, error } = await supabase
    .from('stays')
    .select(`
      *,
      primary_customer:customers!primary_customer_id(
        customer_uuid,
        full_name,
        email,
        phone,
        avatar_url
      ),
      room:rooms(
        id,
        room_number,
        room_type,
        floor,
        bed_count,
        max_occupancy,
        has_balcony,
        has_sea_view,
        has_mountain_view,
        base_price
      ),
      companions(
        id,
        full_name,
        birth_date,
        nationality,
        id_document_type,
        id_document_number
      )
    `)
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .single()

  if (error || !stay) {
    console.error('Erreur chargement séjour:', error)
    notFound()
  }

  // Récupérer les infos du créateur séparément (optionnel)
  let creatorName = null
  if (stay.created_by) {
    const { data: user } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', stay.created_by)
      .single()
    
    creatorName = user
  }

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

  const paymentStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    refunded: 'bg-gray-100 text-gray-800'
  }

  const nights = Math.ceil(
    (new Date(stay.check_out_date).getTime() - new Date(stay.check_in_date).getTime()) / 
    (1000 * 60 * 60 * 24)
  )

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* En-tête avec actions */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Séjour {stay.booking_reference}
            </h1>
            <p className="text-gray-600 mt-1">
              {hotel.name} • Créé le {new Date(stay.created_at).toLocaleDateString('fr-FR')}
              {creatorName && (
                <> par {creatorName.first_name} {creatorName.last_name}</>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/admin/reception/stays/${stay.id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              ✏️ Modifier
            </Link>
            <Link
              href="/admin/reception/active-guests"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              ← Retour
            </Link>
          </div>
        </div>

        {/* Statuts */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500 mb-1">Statut du séjour</p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[stay.status as keyof typeof statusColors]}`}>
              {statusLabels[stay.status as keyof typeof statusLabels]}
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500 mb-1">Statut du paiement</p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatusColors[stay.payment_status as keyof typeof paymentStatusColors]}`}>
              {stay.payment_status === 'pending' && 'En attente'}
              {stay.payment_status === 'paid' && 'Payé'}
              {stay.payment_status === 'refunded' && 'Remboursé'}
            </span>
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Client principal */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">👤</span>
              Client principal
            </h2>
            <div className="flex items-start gap-4">
              {stay.primary_customer.avatar_url ? (
                <img
                  src={stay.primary_customer.avatar_url}
                  alt={stay.primary_customer.full_name}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-blue-600">
                    {(stay.primary_customer.full_name || stay.primary_customer.email)[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-xl font-medium text-gray-900">
                  {stay.primary_customer.full_name || 'Non renseigné'}
                </p>
                <p className="text-gray-600">{stay.primary_customer.email}</p>
                {stay.primary_customer.phone && (
                  <p className="text-gray-600 text-sm mt-1">📞 {stay.primary_customer.phone}</p>
                )}
                <Link
                  href={`/admin/reception/guests/${stay.primary_customer.customer_uuid}`}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                >
                  Voir la fiche client →
                </Link>
              </div>
            </div>
          </div>

          {/* Chambre */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🛏️</span>
              Chambre
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Numéro</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stay.room.room_number}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="text-gray-900 capitalize">{stay.room.room_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Étage</p>
                  <p className="text-gray-900">{stay.room.floor || 'RDC'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capacité max</p>
                  <p className="text-gray-900">{stay.room.max_occupancy} pers.</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lits</p>
                  <p className="text-gray-900">{stay.room.bed_count}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-2">
                {stay.room.has_balcony && <span className="text-sm bg-gray-100 px-2 py-1 rounded">Balcon</span>}
                {stay.room.has_sea_view && <span className="text-sm bg-gray-100 px-2 py-1 rounded">Vue mer</span>}
                {stay.room.has_mountain_view && <span className="text-sm bg-gray-100 px-2 py-1 rounded">Vue montagne</span>}
              </div>
              {stay.room.base_price && (
                <p className="text-sm text-gray-600 mt-2">
                  Prix de base: {stay.room.base_price}€ / nuit
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dates du séjour */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Dates du séjour
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Arrivée prévue</p>
              <p className="text-lg font-medium text-gray-900">
                {new Date(stay.check_in_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              {stay.actual_check_in && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Arrivée le {new Date(stay.actual_check_in).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Départ prévu</p>
              <p className="text-lg font-medium text-gray-900">
                {new Date(stay.check_out_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              {stay.actual_check_out && (
                <p className="text-sm text-orange-600 mt-1">
                  ✓ Départ le {new Date(stay.actual_check_out).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Durée</p>
              <p className="text-2xl font-bold text-gray-900">
                {nights} nuit{nights > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-gray-600">
                {stay.adults_count} adulte{stay.adults_count > 1 ? 's' : ''}
                {stay.children_count > 0 && `, ${stay.children_count} enfant${stay.children_count > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>

        {/* Accompagnants */}
        {stay.companions && stay.companions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Accompagnants ({stay.companions.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stay.companions.map((companion: any) => (
                <div key={companion.id} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{companion.full_name}</p>
                  {companion.birth_date && (
                    <p className="text-sm text-gray-600">
                      Né(e) le {new Date(companion.birth_date).toLocaleDateString('fr-FR')}
                      {companion.nationality && ` • ${companion.nationality}`}
                    </p>
                  )}
                  {(companion.id_document_type || companion.id_document_number) && (
                    <p className="text-xs text-gray-500 mt-2">
                      {companion.id_document_type}: {companion.id_document_number}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demandes spéciales */}
        {stay.special_requests && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              Demandes spéciales
            </h2>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
              {stay.special_requests}
            </p>
          </div>
        )}

        {/* Montant */}
        {stay.total_amount && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              Montant
            </h2>
            <p className="text-3xl font-bold text-gray-900">
              {stay.total_amount} {stay.currency}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Soit {Math.round(stay.total_amount / nights)} {stay.currency} par nuit
            </p>
          </div>
        )}

        {/* Composant client pour les actions */}
        <StayActions stay={stay} />
      </div>
    </div>
  )
}