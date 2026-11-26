import { Icon } from "@/components/ui/Icons";
import { getCurrentHotelServer } from "@/lib/hotel-server";
import { createClient } from "@/lib/supabase/server-client";

type ContactType = {
  id: number;
  hotel_id: number;
  name: string;
  phone_number: string;
  department: string;
  created_at: string;
};
type ContactsByDepartment = Record<string, ContactType[]>;

export default async function ContactsPage() {
  const hotel = await getCurrentHotelServer();
  const supabase = await createClient();

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("hotel_id", hotel?.id)
    .order("department")
    .order("name");

  const contactsByDepartment =
    contacts?.reduce((acc: ContactsByDepartment, contact: ContactType) => {
      const dept = contact.department || "Autres services";
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(contact);
      return acc;
    }, {} as ContactsByDepartment) || {};

  const emergencyContacts = [
    { name: "Police", phone: "197", Icon: Icon.Police },
    { name: "SAMU", phone: "198", Icon: Icon.Medical },
    { name: "Pompiers", phone: "198", Icon: Icon.Fire },
    { name: "Médecin", phone: "+216 98 333 555", Icon: Icon.Medical },
  ];

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFFAF8" }}
      >
        <p className="text-red-600 text-sm">
          Impossible de charger les contacts
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFAF8" }}>
      {/* En-tête éditorial */}
      <div style={{ backgroundColor: "#1C1211" }}>
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <p
            className="text-xs uppercase tracking-widest font-medium mb-4"
            style={{ color: "#C49A5A" }}
          >
            {hotel?.name}
          </p>
          <h1
            className="text-4xl md:text-5xl font-light mb-3 leading-tight"
            style={{
              fontFamily: "'Cormorant', Georgia, serif",
              color: "#FFFAF8",
            }}
          >
            Contacts &amp; Services
          </h1>
          <p className="text-sm" style={{ color: "#746865" }}>
            Tous les services de l'hôtel à portée de main · Réception ouverte
            24h/24
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">
        {/* URGENCES */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-1 h-8 rounded-full"
              style={{ backgroundColor: "#E05947" }}
            />
            <h2 className="text-xl font-semibold" style={{ color: "#1C1211" }}>
              Urgences 24h/24
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {emergencyContacts.map((c) => (
              <a
                key={c.name}
                href={`tel:${c.phone}`}
                className="group rounded-xl p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
                style={{ backgroundColor: "#1C1211" }}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#2C1F1E" }}
                  >
                    <c.Icon className="w-5 h-5 text-[#C49A5A]" />
                  </div>
                  <span
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: "#746865" }}
                  >
                    {c.name}
                  </span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: "#FFFAF8" }}
                  >
                    {c.phone}
                  </span>
                </div>
              </a>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: "#746865" }}>
            Appels gratuits depuis votre chambre
          </p>
        </div>

        {/* CONTACTS HÔTEL */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-1 h-8 rounded-full"
              style={{ backgroundColor: "#C49A5A" }}
            />
            <h2 className="text-xl font-semibold" style={{ color: "#1C1211" }}>
              Services de l'hôtel
            </h2>
          </div>

          {Object.keys(contactsByDepartment).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(contactsByDepartment).map(
                ([department, deptContacts]) => (
                  <div
                    key={department}
                    className="bg-white rounded-xl overflow-hidden"
                    style={{ border: "1px solid #E8DEDA" }}
                  >
                    <div
                      className="px-4 py-3"
                      style={{
                        borderBottom: "1px solid #F5EFED",
                        backgroundColor: "#FFFAF8",
                      }}
                    >
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: "#1C1211" }}
                      >
                        {department}
                      </h3>
                    </div>
                    <div>
                      {(deptContacts as ContactType[]).map((contact, i) => (
                        <a
                          key={contact.id}
                          href={`tel:${contact.phone_number}`}
                          className="group flex items-center justify-between px-4 py-3 transition hover:bg-[#FFF5F3]"
                          style={{
                            borderTop: i > 0 ? "1px solid #F5EFED" : undefined,
                          }}
                        >
                          <div>
                            <p
                              className="text-sm font-medium"
                              style={{ color: "#1C1211" }}
                            >
                              {contact.name}
                            </p>
                            <p className="text-xs" style={{ color: "#746865" }}>
                              {contact.phone_number}
                            </p>
                          </div>
                          <Icon.Phone className="w-4 h-4 transition text-[#E8DEDA] group-hover:text-[#E05947]" />
                        </a>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div
              className="bg-white rounded-xl p-10 text-center"
              style={{ border: "1px solid #E8DEDA" }}
            >
              <Icon.Phone className="w-8 h-8 mx-auto mb-3 text-[#E8DEDA]" />
              <p className="text-sm" style={{ color: "#746865" }}>
                Aucun contact disponible — contactez la réception
              </p>
            </div>
          )}
        </div>

        {/* INFOS PRATIQUES — bannière sombre */}
        <div className="rounded-2xl overflow-hidden">
          <div
            className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x"
            style={{ backgroundColor: "#1C1211", borderColor: "#2C1F1E" }}
          >
            {/* Adresse */}
            <div className="px-8 py-8">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-1 h-5 rounded-full"
                  style={{ backgroundColor: "#E05947" }}
                />
                <h3
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#C49A5A" }}
                >
                  Adresse
                </h3>
              </div>
              {hotel?.address && (
                <p
                  className="text-sm mb-3 leading-relaxed"
                  style={{ color: "#F5EFED" }}
                >
                  {hotel.address}
                </p>
              )}
              <div className="space-y-2">
                {hotel?.phone && (
                  <a
                    href={`tel:${hotel.phone}`}
                    className="flex items-center gap-2 text-sm transition hover:opacity-80"
                    style={{ color: "#E05947" }}
                  >
                    <Icon.Phone className="w-3.5 h-3.5" /> {hotel.phone}
                  </a>
                )}
                {hotel?.email && (
                  <a
                    href={`mailto:${hotel.email}`}
                    className="flex items-center gap-2 text-sm transition hover:opacity-80"
                    style={{ color: "#E05947" }}
                  >
                    <Icon.Mail className="w-3.5 h-3.5" /> {hotel.email}
                  </a>
                )}
                {!hotel?.address && !hotel?.phone && !hotel?.email && (
                  <p className="text-sm" style={{ color: "#746865" }}>
                    Contactez la réception
                  </p>
                )}
              </div>
            </div>

            {/* Horaires */}
            <div className="px-8 py-8" style={{ borderColor: "#2C1F1E" }}>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-1 h-5 rounded-full"
                  style={{ backgroundColor: "#C49A5A" }}
                />
                <h3
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#C49A5A" }}
                >
                  Horaires
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "#746865" }}>Réception</span>
                  <span className="font-semibold" style={{ color: "#FFFAF8" }}>
                    24h/24
                  </span>
                </div>
              </div>
              <p className="text-xs mt-4" style={{ color: "#746865" }}>
                Horaires des autres services disponibles à la réception.
              </p>
            </div>

            {/* Arrivée & Départ */}
            <div className="px-8 py-8" style={{ borderColor: "#2C1F1E" }}>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-1 h-5 rounded-full"
                  style={{ backgroundColor: "#E05947" }}
                />
                <h3
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#C49A5A" }}
                >
                  Arrivée &amp; Départ
                </h3>
              </div>
              <div className="space-y-3">
                <div
                  className="flex justify-between items-center px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "#2C1F1E" }}
                >
                  <span className="text-sm" style={{ color: "#746865" }}>
                    Check-in
                  </span>
                  <span
                    className="font-bold text-xl"
                    style={{ color: "#E05947" }}
                  >
                    {hotel?.check_in_time?.slice(0, 5) || "—"}
                  </span>
                </div>
                <div
                  className="flex justify-between items-center px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "#2C1F1E" }}
                >
                  <span className="text-sm" style={{ color: "#746865" }}>
                    Check-out
                  </span>
                  <span
                    className="font-bold text-xl"
                    style={{ color: "#E05947" }}
                  >
                    {hotel?.check_out_time?.slice(0, 5) || "—"}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "#746865" }}>
                  Départ tardif possible sur demande
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton appel rapide mobile */}
      {hotel?.phone && (
        <div className="fixed bottom-20 right-5 lg:hidden">
          <a
            href={`tel:${hotel.phone}`}
            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition hover:opacity-90"
            style={{ backgroundColor: "#E05947" }}
          >
            <Icon.Phone className="w-5 h-5 text-white" />
          </a>
        </div>
      )}
    </div>
  );
}
