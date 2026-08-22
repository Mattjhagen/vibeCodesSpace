# ADR-002 — The customer is the registrant of record

Status: **decided, needs your sign-off before any real registration.** The
decision is technical-and-legal; the code below is written for it, but the
obligations it creates are yours to accept, not mine.

Date: 2026-08-01.

---

## Update 2026-08-22 — registrar swapped: Dynadot → Porkbun

The registrar client is now `src/lib/porkbun.ts`, not `src/lib/dynadot.ts`
(kept in the repo for reference, no longer imported anywhere). Same public
interface, so the failure taxonomy in "Money" below and the Stripe webhook's
charge-first/refund-on-failure/verify-on-ambiguity logic are unchanged.

Everything this ADR says about **why the customer must be the registrant** —
PII/DPA, ICANN verification, the 60-day transfer lock, renewal risk — applies
identically to Porkbun. Two things do NOT carry over automatically and need
re-doing against the new vendor:

1. **A DPA with Porkbun**, not Dynadot, is required before the first real
   registration.
2. **The renewal/verification pipeline described below (60/30/7-day notices,
   retry-on-failure, grace/redemption tracking) was never built for Dynadot
   either** — it's still open, now against Porkbun.

**Known gap, unchanged by the swap:** the Stripe webhook does not pass a
registrant contact, so live registrations go to Porkbun's account-default
contact — the reseller model — which is the opposite of what this ADR
decides. `registerDomain()` in `porkbun.ts` accepts a `registrantContact`
argument for exactly this reason, but nothing calls it yet. Wiring it up means
building a form to collect the customer's legal name/address/phone before
checkout, which is its own scoped piece of work (and the DPA above needs to
exist first, since that data starts flowing to Porkbun the moment it's
collected). Until that ships, **this ADR's central decision is not actually
in effect** — flagging that explicitly rather than letting the presence of
`ADR-002.md` imply it's handled.

The Porkbun client is also **unverified against a live key** — see the
warning at the top of `porkbun.ts`. Get a `pk1_sb_` sandbox key from
https://porkbun.com/account/api and run `checkDomain` + a `dryRun:true`
`create` before any of this touches a real customer.

---

---

## Decision

**The customer is the registrant of record, with their own contact data.**
We are the reseller and technical contact, not the owner.

## Why not the alternative

Registering in our own account is materially easier: no registrant PII, no DPA,
no ICANN verification email to chase, one contact record instead of thousands.
It is still the wrong choice.

The customer pays for a domain and does not own it. That is a trust problem
from the first day and a legal one at churn — when they leave, they are asking
us to hand over an asset that is legally ours, and nothing but goodwill obliges
us to. Every dispute in that shape resolves badly in public.

If we ever *do* resell under our own account, ADR requirement: it must be
stated on the purchase screen in the same visual weight as the price — not in
terms of service, not in a tooltip.

## What this obligates us to

### Registrant PII

We collect name, postal address, email and phone, and transmit them to Dynadot
and thence to the registry and (partially) to RDAP/WHOIS.

- **A DPA with Dynadot is required** before the first real registration.
- **A retention policy is required**: registrant data is kept while the domain
  is under management and for the period ICANN requires afterwards, then
  deleted. "Kept forever in the sites table" is not a policy.
- GDPR/CCPA subject-access and deletion requests must be answerable. Deletion
  cannot delete a live registration's contact data — that is an ICANN
  requirement — so the honest answer is "restricted, not erased", and it needs
  to be written down before someone asks.

### ICANN registrant verification

ICANN requires the registrant email be verified. **An unverified registrant
suspends the domain within 15 days** — the site goes dark and the customer
blames us, not ICANN.

- Send the customer a clear heads-up at purchase that a verification email is
  coming and must be actioned.
- Track verification state and chase it. A silent suspension is the worst
  outcome, and it is entirely predictable.

### 60-day transfer lock

ICANN locks a domain against transfer for 60 days after registration **and
after any change of registrant contact**. This must be stated at purchase:
a customer who buys a domain intending to move it to their own registrar next
week cannot, and will treat that as us trapping them.

The second trigger matters more than it looks — a routine "update my email
address" re-arms the lock.

### Renewals

**A failed auto-renew silently kills a live customer site.** Required before
launch:

- Advance notice at 60 / 30 / 7 days.
- Retry on payment failure, with escalating notification.
- Track the grace and redemption periods (~30 days grace, ~30 days redemption
  at a much higher fee) and surface them, rather than letting a domain drop.

### Money

Registrations are effectively non-refundable to us. Therefore:

1. **Charge via Stripe first, register second.** Never the reverse.
2. **Stripe succeeds + Dynadot fails ⇒ automatic refund**, not a retry. A
   retry after an ambiguous failure risks registering and paying twice.
   `src/lib/dynadot.ts` deliberately has no retry, and exposes
   `isRegisteredToUs()` so an ambiguous failure is resolved by asking who owns
   the name rather than by trying again.
3. This is the same failure taxonomy already implemented for the Vercel path in
   commit `cbf0b5d` — buy-fails ⇒ refund, buy-succeeds-but-attach-fails ⇒ log,
   ambiguous ⇒ verify before deciding. Reuse it; do not write a second one.
4. **Re-check price and availability at the moment of purchase.** Never trust
   the quote shown in the UI: both move, and a stale quote means charging the
   wrong amount or charging for a name someone else just took.

---

## Sandbox — available, and untested

Dynadot **does** have a sandbox: `https://api-sandbox.dynadot.com/api3.json`.
It is reachable and responds:

```
$ curl "https://api-sandbox.dynadot.com/api3.json?command=search&domain0=example.com"
{"Response":{"ResponseCode":"-1","Error":"invalid key"}}
```

**No sandbox API key is configured**, so the purchase path has not been run,
even in test. `env.example` already carries a `DYNADOT_API_KEY` placeholder.

Per the task's instruction, no real purchase was attempted and none should be
without an explicit go-ahead.

To exercise it: create a sandbox key in the Dynadot control panel
(Tools → API), set `DYNADOT_API_KEY`, and leave `DYNADOT_ENV` unset — the
client defaults to the sandbox and only reaches production when `DYNADOT_ENV`
is exactly `production`, so a typo cannot spend money.

## One discrepancy worth recording

The published docs describe a `SuccessCode` field. The live JSON endpoint
returns **`ResponseCode`**. The client accepts both, because a client reading
only the documented name treats every real response as malformed. Errors also
arrive as **HTTP 200** with `ResponseCode: "-1"`, so `res.ok` alone would read
"invalid key" as a successful registration.

## Open: two registrar paths

`src/app/api/domains/check/route.ts` and the Stripe webhook already buy domains
through **Vercel's** Domains API. Adding Dynadot makes two. Pick one before
either has customers — two registrars means two renewal pipelines, two transfer
processes, and two places for a domain to silently lapse.
