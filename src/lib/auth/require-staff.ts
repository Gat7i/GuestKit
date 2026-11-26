import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server-client";

const STAFF_ROLES = ["staff", "hotel_admin", "super_admin"] as const;
const ADMIN_ROLES = ["hotel_admin", "super_admin"] as const;

type Role = (typeof STAFF_ROLES)[number];

/**
 * À appeler en première ligne de chaque server action admin.
 * Valide le JWT avec getUser() (pas getSession) et vérifie le rôle dans la DB.
 * Lance une Error si l'utilisateur n'est pas authentifié ou n'a pas le bon rôle.
 */
export async function requireStaff(): Promise<{ userId: string; role: Role }> {
  // getUser() valide le token JWT côté serveur Supabase (contrairement à getSession()
  // qui se contente de lire le cookie local sans vérification cryptographique).
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Non authentifié");

  // Lecture profil + rôle avec le client admin pour contourner d'éventuels RLS
  // restrictifs sur profiles/roles (ces tables sont internes, pas exposées aux guests).
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profil introuvable");

  const { data: roleRow } = await admin
    .from("roles")
    .select("name")
    .eq("id", profile.role_id)
    .single();

  if (!roleRow || !(STAFF_ROLES as readonly string[]).includes(roleRow.name)) {
    throw new Error("Accès non autorisé");
  }

  return { userId: user.id, role: roleRow.name as Role };
}

/**
 * Variante réservée aux opérations de direction (createHotel, updateHotel…).
 * Exige hotel_admin ou super_admin.
 */
export async function requireHotelAdmin(): Promise<{
  userId: string;
  role: Role;
}> {
  const result = await requireStaff();
  if (!(ADMIN_ROLES as readonly string[]).includes(result.role)) {
    throw new Error("Accès non autorisé — rôle hotel_admin requis");
  }
  return result;
}
