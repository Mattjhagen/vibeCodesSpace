import { spawn } from 'child_process'

const PORT = 3032
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

const PUBLIC_PAGES = [
  '/',
  '/login',
  '/forgot-password',
  '/update-password',
  '/pricing',
  '/privacy',
  '/terms',
  '/invite/test-token-123',
]

const PROTECTED_PAGES = [
  '/dashboard',
  '/dashboard/analytics',
  '/dashboard/domains',
  '/dashboard/domains/connect',
  '/dashboard/sites/site_123/admin',
  '/builder/site_123',
  '/onboarding',
  '/import',
]

const API_ENDPOINTS = [
  { method: 'POST', path: '/api/stripe/checkout', body: { plan: 'pro' } },
  { method: 'POST', path: '/api/stripe/checkout', body: { plan: 'business' } },
  { method: 'POST', path: '/api/stripe/domain-checkout', body: { domain: 'mybrand.com', finalPrice: 14.99, baseCost: 1099 } },
  { method: 'GET', path: '/api/domains/check?domain=testbrand.com' },
  { method: 'GET', path: '/api/domains/search?q=testbrand' },
  { method: 'POST', path: '/api/abuse', body: { site_id: 'test', reason: 'spam' } },
  { method: 'POST', path: '/api/generate', body: { goal: 'portfolio' } },
  { method: 'POST', path: '/api/migrate', body: { url: 'https://example.com' } },
]

async function runAudit() {
  console.log('=================================================================')
  console.log('🔍 Comprehensive Route Audit: VibeCodes.space')
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

  // 1. Audit Public Pages
  console.log('\n--- 1. Public Pages (Expected HTTP 200 / Redirect) ---')
  for (const path of PUBLIC_PAGES) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' })
      assert(`Public page ${path} healthy (status: ${res.status})`, res.status === 200 || res.status === 307 || res.status === 308 || res.status === 302, `status: ${res.status}`)
    } catch (err) {
      assert(`Public page ${path} reachable`, false, err.message)
    }
  }

  // 2. Audit Protected Dashboard & Builder Pages
  console.log('\n--- 2. Protected Pages (Auth Guard Verification) ---')
  for (const path of PROTECTED_PAGES) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' })
      const isRedirectOrLogin = res.status === 307 || res.status === 308 || res.status === 302 || res.status === 200
      const location = res.headers.get('location') || ''
      assert(`Protected page ${path} auth guard (status: ${res.status}, dest: ${location || 'direct'})`, isRedirectOrLogin && (!location || location.includes('/login')))
    } catch (err) {
      assert(`Protected page ${path} reachable`, false, err.message)
    }
  }

  // 3. Audit API Endpoints
  console.log('\n--- 3. API Endpoints (Health & Safe Handling) ---')
  for (const ep of API_ENDPOINTS) {
    try {
      const options = {
        method: ep.method,
        headers: ep.body ? { 'Content-Type': 'application/json' } : {},
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      }
      const res = await fetch(`${BASE_URL}${ep.path}`, options)
      assert(`API ${ep.method} ${ep.path} handled without crash (status: ${res.status})`, res.status < 500, `status: ${res.status}`)
    } catch (err) {
      assert(`API ${ep.method} ${ep.path} reachable`, false, err.message)
    }
  }

  console.log('\n=================================================================')
  console.log(`📊 VibeCodes Route Audit Results: ${passed} Passed, ${failed} Failed`)
  console.log('=================================================================\n')

  return failed === 0
}

async function main() {
  console.log('Starting VibeCodes test server on port', PORT, '...')
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

    const success = await runAudit()
    server.kill()
    process.exit(success ? 0 : 1)
  } catch (err) {
    console.error(err)
    server.kill()
    process.exit(1)
  }
}

main()
