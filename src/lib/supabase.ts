import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabaseKey
    ? "Supabase is not configured for this deployment. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your hosting provider's environment variables, then rebuild and redeploy."
    : null;

export const supabase = createClient(
  supabaseUrl || "https://missing-config.invalid",
  supabaseKey || "missing-config"
);