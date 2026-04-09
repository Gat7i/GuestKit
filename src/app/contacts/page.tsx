import { getCurrentHotelServer } from '@/lib/hotel-server'
import { createClient } from '@/lib/supabase/server-client'
import { Icon } from '@/components/ui/Icons'

type ContactType = {
  id: number
  hotel_id: number
  name: string
  phone_number: string
  department: string
  created_at: string
}
type ContactsByDepartment = Record<string, ContactType[]>

const DEPT_STYLES: Record<string, { color: string; border: string }> = {
  'Réception':         { color: 'text-blue-600',   border: 'border-blue-100' },
  'Restauration':      { color: 'text-amber-600',  border: 'border-amber-100' },
  'Activités':         { color: 'text-purple-600', border: 'border-purple-100' },
  'Conciergerie':      { color: 'text-emerald-600',border: 'border-emerald-100' },
  'Sécurité':          { color: 'text-red-600',    border: 'border-red-100' },
  'Service en chambre':{ color: 'text-indigo-600', border: 'border-indigo-100' },
  'Spa & Bien-être':   { color: 'text-green-600',  border: 'border-green-100' },
  'default':           { color: 'text-gray-600',   border: 'border-gray-100' },
}

export default async function ContactsPage() {
  const hotel = await getCurrentHotelServer()
  const supabase = await createClient()

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('hotel_id', hotel?.id)
    .order('department')
    .order('name')

  const contactsByDepartment = contacts?.reduce((acc: ContactsByDepartment, contact: ContactType) => {
    const dept = contact.department || 'Autres services'
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(contact)
    return acc
  }, {} as ContactsByDepartment) || {}

  const emergencyContacts = [
    { name: 'Police', phone: '197', Icon: Icon.Police, bg: 'bg-blue-50', color: 'text-blue-700' },
    { name: 'SAMU',   phone: '198', Icon: Icon.Medical, bg: 'bg-red-50',  color: 'text-red-700' },
    { name: 'Pompiers',phone: '198', Icon: Icon.Fire,  bg: 'bg-orange-50',color: 'text-orange-700' },
    { name: 'Médecin', phone: '+216 98 333 555', Icon: Icon.Medical, bg: 'bg-gray-50', color: 'text-gray-700' },
  ]

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600 text-sm">Impossible de charger les contacts</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Icon.Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Contacts utiles</h1>
              <p className="text-gray-400 text-sm mt-1">{hotel?.name} — Tous les services à portée de main</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">

        {/* URGENCES */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Icon.Police className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Urgences 24h/24</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {emergencyContacts.map((c) => (
              <a key={c.name} href={`tel:${c.phone}`}
                className={`${c.bg} rounded-xl p-4 hover:shadow-md transition border border-gray-100`}>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${c.color}`}>
                    <c.Icon className="w-5 h-5" />
                  </div>
                  <span className={`font-semibold text-sm ${c.color}`}>{c.name}</span>
                  <span className={`text-lg font-bold ${c.color}`}>{c.phone}</span>
                </div>
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Appels gratuits depuis votre chambre</p>
        </div>

        {/* CONTACTS HÔTEL */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Icon.Hotel className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Services de l'hôtel</h2>
          </div>

          {Object.keys(contactsByDepartment).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(contactsByDepartment).map(([department, deptContacts]) => {
                const style = DEPT_STYLES[department] || DEPT_STYLES['default']
                return (
                  <div key={department}
                    className={`bg-white rounded-xl border ${style.border} overflow-hidden`}>
                    <div className="px-4 py-3 border-b border-gray-50">
                      <h3 className={`font-semibold text-sm ${style.color}`}>{department}</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {(deptContacts as ContactType[]).map((contact) => (
                        <a key={contact.id} href={`tel:${contact.phone_number}`}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition group">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{contact.name}</p>
                            <p className="text-xs text-gray-500">{contact.phone_number}</p>
                          </div>
                          <Icon.Phone className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition" />
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
              <Icon.Phone className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aucun contact disponible — contactez la réception</p>
            </div>
          )}
        </div>

        {/* INFOS PRATIQUES */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Adresse */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon.Pin className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-800">Adresse</h3>
              </div>
              {hotel?.address && <p className="text-sm text-gray-600 mb-3">{hotel.address}</p>}
              <div className="space-y-1.5">
                {hotel?.phone && (
                  <a href={`tel:${hotel.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition">
                    <Icon.Phone className="w-3.5 h-3.5" /> {hotel.phone}
                  </a>
                )}
                {hotel?.email && (
                  <a href={`mailto:${hotel.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition">
                    <Icon.Mail className="w-3.5 h-3.5" /> {hotel.email}
                  </a>
                )}
                {!hotel?.address && !hotel?.phone && !hotel?.email && (
                  <p className="text-sm text-gray-400">Contactez la réception</p>
                )}
              </div>
            </div>

            {/* Horaires */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon.Clock className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-800">Horaires</h3>
              </div>
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Réception</span>
                  <span className="font-medium text-gray-900">24h/24</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Horaires des autres services disponibles à la réception.
              </p>
            </div>

            {/* Check-in / out */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon.Key className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-800">Arrivée & Départ</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-600">Check-in</span>
                  <span className="font-bold text-blue-600">{hotel?.check_in_time?.slice(0, 5) || '—'}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-600">Check-out</span>
                  <span className="font-bold text-blue-600">{hotel?.check_out_time?.slice(0, 5) || '—'}</span>
                </div>
                <p className="text-xs text-gray-400">Départ tardif possible sur demande</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton appel rapide mobile */}
      {hotel?.phone && (
        <div className="fixed bottom-20 right-5 lg:hidden">
          <a href={`tel:${hotel.phone}`}
            className="bg-blue-600 text-white w-13 h-13 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition">
            <Icon.Phone className="w-5 h-5" />
          </a>
        </div>
      )}
    </div>
  )
}
