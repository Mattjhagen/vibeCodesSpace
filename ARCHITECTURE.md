# Target Architecture

## Application 
The app runs on Next.js 15 App Router. The marketing site, dashboard, and builder are all server-rendered pages containing Client Components where interactivity is needed (e.g. `OnboardingWizard`, `BuilderEditor`).

## Auth & Data
Supabase handles all authentication and database needs. We use `@supabase/ssr` to securely read cookies on the server, enforcing access control in `src/proxy.ts` (Next.js middleware) and in Server Components.

### Schema
- `users` (managed by Supabase)
- `workspaces` (maps 1:1 to a user for now, handles team scalability later)
- `sites` (belongs to a workspace, contains theme and publish status)
- `subscriptions` (managed via Stripe Webhooks)
- `profiles` (custom onboarding state)

## Site Publishing
When a user clicks "Publish", `sites.status` becomes `published`. To serve these sites:
1. `src/proxy.ts` should intercept requests to `*.vibecodes.space`.
2. Rewrite the request to `/_sites/[subdomain]`.
3. Fetch the site data and render using the selected theme components.

## Resume & LinkedIn Import Pipeline
1. Accept raw PDF/DOCX via Next.js Server Actions.
2. Store raw file temporarily in Supabase Storage.
3. Pass extracted text to LLM parser (e.g., OpenAI Structured Outputs) to normalize into `profile_entities`.
4. Render parsed entities to draft website preview.
