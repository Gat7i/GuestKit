'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import Link from 'next/link'

type ActiveGuest = {
  id: string
  customer: {
    customer_uuid: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
  room: {
    room_number: string
    room_type: string
    floor: number | null
  }
  check_in_date: string
  check_out_date: string
  adults_count: number
  children_count: number
  status: string
}

export default function ActiveGuestsPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [activeGuests, setActiveGuests] = useState<ActiveGuest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      try {
        const hotelData = await getCurrentHotelClient()
        setHotel(hotelData)
        if (hotelData) {
          await loadActiveGuests(hotelData.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Erreur init:', error)
        setLoading(false)
      }
    }
    init()
  }, [])

  async function loadActiveGuests(hotelId: number) {
    try {
      console.log('🔍 Chargement des clients actifs pour hotelId:', hotelId)
      
      // Version simplifiée sans jointures complexes
      const { data: stays, error: staysError } = await supabase
        .from('stays')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('status', 'active')
        .order('check_in_date', { ascending: false })

      if (staysError) throw staysError
      console.log('📊 Séjours actifs trouvés:', stays?.length || 0)

      if (!stays || stays.length === 0) {
        setActiveGuests([])
        setLoading(false)
        return
      }

      // Récupérer les infos des clients et chambres séparément
      const enrichedStays = await Promise.all(
        stays.map(async (stay) => {
          const [customerResult, roomResult] = await Promise.all([
            supabase.from('customers').select('*').eq('customer_uuid', stay.primary_customer_id).single(),
            supabase.from('rooms').select('*').eq('id', stay.room_id).single()
          ])

          return {
            id: stay.id,
            customer: customerResult.data || {
              customer_uuid: stay.primary_customer_id,
              full_name: 'Client inconnu',
              email: 'email@inconnu.com',
              avatar_url: null
            },
            room: roomResult.data || {
              room_number: '?',
              room_type: '?',
              floor: null
            },
            check_in_date: stay.check_in_date,
            check_out_date: stay.check_out_date,
            adults_count: stay.adults_count,
            children_count: stay.children_count,
            status: stay.status
          }
        })
      )

      console.log('✅ Clients actifs chargés:', enrichedStays.length)
      setActiveGuests(enrichedStays)
    } catch (error) {
      console.error('Erreur chargement clients actifs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredGuests = activeGuests.filter(guest =>
    guest.customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.room.room_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🏨</div>
          <p className="text-gray-600">Chargement des clients présents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>🏨</span> Clients présents dans l'hôtel
              {hotel && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  - {hotel.name}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              {activeGuests.length} client{activeGuests.length > 1 ? 's' : ''} actuellement en séjour
            </p>
          </div>
          <Link
            href="/admin/reception"
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition shadow-md"
          >
            ← Retour
          </Link>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <input
            type="text"
            placeholder="Rechercher par nom, email ou numéro de chambre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Liste des clients actifs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chambre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates du séjour
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personnes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Aucun client présent pour le moment
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {guest.customer.avatar_url ? (
                            <img
                              src={guest.customer.avatar_url}
                              alt={guest.customer.full_name || ''}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-lg text-blue-600">
                                {(guest.customer.full_name || guest.customer.email)[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {guest.customer.full_name || 'Non renseigné'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {guest.customer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Chambre {guest.room.room_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {guest.room.room_type} • Étage {guest.room.floor || 'RDC'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(guest.check_in_date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-sm text-gray-500">
                          → {new Date(guest.check_out_date).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {guest.adults_count} adulte{guest.adults_count > 1 ? 's' : ''}
                          {guest.children_count > 0 && `, ${guest.children_count} enfant${guest.children_count > 1 ? 's' : ''}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/reception/guests/${guest.customer.customer_uuid}`}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Voir fiche
                        </Link>
                        <Link
                          href={`/admin/reception/stays/${guest.id}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Détails séjour
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}