import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url), { status: 303 })
    }

    const formData = await req.formData()
    const plan = formData.get('plan') as string

    if (!plan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2024-06-20',
    })

    let priceId = ''
    if (plan === 'pro') {
      priceId = process.env.STRIPE_PRICE_PRO as string
    } else if (plan === 'business') {
      priceId = process.env.STRIPE_PRICE_BUSINESS as string
    } else {
       return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured in environment variables' }, { status: 500 })
    }

    // Fetch the user's workspace to wire the Checkout for webhook processing
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    const workspaceId = workspaces?.[0]?.id;
    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace found. Please complete onboarding first.' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      client_reference_id: workspaceId,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vibecodes.space'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vibecodes.space'}/pricing`,
    })

    if (session.url) {
      return NextResponse.redirect(session.url, { status: 303 })
    }

    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
