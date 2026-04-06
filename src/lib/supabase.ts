import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// createBrowserClient from @supabase/ssr auto-syncs session with cookies
export const supabase: SupabaseClient = url && key
  ? createBrowserClient(url, key)
  : createBrowserClient('https://placeholder.supabase.co', 'placeholder-key');

export const isSupabaseConfigured = Boolean(url && key);
