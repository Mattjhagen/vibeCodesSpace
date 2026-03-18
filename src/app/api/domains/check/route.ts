import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const domain = url.searchParams.get('domain')

    if (!domain) {
      return NextResponse.json({ error: 'Domain name is required' }, { status: 400 })
    }

    if (!process.env.VERCEL_TOKEN) {
      return NextResponse.json({ error: 'Server misconfiguration: VERCEL_TOKEN missing' }, { status: 500 })
    }

    // 1. Check Availability
    const statusRes = await fetch(`https://api.vercel.com/v4/domains/status?name=${encodeURIComponent(domain)}`, {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`
      }
    })
    
    if (!statusRes.ok) {
      const errData = await statusRes.json()
      return NextResponse.json({ error: `Vercel API Status Error: ${errData.error?.message || 'Unknown'}` }, { status: statusRes.status })
    }

    const statusData = await statusRes.json()
    
    if (!statusData.available) {
      return NextResponse.json({ available: false, domain })
    }

    // 2. Fetch Price
    const priceRes = await fetch(`https://api.vercel.com/v4/domains/price?name=${encodeURIComponent(domain)}`, {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`
      }
    })

    if (!priceRes.ok) {
      const errData = await priceRes.json()
      return NextResponse.json({ error: `Vercel API Price Error: ${errData.error?.message || 'Unknown'}` }, { status: priceRes.status })
    }

    const priceData = await priceRes.json()

    // Base cost in dollars (e.g., 20)
    const baseCost = priceData.price 

    // We add a $5 platform markup securely inside the backend
    const finalPrice = baseCost + 5

    return NextResponse.json({ 
      available: true, 
      domain, 
      baseCost,
      finalPrice,
      period: priceData.period // Usually 1 year
    })

  } catch (err: any) {
    console.error('Domain Check Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
