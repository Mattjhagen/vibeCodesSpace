# TODO — things only you can do

Everything here is blocked on access, money, or a decision I shouldn't make for
you. Ordered by what unblocks the most.

Code status lives in `~/AGENTS.md` (session log) and `docs/ADR-00*.md`.
Last updated: 2026-08-01, after step 6.

---

## 🔴 Blocking — the product does not work for a customer until these are done

### 1. Apply the five migrations to Supabase

Nothing built in steps 2–6 exists in the live database. Five migrations are
written and unapplied:

```
supabase/migrations/20260318000000_init.sql              (already applied)
supabase/migrations/20260801000000_site_media_storage.sql
supabase/migrations/20260801010000_generation_usage.sql
supabase/migrations/20260801020000_publishing.sql
supabase/migrations/20260801030000_custom_domains.sql
```

Apply them in filename order. Until then the editor, publishing, and custom
domains all reference tables that aren't there.

**Update (2026-08-01):** these have now been executed against a real Postgres
(PGlite 0.5.4 / PostgreSQL 18.3) and **all five apply cleanly** — 9 tables, all
with RLS enabled and at least one policy, 18/18 function and RLS checks passing.
Reproduce with:

```
npm run verify:migrations
npm run verify:rls
```

So you should not hit syntax errors. **Still apply to a staging project first**:
PGlite is Postgres, not Supabase — `auth.uid()` is a faithful reimplementation
over a session variable rather than GoTrue, and `storage.objects` is a stub with
the right shape.

### 2. Decide what customers point their domains at

This one is a real defect, not a config gap. The two DNS instructions we hand
out go to **different infrastructure**:

| customer has | we tell them | that resolves to |
|---|---|---|
| `www.example.com` | CNAME → `cname.vibecodes.space` | 104.21.23.91, 172.67.210.36 (**Cloudflare**) |
| `example.com` (apex) | A → `76.76.21.21` | (**Vercel**) |

And `cname.vibecodes.space` has no dedicated record — it only resolves through
the `*.vibecodes.space` Cloudflare wildcard. A random label resolves
identically, which is how I know:

```
dig +short cname.vibecodes.space               -> 104.21.23.91, 172.67.210.36
dig +short random-9c8f2z-probe.vibecodes.space -> 104.21.23.91, 172.67.210.36
```

A CNAME into a Cloudflare zone that has never heard of `example.com` returns
error 1014/1016 instead of serving the site.

**What to do:** if the app is served from Vercel, set

```
CUSTOM_DOMAIN_CNAME_TARGET=cname.vercel-dns.com
CUSTOM_DOMAIN_A_RECORDS=76.76.21.21
```

If you're fronting with Cloudflare instead, you need **Cloudflare for SaaS**
custom hostnames, and the apex value has to change to match. I left the
defaults alone rather than guess at your hosting.

### 3. Set `SUPABASE_SERVICE_ROLE_KEY`

Custom domain verification records its result with the service role, because
`ownership_verified_at` authorises certificate issuance and must not be
writable by the customer. Without the key the code throws a clear error rather
than silently falling back — by design, but it means the feature is off.

Supabase dashboard → Project Settings → API → `service_role` key.
**Server-side only. Never in a client bundle.**

### 4. Set `VERCEL_TOKEN` (and `VERCEL_PROJECT_ID`)

Attaching a connected domain to the hosting project is what issues its TLS
certificate. Without this, a customer can pass both DNS checks and still get no
HTTPS.

---

## 🟠 Decisions I need from you

### 5. Pick one registrar

You currently have two paths to buy a domain:

- **Vercel Domains API** — already wired, already takes real money via the
  Stripe webhook, has the refund path from `cbf0b5d`.
- **Dynadot** — client written in `998177f`, never run, not even in sandbox.

Two registrars means two renewal pipelines and two places a customer's domain
can silently lapse. You deferred this last session, which was reasonable — it
becomes urgent the moment a second customer buys a domain.

### 6. Sign off (or reject) ADR-002 — customer is the registrant

`docs/ADR-002-domain-registrant.md`. The code is written for "the customer owns
the domain they paid for". That obligates you to:

- a **DPA with the registrar** before the first real registration
- a **retention policy** for registrant PII that survives a deletion request
  ICANN won't let you fully honour
- chasing the **ICANN verification email** — unverified suspends the domain in
  15 days and the customer blames you, not ICANN
- **renewal notices** at 60/30/7 days — a failed auto-renew silently kills a
  live customer site

These are legal commitments, so they're yours to accept, not mine.

### 7. Public Suffix List submission for `vibecodes.space`

Draft is at `docs/public-suffix-list-submission.md`. Without it, one tenant can
set a cookie on `.vibecodes.space` that affects the app and every other tenant.
**Review lead time is months**, so submitting late is the expensive option.

---

## 🟡 Needed before you let strangers sign up

### 8. Dynadot sandbox key (only if you pick Dynadot)

Dynadot control panel → Tools → API. Set `DYNADOT_API_KEY` and leave
`DYNADOT_ENV` unset — the client defaults to sandbox and only reaches
production when `DYNADOT_ENV` is exactly `production`, so a typo can't spend
money. The purchase path is currently untested even in test mode.

### 9. Confirm the wildcard certificate covers `*.vibecodes.space`

On Vercel and Netlify wildcard domains are a **paid tier** feature. Confirm the
plan covers it and what it costs. Note `*.vibecodes.space` does **not** cover
`a.b.vibecodes.space` — the code already refuses multi-level hosts for exactly
this reason.

### 10. Abuse contact + a human who reads it

The abuse report endpoint and table exist. A phishing page on any subdomain can
get the `vibecodes.space` apex blocklisted by Google Safe Browsing, which kills
**every** customer site and your email deliverability at once. Reports are
stored with no SELECT policy — they're read with the service role, so someone
has to actually go look.

---

## 🟢 Housekeeping, low urgency

### 11. `git rm -r --cached node_modules`

`.gitignore` has `/node_modules` but 1,310 files under it are already tracked,
and the tree is incomplete (83 packages, no `next`). This is why every build
has to run from a clean sync into a scratch directory.

### 12. `git rm --cached .env`

It's tracked and in history (`80200d6`, `5e460d4`). **Nothing leaked** — every
commit was scanned and the values are placeholders (27 chars vs ~107 for a real
Stripe key). Still should come out before anyone runs it with live keys.

### 13. Nine commits unpushed

`~/vibeCodesSpace` is 9 ahead of `origin/main` on `main`. Steps 2–6 plus the two
ADR commits. Pushing is your call.

### 14. Add `eslint` to CI as its own step

`next build` passes while lint fails, because `next.config.ts` is empty and
Next 16 no longer runs ESLint during build. 9 errors are currently invisible to
the build.

---

## Not blocking you — my remaining work

- **Step 7** — universal admin backend. Started; recon only so far.
- **Step 8** — marketing surfaces on relayapp.pro and purepulse.one.
- Fix the 9 pre-existing lint errors (mostly `no-explicit-any` in
  `site-generation.ts`, which step 2's typed schemas should mostly clear).
