import Link from "next/link";
import { Icon } from "@/components/ui/Icons";
import { getCurrentHotelServer } from "@/lib/hotel-server";
import { createClient } from "@/lib/supabase/server-client";

export default async function SuggestionsPage() {
  const hotel = await getCurrentHotelServer();
  const supabase = await createClient();

  // 1. Récupérer les catégories de l'hôtel
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("hotel_id", hotel?.id)
    .eq("category_type", "suggestion")
    .eq("is_active", true)
    .order("sort_order");

  // 2. Récupérer toutes les suggestions avec leurs catégories ET leurs images
  const { data: suggestions, error } = await supabase
    .from("suggestions")
    .select(`
      *,
      category:categories!category_id(
        id, name, icon, color, bg_color, text_color
      ),
      images:suggestion_images(
        is_principal,
        image:image_id(
          url,
          alt_text
        )
      )
    `)
    .eq("hotel_id", hotel?.id)
    .order("location_type", { ascending: false })
    .order("created_at", { ascending: false });

  // 3. Construire un map des catégories pour un accès facile
  const categoriesMap = new Map();
  categories?.forEach((cat) => {
    categoriesMap.set(cat.name, {
      icon: cat.icon || "✨",
      color: cat.color || "from-purple-500 to-purple-600",
      bg: cat.bg_color || "bg-purple-50",
      text: cat.text_color || "text-purple-700",
    });
  });

  // 4. Séparer interne/externe
  const internalSuggestions =
    suggestions?.filter((s) => s.location_type === "internal") || [];
  const externalSuggestions =
    suggestions?.filter((s) => s.location_type === "external") || [];

  // 5. Grouper par catégorie (dynamique)
  const groupByCategory = (items: any[]) => {
    return items.reduce(
      (acc, item) => {
        const categoryName = item.category?.name || "Autres";
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(item);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  };

  const internalByCategory = groupByCategory(internalSuggestions);
  const externalByCategory = groupByCategory(externalSuggestions);

  // 6. Fonction pour obtenir l'image principale d'une suggestion
  const getMainImage = (suggestion: any) => {
    if (!suggestion.images || suggestion.images.length === 0) {
      return null;
    }
    const mainImage = suggestion.images.find((img: any) => img.is_principal);
    return mainImage || suggestion.images[0];
  };

  // 7. Gestion des erreurs
  if (error) {
    console.error("Erreur Supabase:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-red-600">Erreur de chargement</h2>
          <p className="text-gray-600 mt-2">
            Impossible de charger les suggestions
          </p>
        </div>
      </div>
    );
  }

  // Fonction pour obtenir le style d'une catégorie
  const getCategoryStyle = (categoryName: string) => {
    const style = categoriesMap.get(categoryName);
    return (
      style || {
        icon: "✨",
        color: "from-purple-500 to-purple-600",
        bg: "bg-purple-50",
        text: "text-purple-700",
      }
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFAF8" }}>
      {/* En-tête éditorial */}
      <div style={{ backgroundColor: "#1C1211" }}>
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <p
            className="text-xs uppercase tracking-widest font-medium mb-4"
            style={{ color: "#C49A5A" }}
          >
            Découvertes
          </p>
          <h1
            className="text-4xl md:text-5xl font-light mb-3 leading-tight"
            style={{
              fontFamily: "'Cormorant', Georgia, serif",
              color: "#FFFAF8",
            }}
          >
            Vivez l'expérience
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: "#746865" }}>
            Que vous cherchiez à vous détendre, vivre des sensations fortes ou
            explorer les environs, nous avons sélectionné pour vous les
            meilleures expériences.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Message si aucune suggestion */}
        {(!suggestions || suggestions.length === 0) && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <Icon.Compass className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Aucune suggestion pour le moment
            </h2>
            <p className="text-gray-600 text-lg">
              Notre équipe prépare de belles découvertes pour agrémenter votre
              séjour.
            </p>
          </div>
        )}

        {/* ===== SERVICES INTERNES (HÔTEL) ===== */}
        {internalSuggestions.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div
                className="w-1 h-10 rounded-full"
                style={{ backgroundColor: "#E05947" }}
              />
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "#1C1211" }}>
                  Dans notre hôtel
                </h2>
                <p style={{ color: "#746865" }}>
                  Des services exclusifs pour agrémenter votre séjour
                </p>
              </div>
            </div>

            {/* Affichage par catégorie - DYNAMIQUE */}
            {Object.entries(internalByCategory).map(([categoryName, items]) => {
              const typedItems = items as any[];
              const style = getCategoryStyle(categoryName);

              return (
                <div key={categoryName} className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-1 h-6 rounded-full bg-gradient-to-b ${style.color}`}
                    />
                    <h3 className="text-lg font-semibold text-gray-700">
                      {categoryName}
                    </h3>
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {typedItems.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {typedItems.map((suggestion: any) => {
                      const mainImage = getMainImage(suggestion);

                      return (
                        <div
                          key={suggestion.id}
                          className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                          {/* Image de la suggestion */}
                          <div className="relative h-48 bg-gray-100 overflow-hidden">
                            {mainImage ? (
                              <img
                                src={mainImage.image.url}
                                alt={suggestion.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            ) : (
                              <div
                                className={`w-full h-full bg-gradient-to-br ${style.color} flex items-center justify-center`}
                              >
                                <span className="text-6xl text-white/50">
                                  {style.icon}
                                </span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                            <div className="absolute top-3 right-3">
                              <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm flex items-center gap-1">
                                <Icon.Hotel className="w-3 h-3" /> Sur place
                              </span>
                            </div>
                            <div className="absolute bottom-3 left-3">
                              <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                                {style.icon} {categoryName}
                              </span>
                            </div>
                          </div>

                          {/* Contenu */}
                          <div className="p-5">
                            <h4
                              className="text-lg font-bold mb-2 transition line-clamp-1 group-hover:text-[#E05947]"
                              style={{ color: "#1C1211" }}
                            >
                              {suggestion.title}
                            </h4>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {suggestion.description}
                            </p>

                            <div className="space-y-2 text-sm">
                              {suggestion.address && (
                                <div className="flex items-start gap-2 text-gray-600">
                                  <Icon.Pin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <span className="flex-1 text-xs line-clamp-1">
                                    {suggestion.address}
                                  </span>
                                </div>
                              )}

                              {suggestion.phone && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Icon.Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  <a
                                    href={`tel:${suggestion.phone}`}
                                    className="hover:underline text-xs"
                                    style={{ color: "#1C1211" }}
                                  >
                                    {suggestion.phone}
                                  </a>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                              <span className="text-xs text-gray-500">
                                Service disponible
                              </span>
                              <Link
                                href={`/suggestions/${suggestion.id}`}
                                className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition"
                                style={{ color: "#1C1211" }}
                              >
                                Plus d'infos
                                <Icon.ChevronRight className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== SERVICES EXTERNES (ALENTOURS) ===== */}
        {externalSuggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div
                className="w-1 h-10 rounded-full"
                style={{ backgroundColor: "#C49A5A" }}
              />
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "#1C1211" }}>
                  Aux alentours
                </h2>
                <p style={{ color: "#746865" }}>
                  Explorez les richesses de la région
                </p>
              </div>
            </div>

            {/* Affichage par catégorie - DYNAMIQUE */}
            {Object.entries(externalByCategory).map(([categoryName, items]) => {
              const typedItems = items as any[];
              const style = getCategoryStyle(categoryName);

              return (
                <div key={categoryName} className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-1 h-6 rounded-full bg-gradient-to-b ${style.color}`}
                    />
                    <h3 className="text-lg font-semibold text-gray-700">
                      {categoryName}
                    </h3>
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {typedItems.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {typedItems.map((suggestion: any) => {
                      const mainImage = getMainImage(suggestion);

                      return (
                        <div
                          key={suggestion.id}
                          className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                        >
                          {/* Image de la suggestion */}
                          <div className="relative h-40 bg-gray-100 overflow-hidden">
                            {mainImage ? (
                              <img
                                src={mainImage.image.url}
                                alt={suggestion.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            ) : (
                              <div
                                className={`w-full h-full bg-gradient-to-br ${style.color} bg-opacity-90 flex items-center justify-center`}
                              >
                                <span className="text-5xl text-white/50">
                                  {style.icon}
                                </span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                            {suggestion.distance_minutes && (
                              <div className="absolute top-3 right-3">
                                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm flex items-center gap-1">
                                  <Icon.Clock className="w-3 h-3" />{" "}
                                  {suggestion.distance_minutes} min
                                </span>
                              </div>
                            )}
                            <div className="absolute bottom-3 left-3">
                              <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                                {style.icon} {categoryName}
                              </span>
                            </div>
                          </div>

                          <div className="p-5">
                            <h4
                              className="text-lg font-bold mb-2 transition line-clamp-1 group-hover:text-[#C49A5A]"
                              style={{ color: "#1C1211" }}
                            >
                              {suggestion.title}
                            </h4>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {suggestion.description}
                            </p>

                            <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                              {suggestion.address && (
                                <div className="flex items-start gap-2 text-gray-700">
                                  <Icon.Pin className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                                  <span className="flex-1 text-xs line-clamp-1">
                                    {suggestion.address}
                                  </span>
                                </div>
                              )}

                              {suggestion.phone && (
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Icon.Phone className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                  <a
                                    href={`tel:${suggestion.phone}`}
                                    className="text-amber-600 hover:underline text-xs"
                                  >
                                    {suggestion.phone}
                                  </a>
                                </div>
                              )}
                            </div>

                            <div className="mt-4">
                              <Link
                                href={`/suggestions/${suggestion.id}`}
                                className="w-full px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 hover:opacity-80"
                                style={{
                                  backgroundColor: "#FFF5F3",
                                  color: "#1C1211",
                                  border: "1px solid #E8DEDA",
                                }}
                              >
                                <Icon.ChevronRight className="w-4 h-4" />
                                Voir détails
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Conseil de la conciergerie */}
        <div
          className="mt-16 rounded-2xl p-8"
          style={{ backgroundColor: "#1C1211" }}
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#2C1F1E" }}
            >
              <Icon.Concierge className="w-8 h-8 text-[#C49A5A]" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: "#FFFAF8" }}
              >
                Besoin d'un conseil personnalisé ?
              </h3>
              <p style={{ color: "#746865" }}>
                Notre équipe de conciergerie est à votre disposition pour
                organiser vos sorties, réserver vos activités ou vous
                recommander les meilleures adresses.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              {hotel?.phone ? (
                <a
                  href={`tel:${hotel.phone}`}
                  className="text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 transition hover:opacity-90"
                  style={{ backgroundColor: "#E05947" }}
                >
                  <Icon.Phone className="w-4 h-4" />
                  {hotel.phone}
                </a>
              ) : (
                <div
                  className="text-white px-6 py-3 rounded-full font-medium flex items-center gap-2"
                  style={{ backgroundColor: "#E05947" }}
                >
                  <Icon.Phone className="w-4 h-4" />
                  Réception
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
