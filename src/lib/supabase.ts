import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a real client if configured, otherwise a dummy that returns empty results
export const supabase: SupabaseClient = url && key
  ? createClient(url, key)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

export const isSupabaseConfigured = Boolean(url && key);
