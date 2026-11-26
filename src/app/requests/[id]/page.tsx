import React from 'react'
import { createClient } from '@/lib/supabase/server-client'
import { getCurrentHotelServer } from '@/lib/hotel-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import RequestActions from './RequestActions'
import { Icon } from '@/components/ui/Icons'

const categoryIconMap: Record<string, (props: { className?: string }) => React.ReactNode> = {
  maintenance:  Icon.Wrench,
  room_service: Icon.Utensils,
  housekeeping: Icon.SparklesCleaning,
  concierge:    Icon.Concierge,
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  pending:     { label: 'En attente', bg: '#FFF5F3', color: '#E05947' },
  in_progress: { label: 'En cours',   bg: '#F5EFED', color: '#746865' },
  completed:   { label: 'Terminée',   bg: '#F0FDF4', color: '#16a34a' },
  cancelled:   { label: 'Annulée',    bg: '#F5F5F5', color: '#9CA3AF' },
}

const priorityConfig: Record<string, { label: string; bg: string; color: string }> = {
  urgent: { label: 'Urgente',  bg: '#FEF2F2', color: '#DC2626' },
  high:   { label: 'Haute',    bg: '#FFF5F3', color: '#E05947' },
  normal: { label: 'Normale',  bg: '#F5EFED', color: '#746865' },
  low:    { label: 'Basse',    bg: '#F9FAFB', color: '#9CA3AF' },
}

export default async function RequestDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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
  if (!customer) return redirect('/')

  const { data: request, error } = await supabase
    .from('customer_requests')
    .select(`
      *,
      request_type:request_types(id, category, name, icon, estimated_time),
      stay:stays(id, booking_reference, room:rooms(room_number)),
      messages:request_messages(id, sender_type, sender_name, message, is_internal, created_at)
    `)
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .eq('customer_id', customer.customer_uuid)
    .single()

  if (error || !request) notFound()

  const st = statusConfig[request.status] || { label: request.status, bg: '#F5EFED', color: '#746865' }
  const pr = priorityConfig[request.priority] || { label: request.priority, bg: '#F5EFED', color: '#746865' }
  const CategoryIcon = categoryIconMap[request.request_type.category] || Icon.ClipboardList

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: '#FFFAF8' }}>
      <div className="max-w-4xl mx-auto">

        {/* Fil d'Ariane */}
        <Link
          href="/requests"
          className="inline-flex items-center gap-1 text-sm mb-6 transition hover:opacity-70"
          style={{ color: '#746865' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Mes demandes
        </Link>

        {/* En-tête de la demande */}
        <div className="bg-white rounded-xl p-6 mb-5" style={{ border: '1px solid #E8DEDA' }}>
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F5EFED' }}>
                <CategoryIcon className="w-5 h-5 text-[#746865]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold leading-tight" style={{ color: '#1C1211' }}>
                  {request.title}
                </h1>
                <p className="text-xs mt-0.5" style={{ color: '#746865' }}>
                  {request.request_type.name} · Réf. #{request.id}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>
                {st.label}
              </span>
              {request.priority !== 'normal' && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: pr.bg, color: pr.color }}>
                  {pr.label}
                </span>
              )}
            </div>
          </div>

          {/* Chambre */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-4 text-sm" style={{ backgroundColor: '#F5EFED' }}>
            <Icon.Key className="w-3.5 h-3.5 flex-shrink-0 text-[#746865]" />
            <span className="font-medium" style={{ color: '#1C1211' }}>
              Chambre {request.stay.room?.room_number || '—'}
            </span>
            <span style={{ color: '#E8DEDA' }}>·</span>
            <span className="text-xs" style={{ color: '#746865' }}>{request.stay.booking_reference}</span>
          </div>

          {/* Description */}
          {request.description && (
            <div className="mb-4">
              <p className="text-xs font-medium mb-1.5" style={{ color: '#746865' }}>Description</p>
              <p className="text-sm leading-relaxed px-3 py-3 rounded-lg" style={{ color: '#1C1211', backgroundColor: '#FFFAF8', border: '1px solid #E8DEDA' }}>
                {request.description}
              </p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm pt-4" style={{ borderTop: '1px solid #F5EFED' }}>
            <div>
              <p className="text-xs mb-0.5" style={{ color: '#746865' }}>Demandée le</p>
              <p className="font-medium text-sm" style={{ color: '#1C1211' }}>
                {new Date(request.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
            {request.scheduled_time && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#746865' }}>Planifiée</p>
                <p className="font-medium text-sm" style={{ color: '#1C1211' }}>
                  {new Date(request.scheduled_time).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
            {request.completed_time && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#746865' }}>Traitée</p>
                <p className="font-medium text-sm" style={{ color: '#16a34a' }}>
                  {new Date(request.completed_time).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Suivi / Messages */}
        <div className="bg-white rounded-xl p-6 mb-5" style={{ border: '1px solid #E8DEDA' }}>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#1C1211' }}>
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#E05947' }} />
            Suivi de la demande
          </h2>

          {request.messages && request.messages.length > 0 ? (
            <div className="space-y-3">
              {request.messages.map((message: any) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${message.sender_type === 'customer' ? 'ml-6' : 'mr-6'}`}
                  style={{
                    backgroundColor: message.sender_type === 'customer' ? '#FFF5F3' : '#F5EFED',
                    border: `1px solid ${message.sender_type === 'customer' ? '#E8DEDA' : '#E8DEDA'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold" style={{ color: '#1C1211' }}>
                      {message.sender_name || (message.sender_type === 'customer' ? 'Vous' : 'Service hôtel')}
                    </span>
                    <span className="text-xs" style={{ color: '#746865' }}>
                      {new Date(message.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#1C1211' }}>{message.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm py-8" style={{ color: '#746865' }}>
              Aucun message pour le moment
            </p>
          )}
        </div>

        {/* Actions client */}
        <RequestActions
          requestId={request.id}
          status={request.status}
          customerName={customer.full_name || 'Client'}
          customerUuid={customer.customer_uuid}
          existingRating={request.rating}
          existingFeedback={request.feedback}
        />

      </div>
    </div>
  )
}
