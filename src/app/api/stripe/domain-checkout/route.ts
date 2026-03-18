import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type Stripe from 'stripe'
const StripeConstructor = require('stripe')

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url), { status: 303 })
    }

    const formData = await req.formData()
    const domain = formData.get('domain') as string
    const targetPriceStr = formData.get('finalPrice') as string
    const baseCostStr = formData.get('baseCost') as string

    if (!domain || !targetPriceStr || !baseCostStr) {
      return NextResponse.json({ error: 'Missing domain or price parameters' }, { status: 400 })
    }

    const finalPriceInCents = parseInt(targetPriceStr, 10) * 100
    const baseCostInCents = parseInt(baseCostStr, 10) * 100

    const stripe = new StripeConstructor(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2024-06-20' as any,
    })

    // Get the workspace safely
    const { data: memberships } = await supabase
      .from('workspace_users')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)

    let workspaceId = memberships?.[0]?.workspace_id;
    if (!workspaceId) {
       workspaceId = user.id;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Domain Registration: ${domain}`,
              description: `1 Year Registration for your custom domain.`,
            },
            unit_amount: finalPriceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      client_reference_id: workspaceId,
      metadata: {
        domain_purchase: 'true',
        domain_name: domain,
        base_cost: baseCostInCents.toString(), // To double check Vercel API cost matches inside the webhook
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vibecodes.space'}/dashboard?domain_success=true&domain=${domain}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vibecodes.space'}/dashboard/domains/buy`,
    })

    if (session.url) {
      return NextResponse.redirect(session.url, { status: 303 })
    }

    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
