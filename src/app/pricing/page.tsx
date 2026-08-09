import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Wrench } from 'lucide-react'

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      description: 'Start building your presence',
      price: '$0',
      features: ['1 published site', 'Basic minimal theme', 'VibeCodes subdomain'],
      buttonText: 'Get Started',
      action: '/login'
    },
    {
      name: 'Pro',
      description: 'For professionals and freelancers',
      price: '$12/mo',
      features: ['Up to 3 sites', 'All premium themes', 'Custom domain support', 'Analytics'],
      buttonText: 'Upgrade to Pro',
      action: '/api/stripe/checkout',
      planId: 'pro'
    },
    {
      name: 'Business',
      description: 'For agencies and founders',
      price: '$49/mo',
      features: ['Unlimited sites', 'White-labeling', 'Team collaboration', 'Priority support'],
      buttonText: 'Upgrade to Business',
      action: '/api/stripe/checkout',
      planId: 'business'
    }
  ]
  
  const purePulsePlans = [
    {
      name: 'Starter',
      price: '$20',
      description: 'Perfect for getting online fast',
      features: ['Hosting included', '2 content updates/mo', 'Bug fixes', 'Email support'],
    },
    {
      name: 'Growth',
      price: '$50',
      description: 'For businesses ready to be found',
      features: ['Unlimited updates', 'Priority support (24h)', 'Basic SEO', 'Analytics + monthly report'],
      popular: true,
    },
    {
      name: 'Premium',
      price: '$75',
      description: 'Full-service web presence',
      features: ['Custom development', 'Advanced SEO', 'Phone & video support', 'Quarterly design refresh', 'Social media integration'],
    },
    {
      name: 'Business',
      price: '$100',
      description: 'Your site, actively managed',
      features: ['Monthly planning call', '2 hrs custom work/mo', 'Ongoing performance reviews', 'All Premium features'],
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-muted/20">
      <div className="text-center max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-muted-foreground">Unlock the full power of VibeCodes to grow your personal brand.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        {plans.map(plan => (
          <Card key={plan.name} className={`flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${plan.name === 'Pro' ? 'border-primary ring-1 ring-primary shadow-md relative' : ''}`}>
            {plan.name === 'Pro' && (
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-4xl font-bold mb-6">{plan.price}</div>
              <ul className="space-y-3">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.name === 'Free' ? (
                <a href={plan.action} className="w-full">
                  <Button className="w-full font-semibold" variant="outline">
                    {plan.buttonText}
                  </Button>
                </a>
              ) : (
                <form action={plan.action} method="POST" className="w-full">
                  <input type="hidden" name="plan" value={plan.planId} />
                  <Button type="submit" className="w-full font-semibold" variant={plan.name === 'Pro' ? 'default' : 'outline'}>
                    {plan.buttonText}
                  </Button>
                </form>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Done-for-you section */}
      <div className="max-w-5xl w-full mt-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-400 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            <Wrench className="h-3.5 w-3.5" />
            Done-for-you
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-3">Rather have us build it?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Skip the builder entirely. PurePulse designs, develops, and maintains your site on a 12-month plan.
            All plans require a <strong className="text-foreground">$150 one-time deposit</strong> to kick off.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {purePulsePlans.map(plan => (
            <Card
              key={plan.name}
              className={`flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative ${plan.popular ? 'border-violet-500 ring-1 ring-violet-500 shadow-md' : 'border-border'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-3 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <a href="https://purepulse.one" target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button
                    className={`w-full font-semibold ${plan.popular ? 'bg-violet-600 hover:bg-violet-500 text-white' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Book a Consultation →
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          All PurePulse plans are 12-month commitments and require a $150 deposit. Built and managed by{' '}
          <a href="https://purepulse.one" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">
            purepulse.one
          </a>
          .
        </p>
      </div>
    </div>
  )
}
