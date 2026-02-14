import { getCurrentHotelServer } from '@/lib/hotel-server'
import { createClient } from '@/lib/supabase/server-client'
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

// Départements avec leurs icônes et couleurs
const DEPARTMENTS = {
  'Réception': { icon: '🛎️', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-700', gradient: 'from-blue-400 to-blue-600' },
  'Restauration': { icon: '🍽️', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', text: 'text-amber-700', gradient: 'from-amber-400 to-orange-600' },
  'Activités': { icon: '🎭', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-700', gradient: 'from-purple-400 to-purple-600' },
  'Conciergerie': { icon: '💎', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-700', gradient: 'from-emerald-400 to-teal-600' },
  'Sécurité': { icon: '🛡️', color: 'from-red-500 to-red-600', bg: 'bg-red-50', text: 'text-red-700', gradient: 'from-red-400 to-red-600' },
  'Service en chambre': { icon: '🛏️', color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-700', gradient: 'from-indigo-400 to-indigo-600' },
  'Spa & Bien-être': { icon: '🧘', color: 'from-green-500 to-emerald-600', bg: 'bg-green-50', text: 'text-green-700', gradient: 'from-green-400 to-emerald-600' },
  'default': { icon: '📞', color: 'from-gray-500 to-gray-600', bg: 'bg-gray-50', text: 'text-gray-700', gradient: 'from-gray-400 to-gray-600' }
}

export default async function ContactsPage() {
  const hotel = await getCurrentHotelServer()
  const supabase = await createClient()
  
  // 1. Récupérer tous les contacts de l'Hôtel Paradis (hotel_id = 1)
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('hotel_id', hotel?.id)
    .order('department')
    .order('name')

  // 3. Grouper les contacts par département - AVEC TYPAGE CORRIGÉ
  const contactsByDepartment = contacts?.reduce((acc: ContactsByDepartment, contact: ContactType) => {
    const dept = contact.department || 'Autres services'
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(contact)
    return acc
  }, {} as ContactsByDepartment) || {}

  // 4. Contacts d'urgence (en dur pour la démo)
  const emergencyContacts = [
    { name: 'Police', phone: '17', icon: '🚓', bg: 'bg-blue-100', text: 'text-blue-800' },
    { name: 'SAMU', phone: '15', icon: '🚑', bg: 'bg-red-100', text: 'text-red-800' },
    { name: 'Pompiers', phone: '18', icon: '🚒', bg: 'bg-orange-100', text: 'text-orange-800' },
    { name: 'Médecin de garde', phone: '04 93 12 34 56', icon: '👨‍⚕️', bg: 'bg-gray-100', text: 'text-gray-800' }
  ]

  // 5. Gestion des erreurs
  if (error) {
    console.error('Erreur Supabase:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-red-600">Erreur de chargement</h2>
          <p className="text-gray-600 mt-2">Impossible de charger les contacts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête de la page */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">
              📞
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Contacts utiles
              </h1>
              <p className="text-xl text-blue-100">
                {hotel?.name || 'Hôtel Paradis'} • Tous les services à portée de main
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* === SECTION URGENCES === */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              ⚠️
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Urgences 24h/24
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {emergencyContacts.map((contact, index) => (
              <a
                key={index}
                href={`tel:${contact.phone}`}
                className={`${contact.bg} rounded-xl p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className="flex flex-col items-center text-center">
                  <span className="text-3xl mb-2">{contact.icon}</span>
                  <span className={`font-medium ${contact.text}`}>
                    {contact.name}
                  </span>
                  <span className={`text-lg font-bold ${contact.text} mt-1`}>
                    {contact.phone}
                  </span>
                </div>
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Appels gratuits depuis votre chambre
          </p>
        </div>

        {/* === CONTACTS DE L'HÔTEL === */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              🏨
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Services de l'hôtel
            </h2>
          </div>

          {contacts && Object.keys(contactsByDepartment).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(contactsByDepartment).map(([department, deptContacts]) => {
                // CORRECTION : Typer explicitement deptContacts
                const typedDeptContacts = deptContacts as ContactType[]
                const style = DEPARTMENTS[department as keyof typeof DEPARTMENTS] || DEPARTMENTS.default
                
                return (
                  <div
                    key={department}
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition"
                  >
                    {/* En-tête du département */}
                    <div className={`bg-gradient-to-r ${style.gradient} px-4 py-3 text-white`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{style.icon}</span>
                        <h3 className="font-semibold">{department}</h3>
                      </div>
                    </div>

                    {/* Liste des contacts - AVEC TYPAGE CORRIGÉ */}
                    <div className="p-4">
                      {typedDeptContacts.map((contact: ContactType) => (
                        <a
                          key={contact.id}
                          href={`tel:${contact.phone_number}`}
                          className="flex items-center justify-between py-2 hover:bg-gray-50 px-2 rounded-lg transition group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 group-hover:text-blue-500 transition">
                              📞
                            </span>
                            <div>
                              <div className="font-medium text-gray-800">
                                {contact.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {contact.phone_number}
                              </div>
                            </div>
                          </div>
                          <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition">
                            Appeler →
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
              <div className="text-5xl mb-4">📞</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Aucun contact disponible
              </h3>
              <p className="text-gray-600">
                Veuillez contacter la réception au poste 0 pour toute demande.
              </p>
            </div>
          )}
        </div>

        {/* === INFORMATIONS PRATIQUES === */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Adresse et contact principal */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📍</span>
                <h3 className="text-lg font-bold text-gray-800">
                  Adresse de l'hôtel
                </h3>
              </div>
              <p className="text-gray-700 mb-4">
                {hotel?.address || '123 Boulevard de la Mer, 06100 Nice, France'}
              </p>
              <div className="space-y-2">
                <a 
                  href={`tel:${hotel?.phone || '+33493123456'}`}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
                >
                  <span>📞</span>
                  {hotel?.phone || '+33 4 93 12 34 56'}
                </a>
                <a 
                  href={`mailto:${hotel?.email || 'contact@hotel-paradis.fr'}`}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
                >
                  <span>✉️</span>
                  {hotel?.email || 'contact@hotel-paradis.fr'}
                </a>
              </div>
            </div>

            {/* Horaires réception */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🕐</span>
                <h3 className="text-lg font-bold text-gray-800">
                  Horaires d'ouverture
                </h3>
              </div>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span>Réception</span>
                  <span className="font-medium">24h/24 - 7j/7</span>
                </div>
                <div className="flex justify-between">
                  <span>Room Service</span>
                  <span className="font-medium">6h30 - 23h00</span>
                </div>
                <div className="flex justify-between">
                  <span>Spa & Bien-être</span>
                  <span className="font-medium">9h00 - 20h00</span>
                </div>
                <div className="flex justify-between">
                  <span>Piscine</span>
                  <span className="font-medium">8h00 - 22h00</span>
                </div>
              </div>
            </div>

            {/* Check-in / Check-out */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🔑</span>
                <h3 className="text-lg font-bold text-gray-800">
                  Arrivée & Départ
                </h3>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {hotel?.check_in_time?.slice(0,5) || '15:00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {hotel?.check_out_time?.slice(0,5) || '11:00'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Demande de départ tardif possible sous réserve de disponibilité
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton d'appel rapide - Fixe en mobile */}
        <div className="fixed bottom-6 right-6 md:hidden">
          <a
            href="tel:0"
            className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-blue-700 transition"
          >
            📞
          </a>
        </div>
      </div>
    </div>
  )
}