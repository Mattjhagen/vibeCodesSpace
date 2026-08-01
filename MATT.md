# vibeCodes — where it stands, and what needs you

Written for you, not for an agent. Engineering detail is in [`AGENTS.md`](./AGENTS.md);
decisions and their reasoning are in `docs/ADR-00*.md`.

Last updated: 2026-08-01, after all eight steps were completed and pushed.

---

## The one thing to understand first

All eight steps are **written, tested and pushed**. Almost none of it is
**running**. Those are different, and the gap is entirely made of things only
you can do:

| | state |
|---|---|
| Code | ✅ 17 commits on `main`, builds clean, security model tested |
| Deployed | ⚠️ Vercel is running **pre-step-2 code** — none of the new work |
| Database | ❌ **Zero** of the 6 migrations applied |
| Domain | ❌ `vibecodes.space` redirects to itself forever |

Nothing below is a code problem. It is a deploy, DNS and decision problem.

---

## 🔴 Do these first — the product does not work until they are done

### 1. Fix `vibecodes.space` — it 301-loops

Your domain does not serve anything. It redirects to itself, five hops deep:

```
$ curl -sI https://vibecodes.space
HTTP/2 301
location: https://vibecodes.space/     ← the same URL
server: cloudflare
via: 1.1 fly.io                        ← but the app is on VERCEL
```

**The app is fine.** `https://vibe-codes-space.vercel.app` returns 200 and
serves the builder, login and pricing. Only the domain is misconfigured — it
points through Cloudflare at fly.io instead of Vercel.

**Fix:** point `vibecodes.space` and `www` at Vercel, and remove whatever
fly.io redirect rule is catching it.

This is also urgent because relayapp.pro and purepulse.one now both carry a
"Start building" button pointing here. Until you fix it, those buttons lead
into the loop.

### 2. Apply the six migrations

```
supabase/migrations/20260318000000_init.sql              (already applied)
supabase/migrations/20260801000000_site_media_storage.sql
supabase/migrations/20260801010000_generation_usage.sql
supabase/migrations/20260801020000_publishing.sql
supabase/migrations/20260801030000_custom_domains.sql
supabase/migrations/20260801040000_site_admin.sql
```

Apply in filename order. Until then the editor, publishing, custom domains and
the whole admin reference tables that do not exist.

All six have been executed against a real Postgres (PGlite 18.3) — they apply
cleanly, 14 tables, every one with RLS enabled and at least one policy, 53
security checks passing. Reproduce any time with `npm run verify:migrations`.

**Still apply to staging first.** That harness is Postgres, not Supabase:
`auth.uid()` is a faithful reimplementation rather than the real GoTrue, and
storage is a stub.

### 3. Redeploy after the migrations land

Vercel is serving code from before step 2. Everything from steps 2–8 is on
`main` and has never been deployed. Do this *after* the migrations, not before,
or the new code will query tables that are not there.

### 4. Set four environment variables

| variable | why |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Domain verification records its result with this. Without it the feature throws a clear error rather than silently failing. **Server-side only.** |
| `VERCEL_TOKEN` | Attaching a connected domain to the project is what issues its TLS certificate. |
| `CUSTOM_DOMAIN_CNAME_TARGET` | Set to `cname.vercel-dns.com` — see below. |
| `CUSTOM_DOMAIN_A_RECORDS` | Set to `76.76.21.21`. |

On those last two: the current defaults tell customers to CNAME at
`cname.vibecodes.space`, which has **no dedicated DNS record** — it only
resolves through the `*.vibecodes.space` Cloudflare wildcard. A random label
resolves identically, which is how I know:

```
dig +short cname.vibecodes.space               → 104.21.23.91, 172.67.210.36
dig +short random-9c8f2z-probe.vibecodes.space → 104.21.23.91, 172.67.210.36
```

Meanwhile the apex instruction sends people to `76.76.21.21`, which is Vercel.
So apex and subdomain customers currently go to different infrastructure.
Since hosting is confirmed Vercel, the Vercel values are the right ones.

---

## 🔴 Not your codebase — but you should tell whoever owns SchmidtAdmin

**Their admin gate can be bypassed with one line.** Found while extracting
patterns for the vibeCodes admin. This is read from the repo, **not tested
against their live deployment.**

`src/middleware.ts` gates the admin on `request.cookies.has('schmidt_admin')`,
and `src/lib/auth.ts` sets that cookie client-side with
`document.cookie = 'schmidt_admin=1'`. Not signed, not HttpOnly, not verified.
Typing that in devtools passes the gate.

On its own that only gets you the UI shell — Supabase RLS still keys on the
real JWT. But these policies are also live:

```
projects, proposals, proposal_versions,
proposal_line_items, negotiation_events    FOR SELECT USING (true)
proposals                                  FOR UPDATE USING (true)
                                               WITH CHECK (true)
audit_logs                                 FOR INSERT WITH CHECK (true)
```

So client and pricing data is readable with no session at all, proposals are
writable by anyone (a policy **cannot** restrict columns — the name
`public_update_status` is not what it enforces), and the audit log accepts
forged entries. It is a live client system. Details in
`docs/ADR-003-admin-permissions.md`.

---

## 🟠 Decisions only you can make

### 5. Pick one registrar

Two paths to buy a domain currently exist:

- **Vercel Domains** — wired, takes real money through the Stripe webhook, has
  the refund path.
- **Dynadot** — client written, never run, not even in sandbox.

Two registrars means two renewal pipelines and two places a customer's domain
can silently lapse. Fine today; urgent the moment a second customer buys one.

### 6. Sign off — or reject — ADR-002

The code assumes **the customer owns the domain they paid for**. That
obligates you to: a DPA with the registrar; a retention policy for registrant
PII that survives a deletion request ICANN won't let you fully honour; chasing
the ICANN verification email (unverified **suspends the domain in 15 days** and
they'll blame you, not ICANN); and renewal notices, because a failed auto-renew
silently kills a live customer site.

These are legal commitments. Yours to accept, not mine.

### 7. Submit `vibecodes.space` to the Public Suffix List

Draft is at `docs/public-suffix-list-submission.md`. Without it, one tenant can
set a cookie on `.vibecodes.space` affecting the app and every other tenant.
**Review takes months**, so submitting late is the expensive option.

### 8. Your pricing page over-claims

`/pricing` sells **Custom domain support** and **Analytics** under Pro, and
**Team collaboration** under Business, with no qualifier. None of them work —
they're built but unmigrated. The marketing sections I wrote on relayapp.pro
mark the same items "Soon"; your own pricing page does not. Worth reconciling
before someone pays $12/mo for analytics.

---

## 🟡 Before you let strangers sign up

### 9. Confirm the wildcard certificate

`*.vibecodes.space` is a **paid tier** feature on Vercel and Netlify. Confirm
your plan covers it and what it costs. Note it does **not** cover
`a.b.vibecodes.space` — the code already refuses multi-level hosts for exactly
this reason.

### 10. Abuse contact, and a human who reads it

The report endpoint and table exist. A phishing page on any subdomain can get
the `vibecodes.space` apex blocklisted by Google Safe Browsing, killing **every**
customer site and your email deliverability at once. Reports have no SELECT
policy — they're read with the service role, so someone has to go look.

### 11. Dynadot sandbox key — only if you pick Dynadot

Control panel → Tools → API. Set `DYNADOT_API_KEY` and leave `DYNADOT_ENV`
unset; the client defaults to sandbox and only reaches production when
`DYNADOT_ENV` is exactly `production`, so a typo can't spend money.

---

## 🟢 Housekeeping

### 12. `git rm -r --cached node_modules`

`.gitignore` has `/node_modules` but 1,310 files under it are already tracked,
and the tree is incomplete. This is why every build has to run from a clean
copy into a scratch directory.

### 13. `git rm --cached .env`

Tracked, and in history. **Nothing leaked** — every commit was scanned and the
values are placeholders (27 chars vs ~107 for a real Stripe key). Still should
come out before anyone runs it with live keys.

### 14. Run `eslint` as its own CI step

`next build` passes while lint fails, because Next 16 no longer runs ESLint
during build. 9 errors are currently invisible to CI.

---

## What was built, step by step

| # | Step | Commit |
|---|---|---|
| 1 | Recon + the tenancy decision (ADR-001) | `1346705`, `c43fa04` |
| — | Refund the customer when a paid domain fails | `cbf0b5d` |
| 2 | Content model: site → pages → sections → blocks | `24e7c73` |
| 3 | Block-based visual editor, undo/redo | `fa8ef80` |
| 4 | Generation moved to claude-opus-5, schema-validated | `b7ab71f` |
| 5 | Publishing on per-tenant subdomains + abuse controls | `a11f73a` |
| 6 | Custom domains, Dynadot client, ADR-002 | `998177f`, `a2da710` |
| — | Migrations run against real Postgres, RLS proven | `1602ea0` |
| 7 | Universal admin: roles, invites, forms, traffic, audit | `7b46135`, `30b547a`, `17ecb01` |
| 8 | Marketing sections on relayapp.pro + purepulse.one | `34e542b`, `1a6d6e3` |

## Two known gaps in what shipped

- **Nothing in a published site posts to the form inbox yet.** The inbox and
  its API endpoint work and are tested, but the `contact` block renders a
  `mailto:` link. A proper `form` block needs adding to the content model,
  editor and renderer.
- **Invitation emails are not sent.** No email provider is configured, so the
  invite flow gives you a link to copy. The UI says so rather than pretending.

## Where the marketing sections live

- `~/Relay` → relayapp.pro — full vibeCodes section, pushed
- `~/PurePulse` → purepulse.one — "Rather build it yourself?", pushed

Both were built with zero new colours and zero new fonts; PurePulse needed zero
new CSS at all. Both link to `vibecodes.space`, so item 1 is what makes them
useful rather than misleading.
