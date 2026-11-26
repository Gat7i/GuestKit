import React from 'react'
import { createClient } from '@/lib/supabase/server-client'
import { getCurrentHotelServer } from '@/lib/hotel-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RequestStayButton from '@/components/requests/RequestStayButton'
import { Icon } from '@/components/ui/Icons'

type CategoryComp = (props: { className?: string }) => React.ReactNode

const categoryConfig: Record<string, { title: string; Comp: CategoryComp; color: string }> = {
  maintenance:  { title: 'Maintenance',  Comp: Icon.Wrench,           color: '#E05947' },
  room_service: { title: 'Room Service', Comp: Icon.Utensils,         color: '#C49A5A' },
  housekeeping: { title: 'Housekeeping', Comp: Icon.SparklesCleaning, color: '#746865' },
  concierge:    { title: 'Conciergerie', Comp: Icon.Concierge,        color: '#E05947' },
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  pending:     { label: 'En attente', bg: '#FFF5F3', color: '#E05947' },
  in_progress: { label: 'En cours',   bg: '#F5EFED', color: '#746865' },
  completed:   { label: 'Terminée',   bg: '#F0FDF4', color: '#16a34a' },
}

export default async function RequestsPage() {
  const supabase = await createClient()
  const hotel = await getCurrentHotelServer()

  if (!hotel) return redirect('/')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: customer } = await supabase
    .from('customers')
    .select('customer_uuid, full_name')
    .eq('user_id', user.id)
    .single()

  let activeStay = null
  let pendingStay = null

  if (customer) {
    const { data: active } = await supabase
      .from('stays')
      .select('id, status')
      .eq('primary_customer_id', customer.customer_uuid)
      .eq('status', 'active')
      .maybeSingle()
    activeStay = active

    const { data: pending } = await supabase
      .from('stays')
      .select('id, status, created_at')
      .eq('primary_customer_id', customer.customer_uuid)
      .eq('status', 'upcoming')
      .order('created_at', { ascending: false })
      .maybeSingle()
    pendingStay = pending
  }

  const showStayRequest = !customer || (!activeStay && !pendingStay)

  let activeRequests: any[] = []
  if (activeStay) {
    const { data } = await supabase
      .from('customer_requests')
      .select('id, title, status, priority, created_at, request_type:request_types(name, category)')
      .eq('stay_id', activeStay.id)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(10)
    activeRequests = data || []
  }

  let requestTypes: any[] = []
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

  const categories = requestTypes.reduce((acc: any, type: any) => {
    if (!acc[type.category]) acc[type.category] = { name: type.category, items: [] }
    acc[type.category].items.push(type)
    return acc
  }, {})

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFAF8' }}>

      {/* En-tête éditorial */}
      <div style={{ backgroundColor: '#1C1211' }}>
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <p className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: '#C49A5A' }}>
            {hotel.name}
          </p>
          <h1
            className="text-4xl md:text-5xl font-light mb-3 leading-tight"
            style={{ fontFamily: "'Cormorant', Georgia, serif", color: '#FFFAF8' }}
          >
            Mes demandes
          </h1>
          <p className="text-sm" style={{ color: '#746865' }}>
            {activeStay
              ? 'Sélectionnez le service dont vous avez besoin'
              : 'Commencez par enregistrer votre séjour'}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">

        {/* Aucun séjour */}
        {showStayRequest && (
          <div className="rounded-xl p-10 text-center" style={{ backgroundColor: '#FFF5F3', border: '1px solid #E8DEDA' }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: '#F5EFED' }}>
              <Icon.Hotel className="w-8 h-8 text-[#746865]" />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#1C1211' }}>
              Aucun séjour actif
            </h2>
            <p className="text-sm mb-7 max-w-md mx-auto" style={{ color: '#746865' }}>
              Pour accéder aux services de l'hôtel, vous devez d'abord enregistrer votre séjour à la réception.
            </p>
            <RequestStayButton
              hotelId={hotel.id}
              userId={user.id}
              customerExists={!!customer}
              customerUuid={customer?.customer_uuid}
              hasPendingStay={!!pendingStay}
            />
          </div>
        )}

        {/* Séjour en attente */}
        {pendingStay && !activeStay && (
          <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#F5EFED', border: '1px solid #E8DEDA' }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#E8DEDA' }}>
              <Icon.Clock className="w-6 h-6 text-[#746865]" />
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#1C1211' }}>
              Séjour en attente de confirmation
            </h2>
            <p className="text-sm mb-4 max-w-md mx-auto" style={{ color: '#746865' }}>
              Votre séjour n'est pas encore confirmé par la réception. Les services de l'hôtel seront accessibles une fois votre arrivée enregistrée.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: '#E8DEDA', color: '#746865' }}>
              <Icon.Clock className="w-3 h-3" />
              Envoyée le {new Date(pendingStay.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}

        {/* Demandes en cours */}
        {activeStay && activeRequests.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#E05947' }} />
              <h2 className="text-lg font-semibold" style={{ color: '#1C1211' }}>Demandes en cours</h2>
            </div>
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E8DEDA' }}>
              {activeRequests.map((req: any, i: number) => {
                const st = statusConfig[req.status] || { label: req.status, bg: '#F5EFED', color: '#746865' }
                const cfg = categoryConfig[req.request_type?.category]
                const ReqIcon = cfg?.Comp || Icon.ClipboardList
                return (
                  <Link
                    key={req.id}
                    href={`/requests/${req.id}`}
                    className="group flex items-center justify-between px-5 py-4 hover:bg-[#FFFAF8] transition"
                    style={{ borderTop: i > 0 ? '1px solid #F5EFED' : undefined }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F5EFED' }}>
                        <ReqIcon className="w-4 h-4 text-[#746865]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#1C1211' }}>{req.title}</p>
                        <p className="text-xs" style={{ color: '#746865' }}>
                          {new Date(req.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                      <Icon.ChevronRight className="w-4 h-4 text-[#E8DEDA] group-hover:text-[#746865] transition" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Catalogue de services */}
        {activeStay && Object.keys(categories).length > 0 && (
          <div className="space-y-10">
            {Object.entries(categories).map(([key, category]: [string, any]) => {
              const cfg = categoryConfig[key]
              const Comp = cfg?.Comp || Icon.ClipboardList
              const color = cfg?.color || '#746865'
              const title = cfg?.title || key

              return (
                <div key={key}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-1 h-8 rounded-full" style={{ backgroundColor: color }} />
                    <div>
                      <h2 className="text-xl font-semibold" style={{ color: '#1C1211' }}>{title}</h2>
                      <p className="text-xs" style={{ color: '#746865' }}>
                        {category.items.length} service{category.items.length > 1 ? 's' : ''} disponible{category.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {category.items.map((type: any) => (
                      <Link
                        key={type.id}
                        href={`/requests/new?type=${type.id}`}
                        className="group bg-white rounded-xl transition-all duration-200 hover:shadow-md"
                        style={{ border: '1px solid #E8DEDA' }}
                      >
                        <div className="p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F5EFED' }}>
                              <Comp className="w-4 h-4 text-[#746865]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-semibold transition group-hover:text-[#E05947]" style={{ color: '#1C1211' }}>
                                  {type.name}
                                </h3>
                                {type.estimated_time && (
                                  <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: '#746865' }}>
                                    ~{type.estimated_time} min
                                  </span>
                                )}
                              </div>
                              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#746865' }}>
                                {type.description || 'Faire une demande pour ce service'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: '#1C1211' }}>
                            <span>Faire la demande</span>
                            <Icon.ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeStay && Object.keys(categories).length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: '#746865' }}>Aucun service disponible pour le moment</p>
          </div>
        )}

      </div>
    </div>
  )
}
