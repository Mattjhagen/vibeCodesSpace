import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * A Supabase client that bypasses RLS. Server only.
 *
 * Needed because some state must be writable by the application and by nobody
 * else. `custom_domains.ownership_verified_at` is the case that introduced
 * this: it authorises certificate issuance for a hostname, so if the customer
 * could write it — through any RLS policy, however narrow — they could have a
 * certificate issued for a domain they do not own. The migration therefore
 * grants no INSERT/UPDATE/DELETE to `authenticated` at all, and the write
 * happens here, after the server has run the DNS lookups itself.
 *
 * The key name deliberately has no `NEXT_PUBLIC_` prefix, so Next will not
 * inline it into a client bundle: importing this from a client component
 * yields `undefined` and the throw below, rather than a leaked key. Callers
 * should still only be server actions and route handlers.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Fail loudly and specifically. A service client that silently falls back to
  // the anon key would half-work: reads succeed, writes vanish under RLS, and
  // a domain would sit at "checking" forever with nothing in the logs.
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set — custom domain verification cannot record its result',
    )
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
