import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-24 bg-background" style={{ zIndex: 1 }}>
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Create a professional personal website in minutes
        </h1>
        <p className="text-muted-foreground text-xl max-w-2xl">
          Transform your LinkedIn profile or resume into a stunning, fully-featured portfolio site. No coding required.
        </p>
        <div className="flex gap-4 mt-8">
          <Link href="/login">
            <Button size="lg" className="px-8 font-semibold">Get Started</Button>
          </Link>
          <Link href="/pricing" passHref>
            <Button variant="outline" size="lg" className="px-8 font-semibold">View Pricing</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
