import { spawn } from 'child_process'

const PORT = 3020
const BASE_URL = `http://localhost:${PORT}`

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.status < 500) return true
    } catch {
      // ignore
    }
    await delay(500)
  }
  return false
}

async function runVibeCodesTests() {
  console.log('=================================================================')
  console.log('🚀 Testing VibeCodes.space Pricing, Stripe Checkouts & Integrations')
  console.log('=================================================================\n')

  let passed = 0
  let failed = 0

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ''}`)
      failed++
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Pricing Page Load & Plan Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 1: Pricing Page & Plan Offerings ---')
    const pricingRes = await fetch(`${BASE_URL}/pricing`)
    const pricingHtml = await pricingRes.text()
    assert('Pricing page returns HTTP 200', pricingRes.status === 200)
    assert('Pro plan ($12/mo) present on page', pricingHtml.includes('Pro') && pricingHtml.includes('$12/mo'))
    assert('Business plan ($49/mo) present on page', pricingHtml.includes('Business') && pricingHtml.includes('$49/mo'))
    assert('Done-for-you PurePulse section present', pricingHtml.includes('Rather have us build it?') || pricingHtml.includes('Done-for-you'))
    assert('Starter ($20/mo) plan link present', pricingHtml.includes('plan=starter'))
    assert('Growth ($50/mo) plan link present', pricingHtml.includes('plan=growth'))
    assert('Premium ($75/mo) plan link present', pricingHtml.includes('plan=premium'))
    assert('Business ($100/mo) plan link present', pricingHtml.includes('plan=business'))

    // -------------------------------------------------------------------------
    // TEST 2: Stripe Checkout - Pro Plan ($12/mo)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Stripe Checkout (Pro Plan - $12/mo) ---')
    const proRes = await fetch(`${BASE_URL}/api/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'pro' }),
    })
    const proData = await proRes.json()
    assert('Pro checkout returns HTTP 200', proRes.status === 200)
    assert('Pro checkout returns valid URL', typeof proData.url === 'string' && proData.url.length > 0)
    console.log(`  👉 Pro Checkout URL: ${proData.url}`)

    // -------------------------------------------------------------------------
    // TEST 3: Stripe Checkout - Business Plan ($49/mo)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Stripe Checkout (Business Plan - $49/mo) ---')
    const bizRes = await fetch(`${BASE_URL}/api/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'business' }),
    })
    const bizData = await bizRes.json()
    assert('Business checkout returns HTTP 200', bizRes.status === 200)
    assert('Business checkout returns valid URL', typeof bizData.url === 'string' && bizData.url.length > 0)
    console.log(`  👉 Business Checkout URL: ${bizData.url}`)

    // -------------------------------------------------------------------------
    // TEST 4: Invalid Plan Rejection
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Invalid Plan Handling ---')
    const invalidRes = await fetch(`${BASE_URL}/api/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'unsupported-plan' }),
    })
    assert('Invalid plan returns HTTP 400', invalidRes.status === 400)

    // -------------------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------------------
    console.log('\n=================================================================')
    console.log(`📊 VibeCodes Test Results: ${passed} Passed, ${failed} Failed`)
    console.log('=================================================================\n')

    return failed === 0
  } catch (error) {
    console.error('Fatal test error:', error)
    return false
  }
}

async function main() {
  console.log('Starting Next.js test server on port', PORT, '...')
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: '/Users/matt/.gemini/antigravity/scratch/vibeCodesSpace',
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'inherit',
  })

  try {
    const ready = await waitForServer(`${BASE_URL}/pricing`)
    if (!ready) {
      console.error('Failed to start server within timeout.')
      process.exit(1)
    }

    const success = await runVibeCodesTests()
    server.kill()
    process.exit(success ? 0 : 1)
  } catch (err) {
    console.error(err)
    server.kill()
    process.exit(1)
  }
}

main()
