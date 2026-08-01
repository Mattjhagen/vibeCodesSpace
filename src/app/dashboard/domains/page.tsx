'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Globe, Loader2, CheckCircle2, XCircle } from 'lucide-react'

export default function DomainPurchasePage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{available: boolean, baseCost?: number, finalPrice?: number, domain?: string, error?: string} | null>(null)

  const checkDomain = async () => {
    if (!query) return;
    setLoading(true)
    setResult(null)
    
    // Strip http:// or www.
    let cleanDomain = query.trim().toLowerCase()
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, '')
    
    try {
      const res = await fetch(`/api/domains/check?domain=${cleanDomain}`)
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ available: false, error: 'Failed to verify domain status over network' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Custom Domains</h1>
        <p className="text-muted-foreground">
          Search for a custom domain name and instantly provision it to your workspace. Already own one?{' '}
          <Link href="/dashboard/domains/connect" className="underline underline-offset-4">
            Connect it instead
          </Link>
          .
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" /> 
            Domain Search
          </CardTitle>
          <CardDescription>Find the perfect .com, .space, or .dev for your site.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input 
              placeholder="e.g. mykillerportfolio.com" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkDomain()}
              className="text-lg py-6"
            />
            <Button disabled={loading} onClick={checkDomain} size="lg" className="px-8 shrink-0">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {result && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
              {result.error ? (
                 <div className="p-6 bg-destructive/10 border-destructive/20 border rounded-xl flex items-center gap-3">
                   <XCircle className="h-6 w-6 text-destructive" />
                   <div>
                     <h3 className="font-semibold text-destructive">Search Error</h3>
                     <p className="text-sm text-destructive/80">{result.error}</p>
                     <p className="text-xs text-muted-foreground mt-2">(Note: Ensure VERCEL_TOKEN is configured in production environment variables to query the backend registrar)</p>
                   </div>
                 </div>
              ) : result.available ? (
                <div className="p-6 bg-green-500/10 border-green-500/20 border rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="text-xl font-bold text-green-700">{result.domain} is available!</h3>
                      <p className="text-sm text-green-700/80">Lock it in right now before someone else buys it.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                     <span className="text-2xl font-black">${result.finalPrice} <span className="text-sm font-normal text-muted-foreground">/yr</span></span>
                     <form action="/api/stripe/domain-checkout" method="POST">
                       <input type="hidden" name="domain" value={result.domain} />
                       <input type="hidden" name="finalPrice" value={result.finalPrice} />
                       <input type="hidden" name="baseCost" value={result.baseCost} />
                       <Button type="submit" size="lg" className="bg-green-600 hover:bg-green-700 text-white shadow-md transition-transform hover:-translate-y-0.5">
                         Buy Now
                       </Button>
                     </form>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-muted border rounded-xl flex items-center gap-3 opacity-75 grayscale sepia">
                  <XCircle className="h-6 w-6" />
                  <div>
                    <h3 className="font-semibold">{result.domain} is not available</h3>
                    <p className="text-sm text-muted-foreground">This domain has already been registered heavily elsewhere.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
