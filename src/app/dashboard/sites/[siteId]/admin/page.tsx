import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { AdminPanels, type AdminData } from './admin-panels'

/**
 * The per-site admin.
 *
 * Universal by construction: this page knows nothing about what the site is
 * for. It reads the same generic tables for every tenant, and content editing
 * hands off to the block editor, which already operates on the content model.
 *
 * Every query here runs through the user's own session, so RLS decides what
 * comes back. The role is read once for the UI — to hide controls the caller
 * cannot use — but hiding a button is not the enforcement. The database
 * refuses the action regardless, which is what `verify-admin-rls.mjs` proves.
 */

type Props = { params: Promise<{ siteId: string }> }

const RANK = { owner: 0, admin: 1, editor: 2, viewer: 3 } as const
type Role = keyof typeof RANK

export default async function SiteAdminPage({ params }: Props) {
  const { siteId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: site } = await supabase
    .from('sites')
    .select('id, name, status, subdomain, custom_domain, suspended_at')
    .eq('id', siteId)
    .maybeSingle()

  // RLS already restricts this to sites the caller owns or belongs to, so a
  // miss is indistinguishable from "does not exist" — which is the right
  // answer to give either way.
  if (!site) notFound()

  const { data: roleData } = await supabase.rpc('site_role_of', { p_site_id: siteId })
  const role = (roleData as Role | null) ?? 'viewer'

  const [{ data: members }, { data: submissions }, { data: traffic }, { data: audit }, { data: invitations }] =
    await Promise.all([
      supabase.from('site_members').select('user_id, role, created_at').eq('site_id', siteId),
      supabase
        .from('form_submissions')
        .select('id, payload, page_slug, read_at, created_at')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('site_page_views')
        .select('day, path, views')
        .eq('site_id', siteId)
        .order('day', { ascending: false })
        .limit(200),
      // Admin+ only; RLS returns nothing for an editor or viewer, which is why
      // the panel is also hidden below rather than rendering an empty box.
      supabase
        .from('site_audit_log')
        .select('id, actor_id, action, target, created_at')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('site_invitations')
        .select('id, email, role, expires_at, accepted_at')
        .eq('site_id', siteId)
        .is('accepted_at', null),
    ])

  const data: AdminData = {
    site: {
      id: site.id,
      name: site.name,
      status: site.status,
      subdomain: site.subdomain,
      customDomain: site.custom_domain,
      suspended: !!site.suspended_at,
    },
    role,
    members: (members ?? []).map((m) => ({ userId: m.user_id, role: m.role, since: m.created_at })),
    invitations: (invitations ?? []).map((i) => ({
      id: i.id, email: i.email, role: i.role, expiresAt: i.expires_at,
    })),
    submissions: (submissions ?? []).map((s) => ({
      id: s.id,
      payload: (s.payload ?? {}) as Record<string, string>,
      pageSlug: s.page_slug,
      readAt: s.read_at,
      createdAt: s.created_at,
    })),
    traffic: (traffic ?? []).map((t) => ({ day: t.day, path: t.path, views: t.views })),
    audit: (audit ?? []).map((a) => ({
      id: a.id, actorId: a.actor_id, action: a.action, target: a.target, createdAt: a.created_at,
    })),
    canManageMembers: RANK[role] <= RANK.admin,
    canSeeAudit: RANK[role] <= RANK.admin,
    canEdit: RANK[role] <= RANK.editor,
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-2">{site.name}</h1>
        <p className="text-muted-foreground">
          Your role on this site: <span className="font-medium">{role}</span>
        </p>
      </div>
      <AdminPanels data={data} />
    </div>
  )
}
