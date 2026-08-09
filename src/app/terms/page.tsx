import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — VibeCodes',
  description: 'Terms of Service for VibeCodes Space',
}

export default function TermsPage() {
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

        <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-12">Effective August 9, 2026</p>

        <div className="space-y-10 text-[15px] leading-7 text-foreground">

          <section>
            <h2 className="text-base font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By creating an account or using VibeCodes Space ("VibeCodes", "the Service"), you agree to
              these Terms of Service. If you do not agree, do not use the Service. These terms form a
              binding agreement between you and VibeCodes Space.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground">
              VibeCodes is a website builder platform that lets you create, publish, and manage personal
              websites. Features include AI-assisted site generation, block-based editing, subdomain
              hosting on <span className="text-foreground">*.vibecodes.space</span>, custom domain
              support, and optional paid plans with additional capabilities.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">3. Account Registration</h2>
            <p className="text-muted-foreground mb-3">
              You must provide accurate information when registering. You are responsible for maintaining
              the security of your account credentials. Notify us immediately at{' '}
              <a href="mailto:matty@purepulse.one" className="text-foreground underline underline-offset-2">
                matty@purepulse.one
              </a>{' '}
              if you believe your account has been compromised.
            </p>
            <p className="text-muted-foreground">
              You must be at least 16 years old to create an account. One person may not maintain
              multiple free accounts.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">4. Acceptable Use</h2>
            <p className="text-muted-foreground mb-3">You may not use VibeCodes to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Publish content that is illegal, defamatory, harassing, or infringes third-party rights</li>
              <li>Create phishing pages, credential harvesting forms, or impersonation sites</li>
              <li>Distribute malware or malicious code</li>
              <li>Circumvent rate limits or access controls through automated means</li>
              <li>Resell or sublicense access to the Service without written permission</li>
              <li>Use AI site generation to produce spam or bulk low-quality content at scale</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              We may suspend or terminate sites that violate these rules without prior notice, particularly
              where a violation poses risk to other users or the platform's reputation with domain
              registrars and email providers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">5. Subscriptions and Billing</h2>
            <p className="text-muted-foreground mb-3">
              Paid plans are billed monthly through Stripe. By subscribing, you authorize us to charge
              your payment method on a recurring basis. You may cancel at any time; cancellation takes
              effect at the end of the current billing period and no partial refunds are issued.
            </p>
            <p className="text-muted-foreground">
              We reserve the right to change pricing with 30 days' notice to your registered email
              address. Continued use after the notice period constitutes acceptance of the new pricing.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">6. Your Content</h2>
            <p className="text-muted-foreground mb-3">
              You retain ownership of content you create and publish through VibeCodes. By using the
              Service you grant us a limited, non-exclusive license to host, store, and serve your content
              solely for the purpose of operating the Service.
            </p>
            <p className="text-muted-foreground">
              You represent that you have all rights necessary to publish your content and that it does
              not infringe on any third party's intellectual property, privacy, or other rights.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">7. Custom Domains</h2>
            <p className="text-muted-foreground">
              When you connect a custom domain, you remain the registrant of record and are responsible
              for renewing the domain with your registrar. VibeCodes is not a domain registrar. We may
              remove a custom domain connection if the domain is used to serve prohibited content or if
              DNS verification fails for an extended period.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">8. Termination</h2>
            <p className="text-muted-foreground mb-3">
              You may delete your account at any time from your account settings. Deletion removes your
              sites, content, and personal data within 30 days, subject to data we are required to retain
              for legal or financial compliance.
            </p>
            <p className="text-muted-foreground">
              We may suspend or terminate accounts that violate these Terms, pose security risks, or have
              been inactive for more than 24 months on the free plan.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">9. Disclaimers</h2>
            <p className="text-muted-foreground">
              The Service is provided "as is" without warranty of any kind. We do not guarantee uptime,
              AI generation quality, or that the Service will meet your specific requirements. To the
              maximum extent permitted by law, VibeCodes is not liable for indirect, incidental, or
              consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">10. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of the United States. Disputes will be resolved
              through binding arbitration where permitted by law, or in the courts of competent
              jurisdiction otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">11. Changes to These Terms</h2>
            <p className="text-muted-foreground">
              We may update these Terms from time to time. Material changes will be communicated to
              your registered email address at least 14 days before taking effect. Continued use of the
              Service after changes take effect constitutes your acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">12. Contact</h2>
            <p className="text-muted-foreground">
              Questions about these Terms?{' '}
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
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
