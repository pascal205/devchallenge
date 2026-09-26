import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants. Copiez .env.example en .env et remplissez-le."
  );
}

export const supabase = createClient(url, key);
