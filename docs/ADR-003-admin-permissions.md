# ADR-003 — The universal admin's permission model

Status: **implemented** in `supabase/migrations/20260801040000_site_admin.sql`.
Date: 2026-08-01.

Step 7 said to extract reusable patterns from SchmidtAdmin. This records what
was taken, what was refused and why, and the findings about SchmidtAdmin itself
that came out of reading it closely.

---

## What "universal" means here

Driven by each site's content model rather than by hardcoded tables. A
portfolio, a services business and a docs site get the same admin, because the
admin operates on `sites.content` plus generic tables: a JSONB form-submission
inbox, a daily traffic rollup, a role-scoped audit log, a membership roster.

Adding a new site type requires no admin change. Adding a form field requires
no migration.

## The role model

`site_role` is an enum: `owner` → `admin` → `editor` → `viewer`. **Declaration
order is privilege order**, strongest first, so `role <= 'editor'` reads as "at
least editor" and `has_site_role()` is a one-line function. A role inserted in
the wrong position silently changes every policy, so that ordering is load
bearing and commented as such.

The workspace owner is `owner` **without a membership row**. `site_role_of()`
derives it from workspace ownership. Otherwise creating a site would leave you
locked out of its admin until some other process granted you access to your own
site — a bootstrapping problem that tends to get "solved" with a permissive
policy.

## Why membership changes are functions, not RLS

Two rules are awkward as row predicates and this is the table that decides who
can edit everything else:

- you cannot grant a role above your own
- you cannot remove someone stronger than you

Both live in `set_site_member_role()` and `remove_site_member()`, which are
`SECURITY DEFINER` and do their own checks. `site_members` has a SELECT policy
and **nothing else**, so RLS default-denies direct writes.

## Taken from SchmidtAdmin

- **A `SECURITY DEFINER` helper called from inside policies.**
  `is_portal_admin()` there, `site_role_of()` / `has_site_role()` here. It
  centralises the check, keeps policies readable, and — the part that matters —
  avoids infinite recursion when a table's policy needs to consult that same
  table.
- **`SET search_path = public`** on every definer function. Without it, a
  definer function is a privilege-escalation primitive.
- **`DROP POLICY IF EXISTS` before every `CREATE POLICY`**, so a migration
  re-runs cleanly.

## Refused, with the reasons

Each of these is live in SchmidtAdmin today.

| pattern | why it was refused |
|---|---|
| `portal_admins FOR SELECT USING (true)` | A world-readable list of who the admins are. That is a target list. |
| `projects`, `proposals`, `proposal_versions`, `proposal_line_items`, `negotiation_events` — all `FOR SELECT USING (true)` | World-readable client and pricing data. The comment says the unguessable `share_token` is the secret, but the RLS policy does not mention the token at all — anyone querying the table directly gets everything. |
| `proposals FOR UPDATE USING (true) WITH CHECK (true)` | Named `public_update_status`, but **a policy cannot restrict columns**. It permits any caller to rewrite any column of any proposal — totals included. The name describes an intent the policy does not enforce. |
| `audit_logs FOR INSERT WITH CHECK (true)` | An audit log anyone can write is not an audit log. It fails in exactly the situation it exists for: a dispute about who did what. |

`site_audit_log` therefore has **no INSERT, UPDATE or DELETE policy at all**,
for anyone. Entries are appended by `log_site_action()`, which stamps
`actor_id` from `auth.uid()` rather than accepting it as an argument — so a
caller cannot attribute an action to someone else — and nobody can edit or
erase history afterwards.

## Findings about SchmidtAdmin worth passing on

Recon only; no code there was changed. These come from reading the repository,
**not** from testing the live deployment.

1. **The admin gate is a cookie presence check.** `src/middleware.ts` does
   `request.cookies.has('schmidt_admin')`, and `src/lib/auth.ts` sets that
   cookie client-side with `document.cookie = 'schmidt_admin=1'`. It is not
   signed, not HttpOnly, and not verified. Typing that one line into devtools
   passes the gate. A second cookie, `schmidt_admin_session`, holds a JSON blob
   of the user — also client-written, so client-controlled identity.

2. **What limits the damage, and what does not.** Data access still goes
   through Supabase RLS keyed on `auth.jwt()->>'email'`, so forging the cookie
   does not by itself forge a Supabase session. But the `USING (true)` SELECT
   policies above mean much of the business data is readable regardless of any
   session, and `public_update_status` means proposals are writable regardless.
   The cookie bypass and the permissive policies are individually bad and
   compound each other.

3. This is a **live client system**. Worth a look before the next release.

## Deliberately not built

- **Transactional email.** No provider is configured in vibeCodes. Invitations
  return a link to copy; the UI says so rather than implying mail was sent.
  SchmidtAdmin's three templates (`confirm_signup`, `invite`, `magic_link`) are
  a good structural reference — table-based layout, preheader span, inline
  styles — and none of their branding or copy should come across.
- **A `form` block.** `form_submissions` and `/api/forms/[siteId]` exist and
  are tested, but the `contact` block renders a `mailto:` link, so no published
  site posts to the endpoint yet. Adding the block type touches the content
  model, the editor and the renderer — step 2/3 surface, not step 7.
- **Per-site suspension UI.** The columns and policies exist from step 5;
  nothing in the admin exposes them because suspension is a platform action,
  not a customer one.

## Verification

`npm run verify:admin-rls` — 35 checks against real Postgres, structured
failing-first as the brief requires: reintroduce the permissive policy, show
the leak, restore the real one, show isolation. See
`docs/`-adjacent session notes in `~/AGENTS.md` for the output.

One bug was found this way rather than by reading: `remove_site_member()`
logged **after** deleting, so removing yourself — legal, and how you leave a
site you were invited to — raised `not_authorized` from the audit call and
rolled the removal back. Logging now happens first.
