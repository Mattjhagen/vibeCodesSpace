# VibeCodes Space - SaaS Website Builder

A production-ready Next.js SaaS platform that generates professional portfolios and resume sites using AI, Supabase, and Stripe.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Auth & Database**: Supabase (PostgreSQL, Auth)
- **Payments**: Stripe

## Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env.local` and fill in the values:
```bash
cp .env.example .env.local
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Supabase Setup
Run the initialization migration found in `supabase/migrations/20260318000000_init.sql` in your Supabase project's SQL editor to set up the database schema, custom types, and Row-Level Security policies.

### 4. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:3000` to access the application.

## Deferred TODOs (v1 Scaffolding)
- Integrate actual OpenAI/Anthropic SDKs for resume data extraction in `src/app/import/actions.ts`.
- Connect Stripe Webhooks using the Stripe CLI for local testing.
- Implement the form-based layout editor and visual canvas bridging in `src/app/builder/[siteId]/page.tsx`.
- Connect Custom Domains API (Vercel Domains API mapping).
