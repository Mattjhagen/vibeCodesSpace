<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# vibeCodes — working notes for whoever picks this up next

Human-facing status and the action list live in [`MATT.md`](./MATT.md).
Decisions live in `docs/ADR-00*.md`. This file is the engineering handoff.

Last updated 2026-08-01, after the eight-step plan was completed.

---

## 1. Read this before you believe anything works

There are **three different meanings of "done"** in this repo, and conflating
them is the single easiest way to waste a session:

| layer | state |
|---|---|
| **committed** | Steps 2–8 are all committed and pushed to `origin/main`. |
| **deployed** | The Vercel deployment is **pre-step-2 code**. It predates all of it. |
| **migrated** | **Zero** of the six migrations have been applied to the live database. |

So: the code exists, is typechecked, builds, and its security model is tested —
and **none of it is reachable by a customer.** A feature being in `main` says
nothing about whether it runs.

Two live facts worth re-checking rather than trusting:

- `https://vibecodes.space` **301-loops to itself** (Cloudflare → fly.io) while
  the app is actually served from **Vercel** at `vibe-codes-space.vercel.app`.
- The deployed pricing page sells *custom domains*, *analytics* and *team
  collaboration*. None of those work.

Verify current reality with `curl` before writing anything that depends on it.

## 2. What the product is

A site builder. A user connects a LinkedIn profile or uploads a résumé, an LLM
drafts a full site from it, they edit it in a block editor, and it publishes to
`<name>.vibecodes.space` or a domain they own.

vibeCodes owns identity, billing and tenancy (ADR-001). The Shaggoth chat
widget, which lives on a separate box, is demoted to a retrieval *service*
addressed by a vibeCodes site id — it is **not** the site generator and cannot
be. It is BM25 retrieval plus a Markov chain; it answers from a corpus, it does
not author.

## 3. Architecture

### Tenancy and routing

`src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`) does host-based
routing:

```
alice.vibecodes.space/about  → rewrite → /s/alice/about
example.com/about            → rewrite → /d/example.com/about
vibecodes.space/alice        → 301     → alice.vibecodes.space
```

**Subdomains, never paths.** A path-based scheme would put every tenant *and*
the logged-in app session in one cookie jar, one localStorage, one
service-worker scope. Origin isolation is the whole point and is browser-
enforced; do not "simplify" this.

Proxy does **no database lookups**. Next's own docs say proxy code is
edge-deployable and must not rely on shared modules. An unrecognised host is
rewritten optimistically and `/d/[host]` resolves it — a miss costs one render.

Exactly one path is exempt from the tenant rewrite: `/api/forms/`, so a
customer's contact form can post to its own origin without CORS. **Do not widen
this to `/api`** — that would expose every app route on every customer domain.

### Content model

`src/lib/content-model.ts`: site → pages → sections → blocks, with typed block
schemas. Not template string substitution. Ten block types; `contact` renders a
`mailto:` link, **not a form** (see §7).

### Security model — the part to not get wrong

Supabase RLS is the boundary. Three rules, each learned from a real failure:

1. **State that authorises a capability must not be user-writable.**
   `custom_domains.ownership_verified_at` authorises TLS certificate issuance
   for a hostname. If the customer can write it, they get a certificate for a
   domain they do not own. That table therefore has **no INSERT/UPDATE/DELETE
   policy at all**; RLS default-denies, and the app writes verification results
   with the service role after the *server* has run the DNS lookups.

2. **An audit log nobody can write is the point.** `site_audit_log` has no
   INSERT/UPDATE/DELETE policy either. Entries come from `log_site_action()`,
   which stamps `actor_id` from `auth.uid()` rather than accepting it as an
   argument, so a caller cannot attribute an action to someone else.

3. **Privilege rules that are awkward as row predicates belong in functions.**
   Membership changes go through `SECURITY DEFINER` functions enforcing "you
   cannot grant above your own role" and "you cannot remove someone stronger".

`src/utils/supabase/service.ts` is the RLS-bypassing client. It throws loudly
if `SUPABASE_SERVICE_ROLE_KEY` is missing rather than falling back to anon —
a silent fallback half-works, which is worse.

### Role model

`site_role` enum: `owner` → `admin` → `editor` → `viewer`. **Declaration order
IS privilege order**, so `role <= 'editor'` means "at least editor". Inserting a
new role in the wrong position silently changes every policy. The workspace
owner is `owner` without a membership row, or creating a site would lock you
out of its own admin.

## 4. How to verify anything — this repo has real harnesses, use them

### Builds must run from a clean sync

`node_modules` is **tracked and incomplete** (1,310 files, 83 packages, no
`next`). You cannot build in place. Sync to a scratch dir with a real install:

```bash
S=/tmp/vcbuild            # any scratch dir with a full node_modules
git ls-files -co --exclude-standard | grep -v '^node_modules/' \
  | tar -cf - -T - | tar -xf - -C $S
cd $S && npx tsc --noEmit && npx next build && npx eslint .
```

`eslint` is **9 errors, all pre-existing** (mostly `no-explicit-any` in
`site-generation.ts`). That is the baseline — compare against it, do not treat
it as failure. `next build` passes while lint fails, because Next 16 no longer
runs ESLint during build.

### The database harness — real Postgres, no server needed

There is no Postgres, Docker or Supabase CLI on the box. PGlite is genuine
PostgreSQL compiled to WASM and runs under plain node:

```bash
npm run verify:migrations   # applies all 6 in order, dumps RLS/policy coverage
npm run verify:rls          # custom-domain functions + isolation
npm run verify:admin-rls    # 35 checks: roles, invitations, submissions, audit
```

`scripts/_supabase-shim.sql` supplies what PGlite lacks: `auth` schema,
`auth.uid()` over a session GUC the way Supabase derives it from the JWT,
`storage` + `foldername()`, and the `anon`/`authenticated`/`service_role` roles.

**The GRANTs in that shim are part of the fixture, not setup noise.** On
Supabase, `anon` and `authenticated` hold table privileges and RLS narrows
them. Omit the grants and every query is refused by GRANT before a policy is
consulted — an isolation test then passes for entirely the wrong reason.

**Limits, state them wherever you quote results:** PGlite is Postgres, not
Supabase. `auth.uid()` is a faithful reimplementation, not GoTrue;
`storage.objects` is a stub with the right shape. This verifies policy logic
and migration syntax. It is not proof Supabase's instance behaves identically.

### Tests must be able to fail

Every RLS suite includes a **negative control**: reintroduce the real mistake,
prove the leak, restore the policy, prove isolation. A test that has only ever
passed may be asserting something that was never possible to violate.

### DNS checks hit live public DNS

Run via `npx tsx --tsconfig tsconfig.verify.json scripts/verify-custom-domain.ts`.
Environment problems are `WARN` and stay **out of the exit code**; code
problems are `FAIL`. A script that fails because nobody created a DNS record
makes the code question look unanswered.

## 5. Postgres and Next gotchas that cost real time

- **`RETURNING` requires a SELECT policy match.** An anonymous form submission
  succeeds but cannot `RETURNING id` — you can post to a contact form without
  reading the inbox. Worse: a forged INSERT *lands* and only errors on the
  `RETURNING`, so a naive test reads "blocked" while the row is in the table.
- **PL/pgSQL `RETURNS TABLE` columns shadow table columns.** Ambiguous
  references are a **runtime** error neither `tsc` nor the build catches. All
  output columns here are prefixed `out_`.
- **Order matters when a function both mutates and logs.**
  `remove_site_member()` originally logged *after* deleting; removing yourself
  is legal, but the log call authorises against your *current* role, so it
  raised `not_authorized` and rolled the removal back.
- **PGlite's `db.query()` rejects multiple statements.** `RESET ROLE; SELECT …`
  must be split — the suites have a `sudo()` helper.
- **A naive `#[0-9a-f]{3,8}` regex flags `&#9723;`** — numeric HTML entities —
  as new colour literals. Exclude a preceding `&` when auditing stylesheets.

## 6. Conventions

- Every table gets an explicit RLS policy. `DROP POLICY IF EXISTS` before every
  `CREATE POLICY` so migrations re-run cleanly.
- `SET search_path = public` on every `SECURITY DEFINER` function. Without it a
  definer function is a privilege-escalation primitive.
- Grep the built client bundle for every server-only secret name before
  claiming it does not ship. `NEXT_PUBLIC_` is the only prefix Next inlines.
- Never delete an untracked file — move it to `~/stash/`. Git already covers
  tracked files; untracked ones are the only ones a delete truly destroys.
- Verify with real command output. Do not claim "done" from reading code.

## 7. Known gaps — real, and not papered over

- **No `form` block.** `form_submissions` and `/api/forms/[siteId]` work and
  are tested, but the `contact` block renders `mailto:`, so nothing in a
  published site posts to the inbox. Adding it touches content model, editor
  and renderer.
- **No transactional email.** Invitations return a link to copy; the UI says so
  rather than implying mail was sent.
- **Two registrar paths.** The Stripe webhook buys through Vercel Domains;
  `src/lib/dynadot.ts` exists and has never run. Two renewal pipelines, two
  ways for a customer's domain to silently lapse. Undecided on purpose.
- **Custom-domain DNS targets are unverified.** `CUSTOM_DOMAIN_CNAME_TARGET`
  defaults to `cname.vibecodes.space`, which resolves only via the
  `*.vibecodes.space` wildcard. Hosting is confirmed Vercel, so
  `cname.vercel-dns.com` is almost certainly correct — it just has not been set.
- **Nothing is migrated.** See §1.

## 8. Where things are

```
src/proxy.ts                          host routing, origin isolation
src/lib/content-model.ts              site → pages → sections → blocks
src/lib/custom-domain.ts              DNS ownership + pointing checks
src/lib/vercel-domains.ts             attach-to-project = cert issuance
src/lib/subdomain.ts                  reserved names, brand blocklist
src/utils/supabase/service.ts         RLS-bypassing client (server only)
src/app/s/[subdomain]/…               tenant site on a subdomain
src/app/d/[host]/…                    tenant site on a customer domain
src/app/dashboard/sites/[id]/admin/   the universal admin
src/app/api/forms/[siteId]/           public form intake (anon client, on purpose)
supabase/migrations/                  6 migrations, none applied
scripts/verify-*.{ts,mjs}             the harnesses described in §4
docs/ADR-001-tenancy.md               vibeCodes owns tenancy; Shaggoth is a service
docs/ADR-002-domain-registrant.md     the customer is the registrant of record
docs/ADR-003-admin-permissions.md     role model; SchmidtAdmin counter-examples
```

## 9. Related repos

- **`~/Relay`** → relayapp.pro (GitHub Pages). Carries a vibeCodes marketing
  section. Also contains `archon-ide/`, which is someone else's work — it
  routinely has uncommitted changes in it, so **stage files explicitly**, never
  `git add -A`.
- **`~/PurePulse`** → purepulse.one (GitHub Pages). Strictly monochrome
  palette; a previous session imported `#7c5cfc` into it by accident. Adding
  markup there should need **zero** new CSS.
- **`~/SchmidtAdmin`** — reference only, and mostly a source of
  counter-examples. See ADR-003. Copy patterns, never content or data.
- **`~/Shaggoth-a1`** — the retrieval service. Separate stack, separate notes.

## 10. Things that are not mine to decide

Registrar choice, the ICANN/DPA obligations in ADR-002, PSL submission,
applying migrations, and any DNS change. These are in `MATT.md` with the
reasoning. Do not quietly pick one.
