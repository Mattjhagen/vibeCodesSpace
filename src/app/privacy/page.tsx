import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — VibeCodes',
  description: 'Privacy Policy for VibeCodes Space',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-12">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← VibeCodes
          </Link>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Effective August 9, 2026</p>

        <div className="space-y-10 text-[15px] leading-7 text-foreground">

          <section>
            <h2 className="text-base font-semibold mb-3">1. What We Collect</h2>
            <p className="text-muted-foreground mb-3">
              We collect the minimum information needed to provide the Service:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>
                <span className="text-foreground font-medium">Account data</span> — email address, name,
                and profile picture when you sign in with Google or create an account with a password.
              </li>
              <li>
                <span className="text-foreground font-medium">Site content</span> — the text, images, and
                structure of sites you build and publish through the Service.
              </li>
              <li>
                <span className="text-foreground font-medium">Usage data</span> — which pages on your
                published site receive visits (daily rollups, not individual sessions), and how many AI
                site generations your workspace has used.
              </li>
              <li>
                <span className="text-foreground font-medium">Billing data</span> — payment is handled by
                Stripe; we store only your Stripe customer ID and subscription status, not card details.
              </li>
              <li>
                <span className="text-foreground font-medium">Communications</span> — messages you send us
                directly, and form submissions made to your sites through the Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">2. How We Use It</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>To create and maintain your account and sites</li>
              <li>To generate site content using AI when you request it</li>
              <li>To process payments and manage your subscription</li>
              <li>To send transactional emails (account confirmations, billing receipts, security notices)</li>
              <li>To detect and prevent abuse, phishing, and policy violations</li>
              <li>To improve the Service based on aggregate, anonymised usage patterns</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              We do not sell your personal data. We do not use your site content to train AI models.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">3. Third-Party Services</h2>
            <p className="text-muted-foreground mb-3">
              We use the following third parties to operate the Service. Each has its own privacy policy.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <span className="text-foreground font-medium">Supabase</span> — authentication and
                database hosting. Your account data and site content are stored in Supabase's
                infrastructure.
              </li>
              <li>
                <span className="text-foreground font-medium">Stripe</span> — payment processing.
                Stripe handles all card data under PCI DSS compliance.
              </li>
              <li>
                <span className="text-foreground font-medium">Vercel</span> — hosting and CDN. Your
                published sites are served through Vercel's edge network.
              </li>
              <li>
                <span className="text-foreground font-medium">OpenAI</span> — AI site generation.
                When you use the AI generation feature, your resume or LinkedIn data is sent to OpenAI's
                API to draft site content. OpenAI's API usage policy prohibits training on API inputs.
              </li>
              <li>
                <span className="text-foreground font-medium">Google</span> — optional sign-in via
                Google OAuth. If you choose "Continue with Google," Google shares your name, email, and
                profile picture with us per Google's own privacy policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">4. Cookies and Storage</h2>
            <p className="text-muted-foreground">
              We use a single session cookie to keep you signed in. We do not use tracking cookies,
              advertising cookies, or third-party analytics cookies. Your browser's local storage may
              hold draft editor state while you are building a site.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">5. Data Retention</h2>
            <p className="text-muted-foreground">
              Your account and site data are retained for as long as your account is active. If you
              delete your account, your personal data and site content are removed within 30 days.
              Billing records are retained for 7 years as required by financial regulations. Abuse
              reports may be retained indefinitely where required for legal proceedings.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">6. Your Rights</h2>
            <p className="text-muted-foreground mb-3">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Access a copy of the personal data we hold about you</li>
              <li>Correct inaccurate data in your account settings</li>
              <li>Delete your account and associated data</li>
              <li>Export your site content at any time from the dashboard</li>
              <li>Object to processing where we rely on legitimate interests</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              To exercise these rights, email{' '}
              <a
                href="mailto:matty@purepulse.one"
                className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                matty@purepulse.one
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">7. Children's Privacy</h2>
            <p className="text-muted-foreground">
              VibeCodes is not directed at children under 16. We do not knowingly collect personal
              data from anyone under 16. If you believe a child has created an account, contact us
              and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">8. Security</h2>
            <p className="text-muted-foreground">
              All data is transmitted over TLS. Database access is controlled by row-level security
              policies that enforce ownership — your data is not accessible to other users. Passwords
              are hashed and never stored in plaintext. Service role credentials are never exposed
              to the client.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">9. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. Material changes will be
              communicated to your registered email address before taking effect. The effective date
              at the top of this page reflects when the current version was last updated.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">10. Contact</h2>
            <p className="text-muted-foreground">
              Privacy questions or requests:{' '}
              <a
                href="mailto:matty@purepulse.one"
                className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                matty@purepulse.one
              </a>
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground">
            See also:{' '}
            <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
