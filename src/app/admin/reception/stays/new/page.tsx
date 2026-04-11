'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import { useToast, ToastContainer } from '@/components/admin/Toast'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Customer = {
  customer_uuid: string
  email: string
  full_name: string | null
  phone: string | null
}

export default function NewStayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><p className="text-gray-600">Chargement...</p></div>}>
      <NewStayForm />
    </Suspense>
  )
}

function NewStayForm() {
  const [hotel, setHotel] = useState<any>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast, toasts } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerIds = searchParams.get('customers')?.split(',') || []
  const supabase = createClient()
  
  // Utiliser un ref pour éviter les mises à jour en boucle
  const initialized = useRef(false)

  const [formData, setFormData] = useState({
    primary_customer_id: '',
    room_id: '',
    check_in_date: new Date().toISOString().split('T')[0],
    check_out_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    adults_count: 1,
    children_count: 0,
    special_requests: '',
    total_amount: ''
  })

  useEffect(() => {
    const init = async () => {
      try {
        const hotelData = await getCurrentHotelClient()
        setHotel(hotelData)
        
        if (hotelData) {
          await Promise.all([
            loadCustomers(hotelData.id),
            loadRooms(hotelData.id)
          ])
        }
      } catch (error) {
        console.error('Erreur initialisation:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Charger les clients sélectionnés UNE SEULE fois quand customers est prêt
  useEffect(() => {
    // Éviter de re-exécuter si déjà initialisé
    if (initialized.current) return
    if (customers.length === 0) return
    if (customerIds.length === 0) return

    console.log('🎯 Initialisation des clients sélectionnés')
    
    const selected = customers.filter(c => customerIds.includes(c.customer_uuid))
    setSelectedCustomers(selected)
    
    // Si un seul client, le sélectionner par défaut comme client principal
    if (selected.length === 1) {
      setFormData(prev => ({ ...prev, primary_customer_id: selected[0].customer_uuid }))
    }
    
    // Marquer comme initialisé
    initialized.current = true
  }, [customers, customerIds])

  async function loadCustomers(hotelId: number) {
    const { data } = await supabase
      .from('customers')
      .select('customer_uuid, email, full_name, phone')
      .eq('hotel_id', hotelId)
      .order('full_name', { ascending: true })

    setCustomers(data || [])
  }

  async function loadRooms(hotelId: number) {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('is_active', true)
      .order('room_number')

    setRooms(data || [])
  }

  async function createStay(e: React.FormEvent) {
    e.preventDefault()
    if (!hotel) return
    if (!formData.primary_customer_id) {
      toast('Veuillez sélectionner un client principal', 'warning')
      return
    }

    setSaving(true)
    try {
      // Générer une référence unique
      const bookingRef = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase()

      // 1. Créer le séjour principal
      const { data: stay, error: stayError } = await supabase
        .from('stays')
        .insert({
          hotel_id: hotel.id,
          primary_customer_id: formData.primary_customer_id,
          room_id: parseInt(formData.room_id),
          booking_reference: bookingRef,
          check_in_date: formData.check_in_date,
          check_out_date: formData.check_out_date,
          adults_count: formData.adults_count,
          children_count: formData.children_count,
          special_requests: formData.special_requests,
          total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
          status: 'upcoming',
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (stayError) throw stayError

      // 2. Ajouter les autres clients sélectionnés comme compagnons
      const otherCustomers = selectedCustomers.filter(c => c.customer_uuid !== formData.primary_customer_id)
      
      if (otherCustomers.length > 0) {
        const companionsToInsert = otherCustomers.map(c => ({
          stay_id: stay.id,
          full_name: c.full_name || c.email
        }))

        const { error: companionsError } = await supabase
          .from('companions')
          .insert(companionsToInsert)

        if (companionsError) throw companionsError
      }

      // 3. Mettre à jour le client principal
      await supabase
        .from('customers')
        .update({ 
          is_active: true 
        })
        .eq('customer_uuid', formData.primary_customer_id)

      toast('Séjour créé avec succès')
      router.push(`/admin/reception/stays/${stay.id}`)
      router.refresh()
    } catch (error) {
      console.error('Erreur création séjour:', error)
      toast('Erreur lors de la création', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">📅</div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ToastContainer toasts={toasts} />
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nouveau séjour
          </h1>
          <p className="text-gray-600">
            {hotel?.name} • {selectedCustomers.length} client(s) sélectionné(s)
          </p>
        </div>

        {/* Récapitulatif des clients sélectionnés */}
        {selectedCustomers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h2 className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
              <span>👥</span>
              Clients sélectionnés ({selectedCustomers.length})
            </h2>
            <div className="space-y-2">
              {selectedCustomers.map((customer, index) => (
                <div key={customer.customer_uuid} className="flex items-center justify-between bg-white p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-medium">{index + 1}.</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {customer.full_name || 'Nom non renseigné'}
                      </p>
                      <p className="text-xs text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                  {index === 0 && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      Client principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={createStay} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* Client principal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client principal <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.primary_customer_id}
              onChange={(e) => setFormData({ ...formData, primary_customer_id: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm"
              required
            >
              <option value="">Sélectionner le client principal...</option>
              {selectedCustomers.map((customer) => (
                <option key={customer.customer_uuid} value={customer.customer_uuid}>
                  {customer.full_name || customer.email} {customer === selectedCustomers[0] ? '(principal par défaut)' : ''}
                </option>
              ))}
            </select>
            {selectedCustomers.length === 0 && (
              <p className="text-sm text-amber-600 mt-2">
                ⚠️ Aucun client sélectionné. Veuillez d'abord sélectionner des clients dans la page check-in.
              </p>
            )}
          </div>

          {/* Chambre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chambre <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.room_id}
              onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm"
              required
            >
              <option value="">Sélectionner une chambre...</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Chambre {room.room_number} • {room.room_type} • {room.max_occupancy} pers. • {room.base_price}€/nuit
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arrivée <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.check_in_date}
                onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Départ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.check_out_date}
                onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm"
                required
              />
            </div>
          </div>

          {/* Nombre de personnes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adultes
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.adults_count}
                onChange={(e) => setFormData({ ...formData, adults_count: parseInt(e.target.value) })}
                className="w-full rounded-lg border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enfants
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.children_count}
                onChange={(e) => setFormData({ ...formData, children_count: parseInt(e.target.value) })}
                className="w-full rounded-lg border-gray-300 shadow-sm"
              />
            </div>
          </div>

          {/* Montant total */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant total (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm"
              placeholder="Optionnel"
            />
          </div>

          {/* Demandes spéciales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Demandes spéciales
            </label>
            <textarea
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              rows={3}
              className="w-full rounded-lg border-gray-300 shadow-sm"
              placeholder="Allergies, demandes particulières..."
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving || selectedCustomers.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
            >
              {saving ? 'Création...' : 'Créer le séjour'}
            </button>
            <Link
              href="/admin/reception/check-in"
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition text-center"
            >
              ← Retour
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}