import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
const StripeConstructor = require('stripe')
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const stripe = new StripeConstructor(process.env.STRIPE_SECRET_KEY as string, {
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
      
      // If this checkout was for a custom domain purchase:
      if (session.metadata?.domain_purchase === 'true') {
        const domainName = session.metadata.domain_name
        const expectedPrice = parseInt(session.metadata.base_cost || '2000', 10) / 100 
        
        try {
          const buyRes = await fetch('https://api.vercel.com/v5/domains/buy', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: domainName, expectedPrice })
          })
          
          if (!buyRes.ok) {
            console.error("Vercel Domain Buy Error:", await buyRes.text());
          } else {
            const projectId = process.env.VERCEL_PROJECT_ID || 'vibe-codes-space'
            const addRes = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ name: domainName })
            })
            
            if (!addRes.ok) {
              console.error("Vercel Project Assign Error:", await addRes.text())
            }

            if (session.client_reference_id) {
              await supabase.from('sites').insert({
                workspace_id: session.client_reference_id,
                name: domainName,
                custom_domain: domainName,
                status: 'published'
              })
            }
          }
        } catch (e) {
          console.error("Critical Vercel API Integration Failure:", e)
        }

      } else {
        // Normal SaaS Subscription
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
    }
    
    // Additional handlers for customer.subscription.updated / deleted

    return NextResponse.json({ received: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
