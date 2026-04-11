'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import { useToast, ToastContainer } from '@/components/admin/Toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Customer = {
  customer_uuid: string
  email: string
  full_name: string | null
  avatar_url: string | null
  provider: string | null
  created_at: string
  last_sign_in_at: string | null
}

export default function CheckInPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast, toasts } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🔍 Chargement de hotel')
        const hotelData = await getCurrentHotelClient()
        console.log('1111111')
        setHotel(hotelData)
        console.log('2222222',hotelData)
        if (hotelData) {
            console.log('hotel id :',hotelData.id)
          await loadCustomers(hotelData.id)
        } else {
          setLoading(false) // ← Important si pas d'hôtel
        }
      } catch (error) {
        console.error('Erreur init:', error)
        setLoading(false) // ← Important en cas d'erreur
      }
    }
    init()
  }, [])

  async function loadCustomers(hotelId: number) {
    try {
      console.log('🔍 Chargement des clients pour hotelId:', hotelId)
      
      // 1. Récupérer tous les clients de l'hôtel
      const { data: allCustomers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false })

      if (customersError) throw customersError
      console.log('📊 Tous les clients:', allCustomers?.length || 0)

      // 2. Récupérer tous les IDs des clients avec un séjour actif
      const { data: activeStays, error: staysError } = await supabase
        .from('stays')
        .select('primary_customer_id')
        .eq('hotel_id', hotelId)
        .eq('status', 'active')

      if (staysError) throw staysError

      // 3. Créer un Set des IDs avec séjour actif
      const activeCustomerIds = new Set(activeStays?.map(s => s.primary_customer_id) || [])

      // 4. Filtrer les clients qui n'ont PAS de séjour actif
      const filtered = (allCustomers || []).filter(
        customer => !activeCustomerIds.has(customer.customer_uuid)
      )

      console.log('✅ Clients sans séjour actif:', filtered.length)
      setCustomers(filtered)
    } catch (error) {
      console.error('Erreur chargement clients:', error)
    } finally {
      setLoading(false) // ← TOUJOURS appelé
    }
  }

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.customer_uuid))
    }
  }

  const toggleSelect = (customerId: string) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const handleAssignStays = () => {
    if (selectedCustomers.length === 0) {
      toast('Veuillez sélectionner au moins un client', 'warning')
      return
    }
    const customerIds = selectedCustomers.join(',')
    router.push(`/admin/reception/stays/new?customers=${customerIds}`)
  }

  const filteredCustomers = customers.filter(customer =>
    customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">👥</div>
          <p className="text-gray-600">Chargement des nouveaux clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ToastContainer toasts={toasts} />
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>✅</span> Nouveaux clients à enregistrer
              {hotel && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  - {hotel.name}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              Sélectionnez les clients pour leur assigner un séjour
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAssignStays}
              disabled={selectedCustomers.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>📝</span>
              Assigner un séjour ({selectedCustomers.length})
            </button>
            <Link
              href="/admin/reception"
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition shadow-md"
            >
              ← Retour
            </Link>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <input
            type="text"
            placeholder="Rechercher un client par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Liste des clients */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Aucun nouveau client en attente
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.customer_uuid} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.customer_uuid)}
                          onChange={() => toggleSelect(customer.customer_uuid)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {customer.avatar_url ? (
                            <img
                              src={customer.avatar_url}
                              alt={customer.full_name || ''}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-lg text-blue-600">
                                {(customer.full_name || customer.email)[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.full_name || 'Non renseigné'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.provider === 'email' ? '📧 Email' : `🔗 ${customer.provider}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(customer.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.last_sign_in_at 
                          ? new Date(customer.last_sign_in_at).toLocaleDateString('fr-FR')
                          : 'Jamais'
                        }
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