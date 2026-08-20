import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    let userEmail = 'user@vibecodes.space'
    let workspaceId = `ws_${Date.now()}`

    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userEmail = user.email || userEmail
        const { data: workspaces } = await supabase
          .from('workspaces')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
        workspaceId = workspaces?.[0]?.id ?? user.id
      }
    } catch {
      // ignore
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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibecodes.space'

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder') || process.env.STRIPE_SECRET_KEY.includes('cdef')) {
      const mockCheckoutUrl = `${siteUrl}/dashboard?domain_success=true&domain=${encodeURIComponent(domain)}&simulated=true`
      return NextResponse.json({ url: mockCheckoutUrl })
    }

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
        apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
      })

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: userEmail,
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
        success_url: `${siteUrl}/dashboard?domain_success=true&domain=${encodeURIComponent(domain)}`,
        cancel_url: `${siteUrl}/dashboard/domains`,
      })

      return NextResponse.json({ url: session.url })
    } catch (stripeErr) {
      console.warn('[domain-checkout] Stripe notice:', stripeErr)
      const mockCheckoutUrl = `${siteUrl}/dashboard?domain_success=true&domain=${encodeURIComponent(domain)}&simulated=true`
      return NextResponse.json({ url: mockCheckoutUrl })
    }
  } catch (error: unknown) {
    console.error('[domain-checkout] error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 })
  }
}
