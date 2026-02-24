# Stripe Live Payments Setup Guide

## Prerequisites
1. Stripe account (https://stripe.com)
2. Node.js installed on your system
3. Your Stripe API keys

## Step 1: Get Your Stripe Keys

1. Log into your Stripe Dashboard
2. Go to Developers > API Keys
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
4. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

## Step 2: Configure Your Keys

1. Copy `env.template` to `.env`:
   ```bash
   cp env.template .env
   ```

2. Edit `.env` and replace with your **live** keys for production:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   PORT=3001
   NODE_ENV=production
   ```

3. The frontend (`script.js`) already uses the live publishable key; the backend (e.g. Render) must have the same live keys in its environment so `/api/create-payment-intent` and `/api/config` use live mode.

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Start the Backend Server

```bash
npm start
```

The server will run on http://localhost:3001

## Step 5: Test Payments

1. Open your website in a browser
2. Click on any "Get Started" button
3. Use Stripe test card numbers:
   - **Success**: 4242 4242 4242 4242
   - **Decline**: 4000 0000 0000 0002
   - **Requires Authentication**: 4000 0025 0000 3155

## Test Card Details
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

## Production Deployment

For production:

1. Use live Stripe keys (pk_live_ and sk_live_)
2. Deploy backend to a service like:
   - Heroku
   - Vercel
   - Railway
   - DigitalOcean
3. Update `BACKEND_URL` in script.js to your production URL
4. Set up webhooks in Stripe Dashboard

## Webhook Setup (recommended for production)

Webhooks let your backend react to payment success even if the user closes the browser before the redirect.

1. **Stripe Dashboard** → [Developers → Webhooks](https://dashboard.stripe.com/webhooks) → **Add endpoint**.
2. **Endpoint URL:** `https://packie-designs.onrender.com/api/webhook` (your Render backend + `/api/webhook`).
3. **Events to send:** Click “Select events” and add:
   - `payment_intent.succeeded`
   - `payment_method.attached`
4. **Add endpoint** → Stripe shows a **Signing secret** (starts with `whsec_`). Copy it.
5. **Render** → Your service → **Environment** → add:
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...` (the signing secret you copied)
6. **Save** and redeploy the service so the new env var is loaded.

## Troubleshooting

- **"Error initializing payment"**: Check if backend server is running
- **"Invalid API key"**: Verify your Stripe keys are correct
- **CORS errors**: Make sure backend URL matches your frontend domain

## Security Notes

- Never commit your `.env` file to version control
- Use test keys for development
- Use live keys only in production
- Keep your secret keys secure
