import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { domain, finalPrice, baseCost } = body as {
      domain: string
      finalPrice: number | null  // whole dollars, e.g. 15.99
      baseCost: number           // cents, e.g. 1099
    }

    if (!domain || finalPrice == null) {
      return NextResponse.json({ error: 'Missing domain or price' }, { status: 400 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
    })

    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    const workspaceId = workspaces?.[0]?.id ?? user.id

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Domain Registration: ${domain}`,
              description: '1-year registration, managed for you.',
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      client_reference_id: workspaceId,
      metadata: {
        domain_purchase: 'true',
        domain_name: domain,
        base_cost: String(baseCost),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vibecodes.space'}/dashboard?domain_success=true&domain=${encodeURIComponent(domain)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vibecodes.space'}/dashboard/domains`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('[domain-checkout] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
