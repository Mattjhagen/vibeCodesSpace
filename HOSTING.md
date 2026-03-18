# Hosting Setup Checklist

This guide covers how to run the site builder and publish sites to Netlify or Vercel, plus optional domain setup.

## 1. Clone and run

- Clone the repository and install dependencies:
  ```bash
  git clone <repo-url>
  cd <project-dir>
  npm install
  ```
- Start the server: `npm start` (or `npm run dev` for nodemon).
- Confirm the existing website loads (e.g. `http://localhost:3001` or your `PORT`).

## 2. Environment variables

- Copy `env.example` to `.env`.
- Set at least:
  - **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (see `STRIPE_SETUP.md` if needed).
  - **Auth:** `JWT_SECRET` (optional; defaults to a dev value).
  - **Dynadot:** `DYNADOT_API_KEY` for domain checks.
  - **Deploy (optional):** `DEPLOY_TARGET`, `DEPLOY_TOKEN` for one-click deploy from the builder.
    - `DEPLOY_TARGET`: `netlify` or `vercel`.
    - `DEPLOY_TOKEN`: Netlify Personal Access Token or Vercel token.
  - For Netlify: optionally set `NETLIFY_SITE_ID` so deploys go to a specific site.

## 3. Netlify

- Sign up at [netlify.com](https://www.netlify.com).
- Create a site (or link a Git repo) and note the **Site ID** (optional; used when `NETLIFY_SITE_ID` is set).
- Obtain a **Personal Access Token**: User settings → Applications → Personal access tokens.
- Put the token in `.env` as `DEPLOY_TOKEN` or `NETLIFY_AUTH_TOKEN`.
- For CLI-based deploy from the backend, `netlify-cli` is installed as a dev dependency; ensure `npx netlify` can run in the same environment as the server (e.g. same Node version).

## 4. Vercel

- Sign up at [vercel.com](https://vercel.com).
- Create a project or use the CLI. Obtain a **token** from [vercel.com/account/tokens](https://vercel.com/account/tokens).
- Put the token in `.env` as `DEPLOY_TOKEN` or `VERCEL_TOKEN`.
- The backend uses `npx vercel deploy`; the `vercel` package is installed as a dev dependency.

## 5. One-click deploy from the backend

- Set `DEPLOY_TARGET` and `DEPLOY_TOKEN` (and optionally `NETLIFY_SITE_ID`) in `.env`.
- The builder’s “Deploy to host” button calls `POST /api/site/deploy`, which runs the Netlify or Vercel CLI from the server.
- Ensure the environment that runs `server.js` can execute `npx netlify` and/or `npx vercel` (e.g. same directory and Node when using dev dependencies).

## 6. Test workflow

1. Open the builder: `http://localhost:<PORT>/builder.html`.
2. Register or log in (email + password).
3. Design a page in the GrapesJS editor (drag blocks, edit text).
4. Enter a **Site name** and click **Save** (creates the site and shows a preview link).
5. Click **Publish** to confirm the local published URL (e.g. `/published/<userId>/<siteId>/index.html`).
6. (Optional) Click **Deploy to host** to push the same site to Netlify or Vercel; the returned link is the live host URL.
7. (Optional) Use the main site or studio to check and register a test domain (Name.com / Dynadot).

## Choosing a host

- **Rapid static sites:** Netlify (plugin ecosystem, forms, identity) or Vercel (ideal for Next.js and SSR).
- **Balanced control and serverless:** DigitalOcean App Platform (CI/CD, custom domains, HTTPS, free tier).
- **Simple, non-developer experience:** GoDaddy or Squarespace (integrated builders and domains).

This project’s one-click deploy supports **Netlify** and **Vercel** from the builder; other hosts can be used by exporting the built site from `sites/<userId>/<siteId>/` and uploading manually or via their own CLI/API.
