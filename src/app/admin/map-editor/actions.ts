"use server";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin-client";

export async function saveMapPointPosition(
  pointId: number,
  x: number,
  y: number,
  hotelId: number,
) {
  await requireStaff();
  const supabase = createAdminClient();
  const { data: point } = await supabase
    .from("map_points")
    .select("plan_id")
    .eq("id", pointId)
    .single();
  if (!point) throw new Error("Point introuvable");
  const { data: plan } = await supabase
    .from("plans")
    .select("hotel_id")
    .eq("id", point.plan_id)
    .single();
  if (plan?.hotel_id !== hotelId) throw new Error("Action non autorisée");
  const { error } = await supabase
    .from("map_points")
    .update({ coordinates_x: x, coordinates_y: y })
    .eq("id", pointId);
  if (error) throw new Error(error.message);
}

export async function addMapPoint(data: {
  hotel_id: number;
  plan_id: number;
  poi_type_id: number;
  name: string;
  coordinates_x: number;
  coordinates_y: number;
  sort_order: number;
}) {
  await requireStaff();
  const supabase = createAdminClient();
  const { data: plan } = await supabase
    .from("plans")
    .select("hotel_id")
    .eq("id", data.plan_id)
    .single();
  if (plan?.hotel_id !== data.hotel_id) throw new Error("Action non autorisée");
  const { data: row, error } = await supabase
    .from("map_points")
    .insert({ ...data, is_active: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return row;
}

export async function deleteMapPoint(pointId: number, hotelId: number) {
  await requireStaff();
  const supabase = createAdminClient();
  const { data: hotelPlans } = await supabase
    .from("plans")
    .select("id")
    .eq("hotel_id", hotelId);
  if (!hotelPlans?.length) throw new Error("Aucun plan pour cet hôtel");
  const planIds = hotelPlans.map((p: any) => p.id);
  const { error } = await supabase
    .from("map_points")
    .delete()
    .eq("id", pointId)
    .in("plan_id", planIds);
  if (error) throw new Error(error.message);
}
