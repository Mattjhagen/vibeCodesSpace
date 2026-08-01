# Public Suffix List submission — vibecodes.space

**Status: not submitted. Needs the domain owner to act — see "What I cannot do".**

## Why this matters

Without a PSL entry, `alice.vibecodes.space` can set a cookie scoped to
`.vibecodes.space`. That cookie is then sent to the app at `vibecodes.space`
**and to every other tenant**. Origin isolation (separate localStorage, separate
service-worker scope) is enforced by the browser regardless — but cookies are
scoped by *domain*, not origin, and `Domain=.vibecodes.space` is a legal value
for any subdomain to write.

So the PSL entry closes the one hole subdomain isolation does not:

| Attack | Blocked by subdomains alone? | Needs PSL? |
|---|---|---|
| Read another tenant's `localStorage` | yes | no |
| Read another tenant's `sessionStorage` / IndexedDB | yes | no |
| Register a service worker over another tenant | yes | no |
| Set `Domain=.vibecodes.space` cookie affecting all tenants | **no** | **yes** |
| Session fixation against the logged-in app session | **no** | **yes** |

This has review lead time (weeks to months), which is why it is started now
even though it lands later.

## Interim mitigation, in place today

Until the entry is accepted:

- The app's own session cookies must be `__Host-` prefixed where possible.
  `__Host-` forbids a `Domain` attribute, so a tenant-set `.vibecodes.space`
  cookie cannot shadow them.
- `proxy.ts` does not run `updateSession` on tenant hosts, so no app auth cookie
  is ever written on a tenant origin.
- Tenant pages are served with `X-Frame-Options: DENY` and
  `Referrer-Policy: no-referrer`.

## The submission

Repository: <https://github.com/publicsuffix/list>
Section: **PRIVATE DOMAINS**, alphabetical by organisation.

Entry to add:

```
// vibecodes.space : https://vibecodes.space
// Submitted by <NAME> <abuse@vibecodes.space>
vibecodes.space
```

### Required steps

1. **`_psl` DNS TXT record.** The PSL maintainers require a TXT record at
   `_psl.vibecodes.space` whose value is the URL of the pull request:

   ```
   _psl.vibecodes.space.  TXT  "https://github.com/publicsuffix/list/pull/<PR_NUMBER>"
   ```

   Chicken-and-egg by design: open the PR first, then add the record with the
   PR number, then comment on the PR that it is in place.

2. **Open the PR** from the GitHub account that can be contacted at the
   submitter address. One rule change per PR.

3. **Expect the validation bot** to check the `_psl` record and the entry
   format, then a human review.

### What I cannot do

- Open the PR — `gh auth` is broken on this machine and a PSL submission must
  come from an identifiable owner, not an agent.
- Add the `_psl` TXT record — that is a Cloudflare DNS change on your account.
- Choose the submitter name and contact address.

## Verifying afterwards

Once the entry ships in a browser release, a tenant page attempting
`document.cookie = "x=1; Domain=.vibecodes.space"` is rejected by the browser.
Before then, it silently succeeds — so do not treat the interim mitigations as
optional.
