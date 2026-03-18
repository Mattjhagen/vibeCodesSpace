import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2024-06-20' as any,
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
      
      // Update the `subscriptions` table and workspace tier
      if (session.client_reference_id) {
         await supabase.from('subscriptions').upsert({
           workspace_id: session.client_reference_id,
           stripe_customer_id: session.customer as string,
           stripe_subscription_id: session.subscription as string,
           status: 'active',
           plan: 'pro'
         })
      }
    }
    
    // Additional handlers for customer.subscription.updated / deleted

    return NextResponse.json({ received: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
