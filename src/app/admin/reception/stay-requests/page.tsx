'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type StayRequest = {
  id: number
  hotel_id: number
  booking_reference: string
  check_in_date: string
  check_out_date: string
  adults_count: number
  children_count: number
  status: 'upcoming'
  special_requests: string | null
  created_at: string
  customer: {
    customer_uuid: string
    full_name: string | null
    email: string
    phone: string | null
  } | null
  room: {
    room_number: string
  } | null
  hotel?: {
    name: string
    slug: string
  }
}

export default function StayRequestsPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [requests, setRequests] = useState<StayRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<StayRequest | null>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [hotels, setHotels] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🔍 Initialisation stay-requests...')
        
        // 1. Récupérer la session utilisateur
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/admin/login')
          return
        }

        // 2. Récupérer le profil pour savoir si c'est un super_admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role_id, hotel_id')
          .eq('id', session.user.id)
          .single()

        console.log('👤 Profil utilisateur:', profile)

        // 3. Récupérer l'hôtel (peut être null pour super_admin)
        const hotelData = await getCurrentHotelClient()
        console.log('🏨 Hôtel récupéré:', hotelData)
        
        setHotel(hotelData)
        setIsSuperAdmin(!hotelData) // Si pas d'hôtel, c'est un super_admin

        // 4. Si super_admin, charger la liste de tous les hôtels
        if (!hotelData) {
          const { data: hotelsData } = await supabase
            .from('hotels')
            .select('id, name, slug')
            .order('name')
          
          setHotels(hotelsData || [])
          console.log('🏨 Tous les hôtels:', hotelsData)
        }

        // 5. Charger les données
        await loadData(hotelData)
        
      } catch (error) {
        console.error('❌ Erreur initialisation:', error)
        setError('Erreur lors de l\'initialisation')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Recharger quand l'hôtel sélectionné change (pour super_admin)
  useEffect(() => {
    if (isSuperAdmin && selectedHotelId) {
      loadRequests(selectedHotelId)
      loadRooms(selectedHotelId)
    }
  }, [selectedHotelId])

  async function loadData(hotelData: any) {
    if (hotelData) {
      // Admin normal - charge son hôtel
      await Promise.all([
        loadRequests(hotelData.id),
        loadRooms(hotelData.id)
      ])
    } else {
      // Super admin - ne charge rien tant qu'un hôtel n'est pas sélectionné
      console.log('👑 Mode super admin - en attente de sélection')
    }
  }

  async function loadRequests(hotelId: number) {
    try {
      console.log('📊 Chargement des demandes pour hotelId:', hotelId)
      
      const { data, error } = await supabase
        .from('stays')
        .select(`
          *,
          customer:customers(
            customer_uuid,
            full_name,
            email,
            phone
          ),
          room:rooms(room_number)
        `)
        .eq('hotel_id', hotelId)
        .eq('status', 'upcoming')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erreur SQL:', error)
        throw error
      }

      console.log('📦 Demandes trouvées:', data?.length || 0)
      setRequests(data || [])
    } catch (error) {
      console.error('❌ Erreur chargement demandes:', error)
      setError('Erreur lors du chargement des demandes')
    }
  }

  async function loadRooms(hotelId: number) {
    try {
      console.log('🛏️ Chargement des chambres pour hotelId:', hotelId)
      
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('is_active', true)
        .order('room_number')
      
      if (error) throw error
      
      console.log('🛏️ Chambres chargées:', data?.length || 0)
      setRooms(data || [])
    } catch (error) {
      console.error('❌ Erreur chargement chambres:', error)
    }
  }

  async function assignRoom(requestId: number, roomId: number) {
    if (!roomId) {
      alert('Veuillez sélectionner une chambre')
      return
    }

    setAssigning(true)
    try {
      console.log('📝 Assignation chambre:', { requestId, roomId })
      
      const { error } = await supabase
        .from('stays')
        .update({
          room_id: roomId,
          status: 'active',
          actual_check_in: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      console.log('✅ Séjour activé avec succès')
      alert('✅ Séjour activé avec succès')
      setSelectedRequest(null)
      
      // Recharger selon le contexte
      if (isSuperAdmin && selectedHotelId) {
        await loadRequests(selectedHotelId)
      } else if (hotel) {
        await loadRequests(hotel.id)
      }
      
      router.refresh()
    } catch (error) {
      console.error('❌ Erreur activation:', error)
      alert('❌ Erreur lors de l\'activation')
    } finally {
      setAssigning(false)
    }
  }

  // Affichage selon l'état
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-600">Chargement des demandes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Erreur</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Demandes de séjour
          </h1>
          <p className="text-gray-600">
            {isSuperAdmin 
              ? 'Mode Super Admin - Tous les hôtels' 
              : hotel?.name
            }
          </p>
        </div>

        {/* Sélecteur d'hôtel pour super_admin */}
        {isSuperAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <label className="block text-sm font-medium text-amber-800 mb-2">
              Sélectionnez un hôtel
            </label>
            <select
              onChange={(e) => setSelectedHotelId(e.target.value ? parseInt(e.target.value) : null)}
              value={selectedHotelId || ''}
              className="w-full md:w-96 rounded-lg border-amber-300 shadow-sm focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">-- Choisir un hôtel --</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.slug})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Message si super_admin et pas d'hôtel sélectionné */}
        {isSuperAdmin && !selectedHotelId && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-amber-200">
            <div className="text-6xl mb-4">🏨</div>
            <h3 className="text-xl font-medium text-amber-800 mb-2">
              Sélectionnez un hôtel
            </h3>
            <p className="text-amber-600">
              Veuillez choisir un hôtel dans la liste ci-dessus pour voir ses demandes.
            </p>
          </div>
        )}

        {/* Message si aucun hôtel pour admin normal */}
        {!isSuperAdmin && !hotel && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🏨</div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              Aucun hôtel assigné
            </h3>
            <p className="text-gray-600">
              Votre compte n'est associé à aucun hôtel.
            </p>
          </div>
        )}

        {/* Affichage des demandes */}
        {((!isSuperAdmin && hotel) || (isSuperAdmin && selectedHotelId)) && (
          <>
            {requests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🏨</div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  Aucune demande en attente
                </h3>
                <p className="text-gray-600">
                  Les nouvelles demandes de séjour apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                            En attente
                          </span>
                          <span className="text-sm text-gray-500">
                            {request.booking_reference}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                          {request.customer?.full_name || 'Client sans nom'}
                        </h2>
                        <p className="text-gray-600">{request.customer?.email || 'Email non disponible'}</p>
                        {request.customer?.phone && (
                          <p className="text-sm text-gray-500 mt-1">📞 {request.customer.phone}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        {selectedRequest?.id === request.id ? 'Annuler' : 'Assigner une chambre'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-4 rounded-lg mb-4">
                      <div>
                        <p className="text-gray-500">Arrivée</p>
                        <p className="font-medium text-gray-900">
                          {new Date(request.check_in_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Départ</p>
                        <p className="font-medium text-gray-900">
                          {new Date(request.check_out_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Personnes</p>
                        <p className="font-medium text-gray-900">
                          {request.adults_count} adulte{request.adults_count > 1 ? 's' : ''}
                          {request.children_count > 0 && `, ${request.children_count} enfant${request.children_count > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>

                    {request.special_requests && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-700 italic">
                          "{request.special_requests}"
                        </p>
                      </div>
                    )}

                    {selectedRequest?.id === request.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h3 className="font-medium text-gray-800 mb-3">
                          Assigner une chambre
                        </h3>
                        <div className="flex gap-3">
                          <select
                            id={`room-${request.id}`}
                            className="flex-1 rounded-lg border-gray-300 shadow-sm"
                            defaultValue=""
                          >
                            <option value="">Sélectionner une chambre...</option>
                            {rooms.map((room) => (
                              <option key={room.id} value={room.id}>
                                Chambre {room.room_number} • {room.room_type} • {room.max_occupancy} pers.
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const select = document.getElementById(`room-${request.id}`) as HTMLSelectElement
                              assignRoom(request.id, parseInt(select.value))
                            }}
                            disabled={assigning}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                          >
                            {assigning ? 'Traitement...' : 'Activer le séjour'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}