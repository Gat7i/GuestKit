import { createClient } from "@/lib/supabase/server-client";

export type Hotel = {
  id: number;
  name: string;
  slug: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  check_in_time: string;
  check_out_time: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  legal_name: string | null;
  legal_form: string | null;
  country: string | null;
  registration_number: string | null;
  legal_representative: string | null;
  data_protection_officer: string | null;
  data_protection_email: string | null;
  legal_jurisdiction: string | null;
};

export async function getCurrentHotelServer(): Promise<Hotel | null> {
  const supabase = await createClient();
  const hotelId = parseInt(process.env.NEXT_PUBLIC_HOTEL_ID || "0");

  if (!hotelId) {
    console.error("❌ NEXT_PUBLIC_HOTEL_ID non défini");
    return null;
  }

  const { data, error } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", hotelId)
    .single();

  if (error) {
    console.error("❌ Hôtel non trouvé:", error);
    return null;
  }

  return data;
}
