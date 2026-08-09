import { NextResponse } from 'next/server'
// Default import gives both the constructor and the Stripe.* type namespace,
// so this replaces the previous `require()` + separate `import type` pair.
import Stripe from 'stripe'
import { createClient } from '@/utils/supabase/server'
import { registerDomain, isRegisteredToUs, DynadotError } from '@/lib/dynadot'

/**
 * Domain purchases charge first and register second, so every failure after
 * the charge has to be resolved deliberately. Refunding on *any* error is its
 * own bug: a domain registration is effectively non-refundable to us, so
 * refunding a customer who did get their domain loses the money twice.
 *
 * The cases are not symmetric:
 *
 *   buy fails outright        -> customer paid, owns nothing  -> REFUND
 *   buy ok, project assign fails -> customer owns the domain  -> do NOT refund
 *   buy ok, db insert fails      -> customer owns the domain  -> do NOT refund
 *   network error mid-buy        -> unknown, may own it       -> verify, then decide
 *
 * The ambiguous case is the dangerous one. A thrown fetch does not mean the
 * registration did not happen, so we ask Vercel who owns the domain before
 * deciding, and refuse to auto-refund when the answer is unclear.
 */

type RefundOutcome = 'refunded' | 'refund_failed' | 'no_payment_intent'

/** Refund a completed checkout session. Idempotent across webhook retries. */
async function refundSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  reason: string
): Promise<RefundOutcome> {
  const paymentIntent =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id

  if (!paymentIntent) {
    console.error('[domain] cannot refund, no payment_intent on session', {
      session: session.id,
      reason,
    })
    return 'no_payment_intent'
  }

  try {
    // Stripe retries webhooks. The idempotency key is derived from the session
    // so a replay reuses the original refund instead of issuing a second one.
    await stripe.refunds.create(
      { payment_intent: paymentIntent, reason: 'requested_by_customer' },
      { idempotencyKey: `domain-refund-${session.id}` }
    )
    console.error('[domain] refunded after failed registration', {
      session: session.id,
      paymentIntent,
      reason,
    })
    return 'refunded'
  } catch (err) {
    // The customer is now charged with no domain and no refund. This is the
    // one state that needs a human, so it is logged loudly and distinctly.
    console.error('[domain] REFUND FAILED — MANUAL ACTION REQUIRED', {
      session: session.id,
      paymentIntent,
      reason,
      error: err instanceof Error ? err.message : String(err),
    })
    return 'refund_failed'
  }
}


export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
  })

  const signature = req.headers.get('stripe-signature') as string
  const body = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )

    const supabase = await createClient()

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // If this checkout was for a custom domain purchase:
      if (session.metadata?.domain_purchase === 'true') {
        const domainName = session.metadata.domain_name

        if (!domainName) {
          await refundSession(stripe, session, 'missing domain_name in metadata')
          return NextResponse.json({ received: true })
        }

        // Replay guard. Stripe redelivers on any non-2xx, and a second
        // /domains/buy for a domain we already bought would fail — which
        // without this check would refund a customer who has their domain.
        const { data: existing } = await supabase
          .from('sites')
          .select('id')
          .eq('custom_domain', domainName)
          .maybeSingle()

        if (existing) {
          return NextResponse.json({ received: true, replay: true })
        }

        let bought = false
        try {
          await registerDomain({ domain: domainName, years: 1 })
          bought = true
        } catch (e) {
          if (e instanceof DynadotError) {
            // Unambiguous registrar rejection: the domain was not registered. Refund.
            await refundSession(
              stripe,
              session,
              `dynadot register failed: ${e.message}`
            )
            return NextResponse.json({ received: true, refunded: true })
          }
          // Network error — ambiguous. The registration may have gone through even
          // though the request threw. Ask Dynadot who holds the domain before refunding.
          const owned = await isRegisteredToUs(domainName)
          if (owned === false) {
            await refundSession(
              stripe,
              session,
              `dynadot threw and domain is unowned: ${
                e instanceof Error ? e.message : String(e)
              }`
            )
            return NextResponse.json({ received: true, refunded: true })
          }
          console.error(
            '[domain] buy threw and ownership is unclear — NOT auto-refunding, needs review',
            {
              session: session.id,
              domainName,
              owned,
              error: e instanceof Error ? e.message : String(e),
            }
          )
          return NextResponse.json({ received: true, needsReview: true })
        }

        if (bought) {
          // From here the customer owns the domain. Nothing below is a refund
          // condition — these are our problems to fix, not their money back.
          const projectId = process.env.VERCEL_PROJECT_ID || 'vibe-codes-space'
          try {
            const addRes = await fetch(
              `https://api.vercel.com/v10/projects/${projectId}/domains`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: domainName }),
              }
            )
            if (!addRes.ok) {
              console.error(
                '[domain] registered but project assign failed — domain is owned, attach by hand',
                { session: session.id, domainName, detail: await addRes.text() }
              )
            }
          } catch (e) {
            console.error('[domain] registered but project assign threw', {
              session: session.id,
              domainName,
              error: e instanceof Error ? e.message : String(e),
            })
          }

          if (session.client_reference_id) {
            const { error: insertError } = await supabase.from('sites').insert({
              workspace_id: session.client_reference_id,
              name: domainName,
              custom_domain: domainName,
              status: 'published',
            })
            if (insertError) {
              // The customer paid and owns the domain but has no site row, so
              // it will not appear in their dashboard. Recoverable by hand;
              // still not a refund.
              console.error(
                '[domain] registered but site row insert failed — reconcile by hand',
                { session: session.id, domainName, error: insertError.message }
              )
            }
          } else {
            console.error(
              '[domain] registered with no client_reference_id — cannot attribute to a workspace',
              { session: session.id, domainName }
            )
          }
        }
      } else {
        // Normal SaaS Subscription
        if (session.client_reference_id) {
          const plan = (session.metadata?.plan as string) || 'pro'
          await supabase.from('subscriptions').upsert({
            workspace_id: session.client_reference_id,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'active',
            plan,
          }, { onConflict: 'workspace_id' })
        }
      }
    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription
      const priceId = sub.items.data[0]?.price?.id
      let plan: string = 'pro'
      if (priceId === process.env.STRIPE_PRICE_BUSINESS) plan = 'business'
      else if (priceId === process.env.STRIPE_PRICE_PRO) plan = 'pro'

      await supabase
        .from('subscriptions')
        .update({
          status: sub.status,
          plan,
          current_period_end: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)

    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', plan: 'free' })
        .eq('stripe_subscription_id', sub.id)
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'webhook error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
