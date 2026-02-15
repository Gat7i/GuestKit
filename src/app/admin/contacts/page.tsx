'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import HotelSelector from '@/components/admin/HotelSelector'
import Link from 'next/link'

// Types
type ContactType = {
  id: number
  hotel_id: number
  name: string
  phone_number: string
  department: string
  created_at: string
}

type ContactsByDepartment = Record<string, ContactType[]>

export default function AdminContactsPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [contacts, setContacts] = useState<ContactType[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactType | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    department: ''
  })

  const supabase = createClient()

  // Départements prédéfinis
  const departments = [
    'Réception',
    'Restauration',
    'Conciergerie',
    'Activités',
    'Sécurité',
    'Service en chambre',
    'Spa & Bien-être',
    'Maintenance',
    'Direction'
  ]

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================
  useEffect(() => {
    const init = async () => {
      try {
        const hotelData = await getCurrentHotelClient()
        setHotel(hotelData)
        
        if (!hotelData) {
          setIsSuperAdmin(true)
          setSelectedHotelId(null)
          setLoading(false)
        } else {
          setIsSuperAdmin(false)
          setSelectedHotelId(hotelData.id)
          await loadData(hotelData.id)
        }
      } catch (error) {
        console.error('Erreur initialisation:', error)
        setLoading(false)
      }
    }
    init()
  }, [])

  // ============================================
  // CHARGEMENT QUAND UN HÔTEL EST SÉLECTIONNÉ
  // ============================================
  useEffect(() => {
    if (selectedHotelId) {
      loadData(selectedHotelId)
    }
  }, [selectedHotelId])

  async function loadData(hotelId: number) {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('department')
        .order('name')

      setContacts(data || [])
      
      if (data?.length && !selectedContact) {
        setSelectedContact(data[0])
        setFormData({
          name: data[0].name || '',
          phone_number: data[0].phone_number || '',
          department: data[0].department || ''
        })
      }
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  // ... (garder les fonctions CRUD en remplaçant hotel.id par selectedHotelId)

  const contactsByDepartment = contacts.reduce((acc: ContactsByDepartment, contact: ContactType) => {
    const dept = contact.department || 'Autres'
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(contact)
    return acc
  }, {} as ContactsByDepartment)

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>📞</span> Gestion des contacts
              {hotel && !isSuperAdmin && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  - {hotel.name}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              {isSuperAdmin 
                ? 'Mode Super Admin : sélectionnez un hôtel pour gérer ses contacts'
                : 'Gérez les numéros utiles et services'}
            </p>
          </div>
          {selectedHotelId && (
            <button
              onClick={() => {
                resetForm()
                setSelectedContact(null)
                setEditing(true)
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2"
            >
              <span>➕</span>
              Nouveau contact
            </button>
          )}
        </div>

        {/* Sélecteur d'hôtel */}
        {isSuperAdmin && (
          <HotelSelector
            onSelect={(hotelId) => setSelectedHotelId(hotelId)}
            selectedId={selectedHotelId}
            className="mb-6"
          />
        )}

        {/* Contenu principal */}
        {selectedHotelId ? (
          <div className="grid grid-cols-12 gap-6">
            {/* ... (garder le contenu existant) */}
          </div>
        ) : (
          isSuperAdmin && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-amber-200">
              <div className="text-7xl mb-4">🏨</div>
              <h3 className="text-xl font-medium text-amber-800 mb-2">
                Aucun hôtel sélectionné
              </h3>
              <p className="text-amber-600">
                Veuillez sélectionner un hôtel pour gérer ses contacts.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}