'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import Link from 'next/link'

// ============================================
// TYPES
// ============================================
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
  // CHARGEMENT DES DONNÉES
  // ============================================
  useEffect(() => {
    const init = async () => {
      const hotelData = await getCurrentHotelClient()
      setHotel(hotelData)
      if (hotelData) {
        await loadData(hotelData.id)
      }
    }
    init()
  }, [])

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

  // ============================================
  // CRUD CONTACTS
  // ============================================
  async function createContact() {
    try {
      if (!formData.name || !formData.phone_number || !formData.department) {
        alert('Veuillez remplir tous les champs')
        return
      }
      if (!hotel) {
        alert('Hôtel non identifié')
        return
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          hotel_id: hotel.id,
          name: formData.name,
          phone_number: formData.phone_number,
          department: formData.department
        })
        .select()
        .single()

      if (error) throw error

      alert('✅ Contact créé avec succès !')
      setEditing(false)
      resetForm()
      await loadData(hotel.id)
      setSelectedContact(data)
    } catch (error) {
      console.error('Erreur création:', error)
      alert('❌ Erreur lors de la création')
    }
  }

  async function updateContact() {
    if (!selectedContact || !hotel) return

    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          name: formData.name,
          phone_number: formData.phone_number,
          department: formData.department
        })
        .eq('id', selectedContact.id)
        .eq('hotel_id', hotel.id)

      if (error) throw error

      alert('✅ Contact mis à jour')
      setEditing(false)
      await loadData(hotel.id)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      alert('❌ Erreur lors de la mise à jour')
    }
  }

  async function deleteContact(id: number) {
    if (!confirm('Supprimer définitivement ce contact ?')) return
    if (!hotel) return

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('hotel_id', hotel.id)

      if (error) throw error

      alert('✅ Contact supprimé')
      await loadData(hotel.id)
      if (selectedContact?.id === id) {
        setSelectedContact(null)
        resetForm()
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  // ============================================
  // UTILS
  // ============================================
  function resetForm() {
    setFormData({
      name: '',
      phone_number: '',
      department: ''
    })
  }

  function startEdit(contact?: ContactType) {
    if (contact) {
      setFormData({
        name: contact.name || '',
        phone_number: contact.phone_number || '',
        department: contact.department || ''
      })
      setSelectedContact(contact)
    }
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    if (selectedContact) {
      setFormData({
        name: selectedContact.name || '',
        phone_number: selectedContact.phone_number || '',
        department: selectedContact.department || ''
      })
    } else {
      resetForm()
    }
  }

  // Grouper les contacts par département
  const contactsByDepartment = contacts.reduce((acc: ContactsByDepartment, contact: ContactType) => {
    const dept = contact.department || 'Autres'
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(contact)
    return acc
  }, {} as ContactsByDepartment)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">📞</div>
          <p className="text-gray-600">Chargement des contacts...</p>
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
              <span>📞</span> Gestion des contacts
              {hotel && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  - {hotel.name}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              Gérez les numéros utiles et services de l'hôtel
            </p>
          </div>
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
        </div>

        <div className="grid grid-cols-12 gap-6">
          
          {/* ===== COLONNE 1 : LISTE DES CONTACTS PAR DÉPARTEMENT ===== */}
          <div className="col-span-4 bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span>
              Contacts
              <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {contacts.length}
              </span>
            </h2>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {Object.entries(contactsByDepartment).length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">
                  Aucun contact
                </p>
              ) : (
                Object.entries(contactsByDepartment).map(([department, deptContacts]) => {
                  const typedDeptContacts = deptContacts as ContactType[]
                  
                  return (
                    <div key={department}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {department}
                      </h3>
                      <div className="space-y-1">
                        {typedDeptContacts.map((contact: ContactType) => (
                          <button
                            key={contact.id}
                            onClick={() => {
                              setSelectedContact(contact)
                              setFormData({
                                name: contact.name || '',
                                phone_number: contact.phone_number || '',
                                department: contact.department || ''
                              })
                              setEditing(false)
                            }}
                            className={`
                              w-full text-left p-3 rounded-lg transition
                              ${selectedContact?.id === contact.id
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                              }
                            `}
                          >
                            <div className="font-medium text-sm truncate">
                              {contact.name}
                            </div>
                            <div className={`text-xs ${
                              selectedContact?.id === contact.id
                                ? 'text-white/80'
                                : 'text-gray-500'
                            }`}>
                              {contact.phone_number}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ===== COLONNE 2 : DÉTAILS / ÉDITION ===== */}
          <div className="col-span-8 space-y-6">
            {editing ? (
              // ===== FORMULAIRE D'ÉDITION =====
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  {selectedContact ? '✏️ Modifier' : '➕ Nouveau contact'}
                </h2>

                <div className="space-y-4">
                  {/* Nom du contact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom / Service <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border-gray-300 shadow-sm"
                      placeholder="Ex: Réception centrale"
                    />
                  </div>

                  {/* Numéro de téléphone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro de téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full rounded-lg border-gray-300 shadow-sm"
                      placeholder="Ex: 0, 122, +33 4 93 12 34 56"
                    />
                  </div>

                  {/* Département */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Département <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full rounded-lg border-gray-300 shadow-sm"
                    >
                      <option value="">Sélectionner un département...</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={selectedContact ? updateContact : createContact}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
                    >
                      <span>💾</span>
                      {selectedContact ? 'Mettre à jour' : 'Créer'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
                    >
                      <span>✕</span>
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // ===== AFFICHAGE DES DÉTAILS =====
              selectedContact ? (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl text-green-700">
                        📞
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                          {selectedContact.name}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedContact.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(selectedContact)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1"
                      >
                        <span>✏️</span>
                        Modifier
                      </button>
                      <button
                        onClick={() => deleteContact(selectedContact.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1"
                      >
                        <span>🗑️</span>
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg mt-4">
                    <p className="text-xs text-gray-500 mb-2">Numéro de téléphone</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl text-gray-400">📱</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {selectedContact.phone_number}
                      </span>
                      <a
                        href={`tel:${selectedContact.phone_number}`}
                        className="ml-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        Tester l'appel
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="text-7xl mb-4">📞</div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">
                    Aucun contact sélectionné
                  </h3>
                  <p className="text-gray-600">
                    Sélectionnez un contact dans la liste ou créez-en un nouveau.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}