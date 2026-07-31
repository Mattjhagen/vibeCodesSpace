# ADR-001 — One tenancy, owned by vibeCodes

Status: **decided**, pending the hosting move (see §6).
Date: 2026-07-31. Recon only; no code was changed to produce this.

Repos read at: vibeCodesSpace `1e9463c` (2026-03-25), SchmidtAdmin `cd464dc`
(2026-07-30).

---

## 0. Corrections to the brief

Four things differ from the summary I was given. None are fatal, but two
change what later steps have to build.

| Brief said | Actually |
|---|---|
| Next.js 15 | **16.2.0** (`package.json`) |
| README defers "real AI SDK integration" | Site *generation* is **wired and live** — `src/lib/openai.ts` calls `openai.chat.completions.create({ model: 'gpt-4o' })`. Only *resume import* is mocked (`import-flow.tsx:18 // Mock the extraction pipeline`). The README is precise; the summary of it was not. |
| README defers "visual layout editor" | Correct, still deferred. |
| — | The installed SDK is **`openai ^6.32.0`**. There is **no `@anthropic-ai/sdk`**. Step 4 is a provider *migration*, not a first integration. |
| — | Custom domains are **already wired to the Vercel Domains API**, not Dynadot — including a live purchase flow. Step 6 needs to reckon with an existing registrar path. |

---

## 1. The existing content model

**Structured, but shallow.** Not template string substitution — but not the
model Step 2 needs either.

```ts
// src/lib/site-generation.ts
interface SiteSection { id: string; type: 'hero'|'about'|'experience'|'skills'|'contact'; content: any }
interface SiteContent { sections: SiteSection[] }
```

Stored as a single opaque `content JSONB` column on `sites`. Rendered by a
five-case switch in `src/components/site-engine/sections.tsx`.

Four properties matter for Step 2:

1. **Single-page.** There is no `pages` concept anywhere — no navigation, no
   routing, no per-page metadata. `sections[]` is the whole site.
2. **`content: any`.** No typed block schemas. Nothing validates what the
   model returns; the renderer reads whatever keys it hopes are present.
3. **Five hardcoded types**, all resume/portfolio. Adding a site type today
   means editing the union, the switch, and the renderer.
4. **Sections, not blocks.** There is no nesting level below a section.

So Step 2's "site → pages → sections → blocks with typed schemas" is a real
redesign, but a tractable one: the JSONB column can hold the new shape, and
the migration is data-only.

## 2. Does it publish? No.

This is the single biggest gap, and it is invisible from the UI.

"Publish" does exactly one thing:

```ts
// src/app/builder/[siteId]/builder-editor.tsx:17
await supabase.from('sites').update({ status: 'published' }).eq('id', siteId)
toast.success('Site published successfully!')
```

There is **no public route that serves a site**. `find src/app -name '*[*'`
returns only `builder/[siteId]`. `sites.subdomain` and `sites.custom_domain`
columns exist and **nothing reads them**.

Middleware **does** exist, at `src/proxy.ts` — Next 16 renamed
`middleware.ts` to `proxy.ts`, which is why a first pass looking for the old
name missed it, and why `next build` reports `ƒ Proxy (Middleware)`. It is 19
lines and does exactly one thing:

```ts
export async function proxy(request: NextRequest) {
  return await updateSession(request)   // Supabase session refresh
}
```

No host inspection, no subdomain parsing, no rewrite. So the conclusion is
unchanged — there is no subdomain routing — but Step 5 extends this existing
file rather than creating one, and must not clobber the session refresh.

A user can build a site, click Publish, be told it succeeded, and there is no
URL at which it exists. Step 5 is not "improve publishing" — it is building
publishing.

Compounding this: the `sites` RLS SELECT policy is
`workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())`.
There is **no public-read path**, so even once a serving route exists, an
anonymous visitor cannot read a published site. Step 5 needs a policy like
`status = 'published'` for anon, scoped carefully.

## 3. Auth, roles, RLS

Supabase auth on `auth.users`. Four tables, **RLS enabled on all four** —
better than average. Policies:

| table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `workspaces` | ✅ | ✅ | ✅ | ❌ |
| `subscriptions` | ✅ | ❌ | ❌ | ❌ |
| `sites` | ✅ | ✅ | ✅ | ✅ |
| `profiles` | ✅ | ✅ | ✅ | ❌ |

RLS default-denies, so the gaps are closed rather than open — a workspace can
never be deleted by its owner, and `subscriptions` is service-role-only
(correct for a Stripe webhook, worth stating deliberately rather than by
omission).

**There are no roles.** No `role` column, no admin/member distinction, no
`auth.jwt()` claims checks. One user owns one workspace. Step 7's
role/permission model does not exist here and must come from SchmidtAdmin.

## 4. Stripe

Real, and mostly correct. `mode: 'subscription'`, hosted checkout, price IDs
from env (`STRIPE_PRICE_PRO` / `STRIPE_PRICE_BUSINESS`), webhook signature
verified with `constructEvent`. No card data touched. Good.

Two defects:

**4a. The webhook handles only `checkout.session.completed`.** There is no
`customer.subscription.updated` or `.deleted`. A cancelled, downgraded, or
payment-failed subscription is never reflected — the row stays `pro`
indefinitely. Revenue leaks and entitlement is wrong.

**4b. Stripe-succeeds/registrar-fails charges the customer and delivers
nothing.** In `src/app/api/webhooks/stripe/route.ts`, the domain purchase
path calls Vercel `/v5/domains/buy`; on failure it does this and nothing else:

```ts
if (!buyRes.ok) {
  console.error("Vercel Domain Buy Error:", await buyRes.text());
}
```

The payment has already succeeded. There is no refund, no retry, no alert,
and the customer's `sites` row is never created — they are charged for a
domain they do not get, and the only trace is a server log. This is the exact
failure Step 6 flags, already shipped. **It should be fixed before Step 6
adds a second registrar**, independently of the Dynadot decision.

## 5. What is stubbed vs working

**Working:** Supabase auth (login, forgot/update password), onboarding,
workspace/site CRUD under RLS, AI site generation via gpt-4o, Stripe
subscription checkout + webhook signature verification, Vercel domain
availability/price lookup, shadcn/ui component layer.

**Stubbed or absent:** resume/LinkedIn import (`// Mock the extraction
pipeline`), the visual layout editor, any public serving of a published site,
subdomain routing, roles/permissions, subscription lifecycle handling, refund
handling on failed domain purchase.

**README's own deferred list** (`README.md:33`): AI SDKs for resume
extraction, Stripe webhook local testing, form-based layout editor + visual
canvas, Vercel Domains API mapping.

## 5b. SchmidtAdmin — what is worth taking

12 migrations, 10 development-journal days, 3 transactional email templates
(`confirm_signup`, `invite`, `magic_link`), audit logging, and a far richer
domain schema (quote requests, time clock with breaks, customer portal, IT
ticketing, clients/projects).

**Take:** migration structure and cadence, the email templates, audit-logging
pattern, CRUD scaffolding, dashboard layout.

**Do not take, and specifically do not copy as a pattern:**

- `portal_admins` is protected by
  `CREATE POLICY "anyone_read_portal_admins" ... FOR SELECT USING (true)` —
  **the admin list is world-readable**. That is a policy to learn *from*, not
  to copy. Step 7 says extract RLS patterns; this one is a counter-example.
- `site_content` is `key text primary key, value text` — flat key/value string
  substitution, read by walls2.com through the anon key. It is *less*
  structured than vibeCodes' model and must not be the basis for Step 2.
- All Schmidt Construction branding, copy, seed data and domain entities.

---

## 6. Decision

> **The Shaggoth chat widget becomes a feature of a vibeCodes account.
> vibeCodes owns identity, billing, tenancy and the admin console. Shaggoth
> is demoted to a retrieval *service* behind that, not a product with its own
> tenancy.**

### Why

**One identity and one billing surface already exist, and they are the hard
part.** vibeCodes has Supabase auth with RLS actually enabled, and Stripe
hosted checkout that works. Shaggoth has a JSON-file registry on a
residential box. Building auth and billing again on the Shaggoth side would
be duplicating the two things vibeCodes already got right.

**The widget's registry cannot host paying customers where it lives.** It is
on a residential connection, single point of failure, plausibly against ISP
terms. Ownership verification stops it being an open crawl proxy; it does not
make it a place to keep customer records or take money.

**Two tenancies means permanent reconciliation.** Two user tables, two
notions of "site", two billing states, two admin consoles, and a mapping
between them that will drift. The collision is real now: `sites.subdomain`
and `sites.custom_domain` in Supabase describe the same real-world thing as
Shaggoth's `site.json` domain + verification state.

### What that means concretely

1. **Supabase is the source of truth** for tenants, sites, domains,
   verification state and entitlement. Shaggoth's `data/sites/*/site.json`
   becomes a local cache keyed by an id vibeCodes issues — never the
   authority.
2. **Shaggoth keeps only what it is actually good at**: per-site corpus,
   BM25 retrieval, the gated crawler, per-site personality. It is a backend
   the widget talks to, addressed by a vibeCodes-issued site id.
3. **The code flows the other way for verification.** Shaggoth's ownership
   verification is genuinely better than anything in vibeCodes today — DNS
   TXT *and* `/.well-known` file, with distinct failure reasons (nxdomain vs
   no_record vs wrong_value vs not_found vs timeout) rather than a generic
   failure. Step 6 needs exactly this machinery for custom domains. **Port
   that design into vibeCodes rather than reinventing it**, and let
   Shaggoth's copy become a client of it.
4. **Shaggoth must move off the r510 before any of this is customer-facing.**
   This decision does not resolve hosting — it narrows it. Only the retrieval
   service needs to move, not an auth/billing stack, which makes the move
   considerably smaller than it looked.

### What this decision does *not* claim

vibeCodes is the right home for tenancy because of auth and billing, **not
because it is more finished overall**. Its publishing story is fictional
(§2), its RLS has no public-read path, and its webhook drops subscription
lifecycle events (§4a). Shaggoth's verification and crawl gating are more
rigorous than anything on the vibeCodes side. "Fold into vibeCodes" means
*adopt its identity and billing*, not *assume its code is further along*.

### Sequencing consequence

Step 5 (publishing) is larger than the brief implies — it is building
publishing from nothing, plus an anon RLS path. Step 4 is a provider
migration off a live gpt-4o integration, not a greenfield one. And two
defects in §4 involve real money and should be fixed before more is stacked
on them.

---

## 7. Not done

Zero code changes, as specified. I did not fix the refund bug, the webhook's
missing subscription events, the world-readable `portal_admins` policy, or
the tracked `.env` (§8) — all are named here for a later step rather than
silently patched during recon.

## 7b. Build and check status (run against a clean install)

`node_modules` in the repo is **partial and tracked**, so checks were run
against a clean `git archive` + `npm install` in a scratch directory.

| check | result |
|---|---|
| `npm install` | 649 packages, clean |
| `npx tsc --noEmit` | **exit 0** — typecheck clean |
| `npx next build` | **exit 0** — 17 routes, builds and prerenders fine |
| `npx eslint .` | **exit 1 — 27 errors, 6 warnings** |

Lint is the only failing gate. Almost all of it is
`@typescript-eslint/no-explicit-any`, concentrated in exactly the files §1
identifies as the weak point — `site-generation.ts`, `sections.tsx`,
`editor-forms.tsx`. The linter is independently flagging the untyped content
model. Step 2's typed block schemas should clear most of these as a side
effect rather than needing a separate lint-fixing pass.

Note the build passes *despite* lint failing, because `next.config.ts` is
empty and Next 16 no longer runs ESLint during `next build`. CI should run
`eslint` as its own step or this stays invisible.

## 7c. Repo hygiene: node_modules is committed

`.gitignore` contains `/node_modules`, but **1,310 files under it are already
tracked** — committed before the rule existed, and `.gitignore` does not
untrack retroactively. The committed tree is also incomplete (83 packages, no
`next`), so it cannot build on its own and can shadow a real install.

`git rm -r --cached node_modules` is the fix, in its own commit.

## 8. One housekeeping finding

`.env` is **tracked** in vibeCodesSpace and present in history
(`80200d6`, `5e460d4`). I checked whether a real key ever landed:

```
git rev-list --all | xargs -I{} git grep -hoE "sk_(live|test)_[A-Za-z0-9]{24,}" {}
-> (no matches)
```

The committed values are placeholders (27 chars; real Stripe keys are ~107).
**No credential has leaked.** But a tracked `.env` means the next person to
fill in real values commits them by default. It should be `git rm --cached`d
and gitignored before anyone runs this locally with live keys.
