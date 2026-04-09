// src/app/suggestions/[id]/page.tsx
import { createClient } from '@/lib/supabase/server-client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SuggestionGallery from '@/components/suggestions/SuggestionGallery'
import { Icon } from '@/components/ui/Icons'

export default async function SuggestionDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  // 1. Récupérer les détails de la suggestion
  const { data: suggestion, error } = await supabase
    .from('suggestions')
    .select(`
      *,
      category:categories!category_id(
        id,
        name,
        icon,
        color,
        text_color,
        bg_color
      ),
      images:suggestion_images(
        is_principal,
        image:image_id(
          id,
          url,
          alt_text
        )
      )
    `)
    .eq('id', id)
    .single()

  // 2. Si la suggestion n'existe pas → page 404
  if (error || !suggestion) {
    notFound()
  }

  // 3. Déterminer le type (interne/externe)
  const isInternal = suggestion.location_type === 'internal'
  const TypeIcon = isInternal ? Icon.Hotel : Icon.Map
  const typeLabel = isInternal ? 'Dans l\'hôtel' : 'Aux alentours'
  const typeColor = isInternal ? 'bg-blue-600' : 'bg-amber-600'
  const typeBg = isInternal ? 'bg-blue-50' : 'bg-amber-50'
  const typeText = isInternal ? 'text-blue-700' : 'text-amber-700'

  // 4. Style de la catégorie
  const categoryStyle = suggestion.category || {
    icon: null,
    name: 'Découverte',
    color: 'from-purple-500 to-purple-600',
    bg_color: 'bg-purple-50',
    text_color: 'text-purple-700'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Fil d'Ariane */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              Accueil
            </Link>
            <span className="text-gray-400">›</span>
            <Link href="/suggestions" className="text-gray-500 hover:text-gray-700">
              Découvertes
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">
              {suggestion.title}
            </span>
          </div>
        </div>
      </div>

      {/* En-tête avec image */}
      <div className="relative h-[40vh] min-h-[400px] bg-gray-900">
        {/* Image de fond */}
        {suggestion.images && suggestion.images.length > 0 ? (
          <>
            <img
              src={suggestion.images.find((img: any) => img.is_principal)?.image.url ||
                   suggestion.images[0].image.url}
              alt={suggestion.title}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </>
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${categoryStyle.color}`}>
            {categoryStyle.icon
              ? <span className="text-8xl text-white/30">{categoryStyle.icon}</span>
              : <Icon.Compass className="w-24 h-24 text-white/20" />}
          </div>
        )}

        {/* Informations principales */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 text-white/80 text-sm mb-2">
              {/* Badge type (interne/externe) */}
              <span className={`${typeBg} ${typeText} px-3 py-1 rounded-full flex items-center gap-1`}>
                <TypeIcon className="w-3 h-3" />
                {typeLabel}
              </span>
              
              {/* Badge catégorie */}
              <span className={`${categoryStyle.bg_color} ${categoryStyle.text_color} px-3 py-1 rounded-full flex items-center gap-1`}>
                {categoryStyle.icon
                  ? <span>{categoryStyle.icon}</span>
                  : <Icon.Compass className="w-3 h-3" />}
                {categoryStyle.name}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {suggestion.title}
            </h1>
            
            <p className="text-xl text-white/90 max-w-3xl">
              {suggestion.description || 'Découvrez cette expérience unique proposée par notre équipe.'}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne principale : Galerie et description */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Galerie photos */}
            {suggestion.images && suggestion.images.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Galerie photos
                </h2>
                <SuggestionGallery images={suggestion.images} />
              </section>
            )}

            {/* Description détaillée */}
            <section className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                À propos
              </h2>
              <div className="prose max-w-none text-gray-600">
                <p className="text-lg leading-relaxed">
                  {suggestion.description || 'Aucune description disponible pour le moment.'}
                </p>

                {/* Informations complémentaires */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {suggestion.is_hotel_internal !== undefined && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Localisation</p>
                      <p className="font-medium text-gray-800 flex items-center gap-1">
                        <TypeIcon className="w-4 h-4" />
                        {suggestion.is_hotel_internal ? 'Dans l\'hôtel' : 'Aux alentours'}
                      </p>
                    </div>
                  )}
                  {suggestion.category && (
                    <div className={`${categoryStyle.bg_color} p-4 rounded-lg`}>
                      <p className={`text-sm ${categoryStyle.text_color} mb-1`}>Catégorie</p>
                      <p className={`font-medium ${categoryStyle.text_color} flex items-center gap-1`}>
                        {categoryStyle.icon && <span>{categoryStyle.icon}</span>}
                        {categoryStyle.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Carte (si adresse externe) */}
            {!isInternal && suggestion.address && (
              <section className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Icon.Map className="w-6 h-6 text-gray-500" />
                  Localisation
                </h2>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                  {/* Ici vous pourrez intégrer une vraie carte Google Maps plus tard */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <div className="text-center">
                      <Icon.Pin className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">{suggestion.address}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Carte interactive bientôt disponible
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Colonne latérale : Informations pratiques */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Carte d'informations */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Icon.Bell className="w-5 h-5 text-gray-400" />
                Informations
              </h2>
              
              <div className="space-y-4">
                {/* Type (interne/externe) */}
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 ${typeBg} rounded-lg flex items-center justify-center ${typeText} flex-shrink-0`}>
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium text-gray-800">{typeLabel}</p>
                  </div>
                </div>

                {/* Catégorie */}
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 ${categoryStyle.bg_color} rounded-lg flex items-center justify-center ${categoryStyle.text_color} flex-shrink-0`}>
                    {categoryStyle.icon
                      ? <span>{categoryStyle.icon}</span>
                      : <Icon.Compass className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Catégorie</p>
                    <p className="font-medium text-gray-800">{categoryStyle.name}</p>
                  </div>
                </div>

                {/* Adresse (si disponible) */}
                {suggestion.address && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                      <Icon.Pin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Adresse</p>
                      <p className="font-medium text-gray-800">{suggestion.address}</p>
                    </div>
                  </div>
                )}

                {/* Téléphone (si disponible) */}
                {suggestion.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0">
                      <Icon.Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <a 
                        href={`tel:${suggestion.phone}`}
                        className="font-medium text-gray-800 hover:text-blue-600 transition"
                      >
                        {suggestion.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Distance (pour les suggestions externes) */}
                {!isInternal && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0">
                      <Icon.Map className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Distance</p>
                      <p className="font-medium text-gray-800">15 minutes en voiture</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                {suggestion.phone && (
                  <a
                    href={`tel:${suggestion.phone}`}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Icon.Phone className="w-4 h-4" />
                    Appeler
                  </a>
                )}

                {!isInternal && (
                  <button className="w-full bg-white border border-gray-200 hover:border-amber-300 text-gray-700 hover:text-amber-600 px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2">
                    <Icon.Pin className="w-4 h-4" />
                    Obtenir l'itinéraire
                  </button>
                )}

                {isInternal && (
                  <button className="w-full bg-white border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2">
                    <Icon.Bell className="w-4 h-4" />
                    Contacter la réception
                  </button>
                )}
              </div>

              {/* Note pour les services internes */}
              {isInternal && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                  <div className="flex items-start gap-2">
                    <Icon.Bell className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      Ce service est disponible directement à l'hôtel. 
                      Rendez-vous à la réception ou composez le poste 122.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section "À découvrir aussi" */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Vous aimerez aussi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ces suggestions seront dynamiques plus tard */}
            <Link
              href="/suggestions"
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-100"
            >
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-100 transition">
                <Icon.Compass className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Spa "L'Oasis"</h3>
              <p className="text-sm text-gray-600">Détente et bien-être au cœur de l'hôtel</p>
            </Link>
            <Link
              href="/suggestions"
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-100"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition">
                <Icon.Activity className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Location de Jet-Ski</h3>
              <p className="text-sm text-gray-600">Sensations fortes sur la Méditerranée</p>
            </Link>
            <Link
              href="/suggestions"
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-100"
            >
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-100 transition">
                <Icon.Utensils className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Dégustation de vins</h3>
              <p className="text-sm text-gray-600">Découvrez les crus de la région</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}