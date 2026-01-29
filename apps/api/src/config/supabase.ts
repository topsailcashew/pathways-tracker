import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('[Supabase] SUPABASE_URL is not set!');
}
if (!supabaseServiceRoleKey) {
  console.error('[Supabase] SUPABASE_SERVICE_ROLE_KEY is not set!');
}

// Log config status
console.log('[Supabase] Initializing with URL:', supabaseUrl);
console.log('[Supabase] Service role key:', supabaseServiceRoleKey ? 'SET' : 'NOT SET');

// Create Supabase admin client with service role key
// This client bypasses Row Level Security and should only be used server-side
export const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceRoleKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabaseAdmin;
