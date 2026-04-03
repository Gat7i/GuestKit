'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import Link from 'next/link'

export default function ReceptionHomePage() {
  const [hotel, setHotel] = useState<any>(null)
  const [stats, setStats] = useState({
    newCustomers: 0,
    activeGuests: 0,
    totalStays: 0,
    pendingStays: 0  // ← AJOUT ICI
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🔍 Initialisation page réception...')
        const hotelData = await getCurrentHotelClient()
        console.log('🏨 Hôtel récupéré:', hotelData)
        
        setHotel(hotelData)
        
        if (hotelData) {
          await loadStats(hotelData.id)
        } else {
          console.log('⚠️ Aucun hôtel trouvé pour cet utilisateur')
          setLoading(false)
        }
      } catch (error) {
        console.error('❌ Erreur initialisation:', error)
        setLoading(false)
      }
    }
    init()
  }, [])

  async function loadStats(hotelId: number) {
    try {
      console.log('📊 Chargement des statistiques pour hotelId:', hotelId)
      
      // 1. Nouveaux clients sans séjour actif
      const { data: allCustomers, error: customersError } = await supabase
        .from('customers')
        .select('customer_uuid')
        .eq('hotel_id', hotelId)

      if (customersError) throw customersError
      
      // Récupérer les clients avec séjour actif
      const { data: activeStays, error: staysError } = await supabase
        .from('stays')
        .select('primary_customer_id')
        .eq('hotel_id', hotelId)
        .eq('status', 'active')

      if (staysError) throw staysError

      const activeCustomerIds = new Set(activeStays?.map(s => s.primary_customer_id) || [])
      const newCustomers = (allCustomers || []).filter(c => !activeCustomerIds.has(c.customer_uuid)).length

      // 2. Clients actuellement en séjour
      const { count: activeGuests, error: activeError } = await supabase
        .from('stays')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', hotelId)
        .eq('status', 'active')

      if (activeError) throw activeError

      // 3. Total des séjours
      const { count: totalStays, error: totalError } = await supabase
        .from('stays')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', hotelId)

      if (totalError) throw totalError

      // 4. Demandes de séjour en attente (upcoming)
      const { count: pendingStays, error: pendingError } = await supabase
        .from('stays')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', hotelId)
        .eq('status', 'upcoming')

      if (pendingError) throw pendingError

      const newStats = {
        newCustomers: newCustomers || 0,
        activeGuests: activeGuests || 0,
        totalStays: totalStays || 0,
        pendingStays: pendingStays || 0  // ← AJOUT ICI
      }

      console.log('✅ Statistiques calculées:', newStats)
      setStats(newStats)
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const modules = [
    {
      title: 'Nouveaux clients',
      description: 'Clients inscrits sans séjour assigné',
      icon: '✅',
      href: '/admin/reception/check-in',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      count: stats.newCustomers
    },
    {
      title: 'Clients présents',
      description: 'Clients actuellement en séjour',
      icon: '🏨',
      href: '/admin/reception/active-guests',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      count: stats.activeGuests
    },
    {
      title: 'Historique',
      description: 'Tous les séjours passés',
      icon: '📋',
      href: '/admin/reception/history',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      count: stats.totalStays
    },
    {
      title: 'Demandes de séjour',
      description: 'Nouvelles demandes en attente',
      icon: '🏨',
      href: '/admin/reception/stay-requests',
      color: 'from-amber-500 to-yellow-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      count: stats.pendingStays  // ← AJOUT ICI
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">👥</div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span>👥</span> Accueil Réception
            {hotel && (
              <span className="text-lg font-normal text-gray-500 ml-2">
                - {hotel.name}
              </span>
            )}
          </h1>
          <p className="text-gray-600">
            Gérez les arrivées et les clients présents
          </p>
        </div>

        {/* Cartes des modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`
                    w-14 h-14 rounded-2xl bg-gradient-to-br ${module.color} 
                    flex items-center justify-center text-white text-2xl
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    {module.icon}
                  </div>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    {module.count}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition">
                  {module.title}
                </h3>
                
                <p className="text-sm text-gray-600">
                  {module.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Actions rapides */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Actions rapides
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/reception/check-in"
              className="bg-white hover:bg-green-50 rounded-xl p-4 text-center transition border border-gray-200 hover:border-green-300"
            >
              <div className="text-3xl mb-2">✅</div>
              <div className="text-sm font-medium text-gray-700">Enregistrer arrivée</div>
            </Link>
            <Link
              href="/admin/reception/stays/new"
              className="bg-white hover:bg-blue-50 rounded-xl p-4 text-center transition border border-gray-200 hover:border-blue-300"
            >
              <div className="text-3xl mb-2">📝</div>
              <div className="text-sm font-medium text-gray-700">Nouveau séjour</div>
            </Link>
            <Link
              href="/admin/reception/stay-requests"
              className="bg-white hover:bg-amber-50 rounded-xl p-4 text-center transition border border-gray-200 hover:border-amber-300"
            >
              <div className="text-3xl mb-2">🏨</div>
              <div className="text-sm font-medium text-gray-700">Demandes séjour</div>
              {stats.pendingStays > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {stats.pendingStays}
                </span>
              )}
            </Link>
            <Link
              href="/admin/reception/active-guests"
              className="bg-white hover:bg-purple-50 rounded-xl p-4 text-center transition border border-gray-200 hover:border-purple-300"
            >
              <div className="text-3xl mb-2">🏨</div>
              <div className="text-sm font-medium text-gray-700">Clients présents</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}