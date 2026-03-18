import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

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
      action: '/api/stripe/checkout?plan=pro'
    },
    {
      name: 'Business',
      description: 'For agencies and founders',
      price: '$49/mo',
      features: ['Unlimited sites', 'White-labeling', 'Team collaboration', 'Priority support'],
      buttonText: 'Upgrade to Business',
      action: '/api/stripe/checkout?plan=business'
    }
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
              <Button className="w-full font-semibold" variant={plan.name === 'Pro' ? 'default' : 'outline'}>
                {plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
