'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'

export function useHotelData() {
  const [hotel, setHotel] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [currentStay, setCurrentStay] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Récupérer l'hôtel depuis la config (variables d'env)
        const hotelId = parseInt(process.env.NEXT_PUBLIC_HOTEL_ID || '1')
        const { data: hotelData } = await supabase
          .from('hotels')
          .select('*')
          .eq('id', hotelId)
          .single()
        
        setHotel(hotelData)

        // 2. Vérifier si l'utilisateur est connecté
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // 3. Récupérer les infos du customer
          const { data: customerData } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()

          setCustomer(customerData)

          // 4. Récupérer le séjour actif s'il existe
          if (customerData) {
            const { data: stay } = await supabase
              .from('stays')
              .select(`
                *,
                room:rooms(room_number, room_type, floor)
              `)
              .eq('primary_customer_id', customerData.customer_uuid)
              .eq('status', 'active')
              .maybeSingle()

            setCurrentStay(stay)
          }
        }
      } catch (error) {
        console.error('Erreur chargement données:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  return { hotel, user, customer, currentStay, loading }
}