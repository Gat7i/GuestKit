import { createClient } from '@/lib/supabase/server-client'
import { getCurrentHotelServer } from '@/lib/hotel-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RequestStayButton from '@/components/requests/RequestStayButton'

export default async function RequestsPage() {
  const supabase = await createClient()
  const hotel = await getCurrentHotelServer()
  
  if (!hotel) {
    return redirect('/')
  }

  // Récupérer l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return redirect('/login')
  }

  // Récupérer le client
  const { data: customer } = await supabase
    .from('customers')
    .select('customer_uuid, full_name')
    .eq('user_id', user.id)
    .single()

  // Vérifier si le client a un séjour actif
  let activeStay = null
  let pendingStay = null
  
  if (customer) {
    // Chercher un séjour actif
    const { data: active } = await supabase
      .from('stays')
      .select('id, status')
      .eq('primary_customer_id', customer.customer_uuid)
      .eq('status', 'active')
      .maybeSingle()
    
    activeStay = active

    // Chercher un séjour en attente
    const { data: pending } = await supabase
      .from('stays')
      .select('id, status, created_at')
      .eq('primary_customer_id', customer.customer_uuid)
      .eq('status', 'upcoming')
      .order('created_at', { ascending: false })
      .maybeSingle()
    
    pendingStay = pending
  }

  // Si pas de client du tout, on propose la création
  const showStayRequest = !customer || (!activeStay && !pendingStay)

  // Récupérer les demandes actives du client
  let activeRequests: any[] = []
  if (activeStay) {
    const { data } = await supabase
      .from('customer_requests')
      .select(`
        id, title, status, priority, created_at,
        request_type:request_types(name, icon, category)
      `)
      .eq('stay_id', activeStay.id)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(10)

    activeRequests = data || []
  }

  // Récupérer les types de demandes (si le client a un séjour actif)
  let requestTypes = []
  if (activeStay) {
    const { data } = await supabase
      .from('request_types')
      .select('*')
      .eq('hotel_id', hotel.id)
      .eq('is_active', true)
      .order('category')
      .order('sort_order')

    requestTypes = data || []
  }

  // Grouper par catégorie
  const categories = requestTypes?.reduce((acc: any, type: any) => {
    if (!acc[type.category]) {
      acc[type.category] = {
        name: type.category,
        items: []
      }
    }
    acc[type.category].items.push(type)
    return acc
  }, {})

  const categoryLabels: Record<string, { title: string, icon: string, color: string }> = {
    maintenance: { title: 'Maintenance', icon: '🔧', color: 'from-orange-500 to-red-600' },
    room_service: { title: 'Room Service', icon: '🍽️', color: 'from-green-500 to-emerald-600' },
    housekeeping: { title: 'Housekeeping', icon: '🧹', color: 'from-blue-500 to-cyan-600' },
    concierge: { title: 'Conciergerie', icon: '💎', color: 'from-purple-500 to-pink-600' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div 
        className="bg-gradient-to-r text-white"
        style={{ background: `linear-gradient(to right, ${hotel.primary_color}, ${hotel.primary_color}dd)` }}
      >
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">
            Faire une demande
          </h1>
          <p className="text-xl opacity-90">
            {activeStay 
              ? 'Sélectionnez le type de service dont vous avez besoin'
              : 'Commencez par demander un séjour'}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Message si pas de séjour */}
        {showStayRequest && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 mb-8 text-center">
            <div className="text-6xl mb-4">🏨</div>
            <h2 className="text-2xl font-bold text-amber-800 mb-3">
              Vous n'avez pas de séjour actif
            </h2>
            <p className="text-amber-600 mb-6 max-w-2xl mx-auto">
              Pour faire des demandes (room service, ménage, maintenance, etc.), 
              vous devez d'abord avoir un séjour en cours.
            </p>
            
            {/* Bouton pour demander un séjour */}
            <RequestStayButton 
              hotelId={hotel.id} 
              userId={user.id}
              customerExists={!!customer}
              customerUuid={customer?.customer_uuid}
              hasPendingStay={!!pendingStay}
            />
          </div>
        )}

        {/* Message si séjour en attente */}
        {pendingStay && !activeStay && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-8 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-blue-800 mb-3">
              Demande de séjour en attente
            </h2>
            <p className="text-blue-600 mb-4 max-w-2xl mx-auto">
              Votre demande de séjour a été envoyée. La réception va la traiter sous peu.
              Vous recevrez une notification dès que votre chambre sera assignée.
            </p>
            <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full text-sm text-blue-700">
              <span>Demande envoyée le {new Date(pendingStay.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        )}

        {/* Mes demandes en cours */}
        {activeStay && activeRequests.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Mes demandes en cours</h2>
            <div className="space-y-3">
              {activeRequests.map((req: any) => {
                const statusColors: Record<string, string> = {
                  pending:     'bg-yellow-100 text-yellow-800',
                  in_progress: 'bg-blue-100 text-blue-800',
                  completed:   'bg-green-100 text-green-800',
                }
                const statusLabels: Record<string, string> = {
                  pending:     'En attente',
                  in_progress: 'En cours',
                  completed:   'Terminée',
                }
                return (
                  <Link
                    key={req.id}
                    href={`/requests/${req.id}`}
                    className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{req.request_type?.icon || '📋'}</span>
                      <div>
                        <p className="font-medium text-gray-900">{req.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(req.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[req.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[req.status] || req.status}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Affichage des catégories de demandes (si séjour actif) */}
        {activeStay && Object.keys(categories).length > 0 && (
          Object.entries(categories).map(([key, category]: [string, any]) => {
            const label = categoryLabels[key] || { title: key, icon: '📋', color: 'from-gray-500 to-gray-600' }
            
            return (
              <div key={key} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${label.color} flex items-center justify-center text-white text-2xl shadow-lg`}>
                    {label.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {label.title}
                    </h2>
                    <p className="text-gray-600">
                      {category.items.length} service{category.items.length > 1 ? 's' : ''} disponible{category.items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.items.map((type: any) => (
                    <Link
                      key={type.id}
                      href={`/requests/new?type=${type.id}`}
                      className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${label.color} flex items-center justify-center text-white text-2xl`}>
                            {type.icon || label.icon}
                          </div>
                          {type.estimated_time && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                              ⏱️ {type.estimated_time} min
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition">
                          {type.name}
                        </h3>
                        
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {type.description || 'Faire une demande pour ce service'}
                        </p>

                        <div className="flex items-center text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
                          <span>Faire la demande</span>
                          <span className="text-lg group-hover:translate-x-1 transition">→</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })
        )}

        {/* Message si aucune catégorie (cas improbable) */}
        {activeStay && Object.keys(categories).length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun service disponible pour le moment</p>
          </div>
        )}
      </div>
    </div>
  )
}