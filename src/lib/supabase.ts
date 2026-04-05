import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\s+/g, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/\s+/g, "");

  if (!url || !key) {
    throw new Error("Supabase no configurado: faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }

  _supabase = createClient(url, key);
  return _supabase;
}
