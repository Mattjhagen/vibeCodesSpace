import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — VibeCodes',
  description: 'Privacy Policy for VibeCodes Space',
}

const EFFECTIVE = 'August 11, 2026'
const EMAIL = 'matty@purepulse.one'
const COMPANY = 'VibeCodes'
const SITE = 'vibecodes.space'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-12">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← VibeCodes
          </Link>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-2">Effective {EFFECTIVE}</p>
        <p className="text-sm text-muted-foreground mb-12">
          This Privacy Policy describes how {COMPANY} ("{COMPANY}", "we", "us", or "our") collects, uses, and shares information about you when you use our website builder platform at {SITE} and related services (the "Service").
        </p>

        <div className="space-y-10 text-[15px] leading-7 text-foreground">

          <section>
            <h2 className="text-base font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-3">We collect information you provide directly to us and information collected automatically when you use the Service.</p>
            <h3 className="text-sm font-semibold mb-2 mt-4">Information you provide</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Account information</strong> — name, email address, and password when you register</li>
              <li><strong className="text-foreground">Profile content</strong> — text, images, and other content you upload to build your site</li>
              <li><strong className="text-foreground">Payment information</strong> — processed by Stripe; we do not store card numbers</li>
              <li><strong className="text-foreground">Communications</strong> — messages you send us via email or support tickets</li>
              <li><strong className="text-foreground">LinkedIn data</strong> — if you choose to connect your LinkedIn account, we receive your name, email address, headline, and profile information you authorize. We use this solely to generate your website content. We do not post to LinkedIn or store LinkedIn credentials.</li>
            </ul>
            <h3 className="text-sm font-semibold mb-2 mt-4">Information collected automatically</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Usage data</strong> — pages visited, features used, time spent, clicks</li>
              <li><strong className="text-foreground">Device data</strong> — browser type, operating system, IP address</li>
              <li><strong className="text-foreground">Site analytics</strong> — page view counts for your published sites (aggregated, not personally identifiable to your visitors)</li>
              <li><strong className="text-foreground">Cookies</strong> — session cookies for authentication and preference cookies. See Section 7.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Provide, operate, and improve the Service</li>
              <li>Generate website content using AI based on information you provide</li>
              <li>Process payments and manage your subscription</li>
              <li>Send transactional emails (account confirmation, invoices, password resets)</li>
              <li>Respond to your support requests</li>
              <li>Monitor for abuse and enforce our Terms of Service</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="text-muted-foreground mt-3">We do not sell your personal information. We do not use your information for advertising purposes.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">3. LinkedIn Integration</h2>
            <p className="text-muted-foreground mb-3">
              If you choose to connect your LinkedIn account to {COMPANY}, we use LinkedIn's OAuth 2.0 and OpenID Connect APIs to access only the profile data you explicitly authorize. Specifically:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>We access your name, email address, headline, and profile information solely to generate your website content</li>
              <li>We do not access your LinkedIn connections, messages, or private data</li>
              <li>We do not post, share, or publish anything to LinkedIn on your behalf</li>
              <li>We do not store your LinkedIn access tokens beyond the active session</li>
              <li>You can disconnect your LinkedIn account at any time from your account settings</li>
              <li>LinkedIn data is used only for the purpose of building your site and is not shared with third parties</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Our use of LinkedIn APIs is subject to the <a href="https://legal.linkedin.com/api-terms-of-use" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">LinkedIn API Terms of Use</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">4. How We Share Your Information</h2>
            <p className="text-muted-foreground mb-3">We share your information only in the following circumstances:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Service providers</strong> — Supabase (database), Vercel (hosting), Stripe (payments), Resend (email), OpenAI (AI generation). Each is bound by data processing agreements.</li>
              <li><strong className="text-foreground">Published sites</strong> — content you choose to publish is publicly accessible at your subdomain</li>
              <li><strong className="text-foreground">Collaborators</strong> — users you explicitly invite to edit your site receive access to that site's content only</li>
              <li><strong className="text-foreground">Legal requirements</strong> — if required by law, court order, or to protect rights and safety</li>
              <li><strong className="text-foreground">Business transfers</strong> — in the event of a merger or acquisition, with notice to you</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">5. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your account data for as long as your account is active. If you delete your account, we delete your personal information within 30 days, except where retention is required by law or legitimate business purposes (such as fraud prevention). Published site content is deleted immediately upon account deletion. Analytics data is retained in aggregated, anonymized form.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">6. Security</h2>
            <p className="text-muted-foreground">
              We use industry-standard security measures including encryption in transit (TLS), encrypted storage via Supabase, and access controls. However, no system is completely secure. We encourage you to use a strong, unique password and enable two-factor authentication where available.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">7. Cookies</h2>
            <p className="text-muted-foreground mb-3">We use the following types of cookies:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Essential cookies</strong> — required for authentication and session management. Cannot be disabled.</li>
              <li><strong className="text-foreground">Preference cookies</strong> — remember your theme and settings choices</li>
              <li><strong className="text-foreground">Analytics cookies</strong> — Vercel Analytics to understand feature usage (anonymized). You can opt out via your browser's Do Not Track setting.</li>
            </ul>
            <p className="text-muted-foreground mt-3">We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">8. Your Rights</h2>
            <p className="text-muted-foreground mb-3">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong className="text-foreground">Correction</strong> — request correction of inaccurate data</li>
              <li><strong className="text-foreground">Deletion</strong> — request deletion of your account and associated data</li>
              <li><strong className="text-foreground">Portability</strong> — request your data in a portable format</li>
              <li><strong className="text-foreground">Objection</strong> — object to certain uses of your data</li>
              <li><strong className="text-foreground">LinkedIn data</strong> — you may revoke {COMPANY}'s access to your LinkedIn data at any time via your LinkedIn account settings at linkedin.com/settings/</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              To exercise any of these rights, email us at <a href={`mailto:${EMAIL}`} className="underline underline-offset-2">{EMAIL}</a>. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">9. Children's Privacy</h2>
            <p className="text-muted-foreground">
              The Service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">10. International Transfers</h2>
            <p className="text-muted-foreground">
              {COMPANY} is operated from the United States. If you access the Service from outside the US, your information may be transferred to and processed in the US. By using the Service, you consent to this transfer. We ensure appropriate safeguards are in place for any international data transfers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">11. Third-Party Links</h2>
            <p className="text-muted-foreground">
              Sites built with VibeCodes may contain links to third-party websites. We are not responsible for the privacy practices of those sites. We encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">12. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of material changes by email or by posting a notice on the Service. Your continued use of the Service after changes take effect constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">13. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <div className="mt-3 text-muted-foreground">
              <p><strong className="text-foreground">VibeCodes</strong></p>
              <p>A product of PurePulse</p>
              <p>Email: <a href={`mailto:${EMAIL}`} className="underline underline-offset-2">{EMAIL}</a></p>
              <p>Website: <a href={`https://${SITE}`} className="underline underline-offset-2">{SITE}</a></p>
            </div>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} VibeCodes · <Link href="/terms" className="underline underline-offset-2">Terms of Service</Link>
          </p>
        </div>

      </div>
    </div>
  )
}
