"use server";

import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin-client";

export async function createLocation(data: {
  hotel_id: number;
  name: string;
  location_type: string;
  description: string | null;
}) {
  await requireStaff();
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("locations")
    .insert(data)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return row;
}

export async function updateLocation(
  id: number,
  data: {
    name: string;
    location_type: string;
    description: string | null;
  },
) {
  await requireStaff();
  const supabase = createAdminClient();
  const { error } = await supabase.from("locations").update(data).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteLocation(id: number) {
  await requireStaff();
  const supabase = createAdminClient();
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
