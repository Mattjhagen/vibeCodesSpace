// Supabase Auth email templates — paste HTML into Supabase dashboard template editors.
// Variables like {{ .ConfirmationURL }} and {{ .Token }} are Go template syntax
// that Supabase substitutes before sending.

const F = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`
const BG = '#08080e'
const CARD = '#0d0d1a'
const BD = '#1e1e30'
const TX = '#f2f0fb'
const MT = '#8888a0'
const DM = '#44445a'
const PU = '#8b63f5'

function wordmark() {
  return `<tr><td align="center" style="padding-bottom:24px">
<a href="https://vibecodes.space" style="text-decoration:none">
<span style="font-family:${F};font-size:20px;font-weight:700;letter-spacing:-.04em;color:${TX}">Vibe<span style="color:${PU}">Codes</span></span>
</a>
</td></tr>`
}

function footer(note: string) {
  return `<tr><td align="center" style="padding-top:24px">
<p style="margin:0;font-family:${F};font-size:12px;line-height:1.7;color:${DM}">
<a href="https://vibecodes.space" style="color:${DM};text-decoration:none">vibecodes.space</a>
&nbsp;&middot;&nbsp;${note}
</p>
</td></tr>`
}

function wrap(inner: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
</head>
<body style="margin:0;padding:0;background-color:${BG};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BG}">
<tr><td align="center" style="padding:44px 16px 52px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%">
${inner}
</table>
</td></tr>
</table>
</body>
</html>`
}

function actionCard(heading: string, body: string, cta: string, ctaHref: string, footerNote: string) {
  return wrap(`
${wordmark()}
<tr><td bgcolor="${CARD}" style="background-color:${CARD};border-radius:14px;border:1px solid ${BD};padding:36px 36px 32px">
<h1 style="margin:0 0 12px;font-family:${F};font-size:20px;font-weight:700;line-height:1.25;color:${TX};letter-spacing:-.03em">${heading}</h1>
<p style="margin:0 0 28px;font-family:${F};font-size:15px;line-height:1.7;color:${MT}">${body}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr><td bgcolor="${PU}" style="background-color:${PU};border-radius:8px">
<a href="${ctaHref}" style="display:inline-block;padding:13px 26px;font-family:${F};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-.01em">${cta}</a>
</td></tr>
</table>
<p style="margin:22px 0 0;font-family:${F};font-size:12px;line-height:1.6;color:${DM}">
If the button doesn't work, copy this link into your browser:<br>
<a href="${ctaHref}" style="color:${PU};word-break:break-all;text-decoration:none">${ctaHref}</a>
</p>
</td></tr>
${footer(footerNote)}`)
}

function otpCard(
  heading: string,
  body: string,
  otpToken: string,
  footerNote: string,
  magicLink?: { cta: string; href: string },
) {
  const linkSection = magicLink
    ? `<p style="margin:0 0 16px;font-family:${F};font-size:13px;color:${MT}">Or use a magic link instead:</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr><td style="border:1px solid #2a2a46;border-radius:8px">
<a href="${magicLink.href}" style="display:inline-block;padding:10px 20px;font-family:${F};font-size:13px;font-weight:500;color:${PU};text-decoration:none">${magicLink.cta}</a>
</td></tr>
</table>`
    : ''

  return wrap(`
${wordmark()}
<tr><td bgcolor="${CARD}" style="background-color:${CARD};border-radius:14px;border:1px solid ${BD};padding:36px 36px 32px">
<h1 style="margin:0 0 12px;font-family:${F};font-size:20px;font-weight:700;line-height:1.25;color:${TX};letter-spacing:-.03em">${heading}</h1>
<p style="margin:0 0 28px;font-family:${F};font-size:15px;line-height:1.7;color:${MT}">${body}</p>
<div style="background-color:#08081a;border:1px solid #252540;border-radius:10px;padding:20px 24px;display:inline-block;margin-bottom:8px">
<p style="margin:0 0 8px;font-family:${F};font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${DM}">Your code</p>
<p style="margin:0;font-family:'SF Mono','Fira Code','Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:.2em;color:${TX}">${otpToken}</p>
</div>
<p style="margin:10px 0 ${magicLink ? '28' : '0'}px;font-family:${F};font-size:12px;color:${DM}">Expires in 10 minutes. Do not share this code.</p>
${linkSection}
</td></tr>
${footer(footerNote)}`)
}

function notifyCard(heading: string, body: string, detail: string, footerNote: string) {
  return wrap(`
${wordmark()}
<tr><td bgcolor="${CARD}" style="background-color:${CARD};border-radius:14px;border:1px solid ${BD};padding:36px 36px 32px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
<tr>
<td width="36" height="36" bgcolor="#1a1a30" style="background-color:#1a1a30;border-radius:8px;text-align:center;vertical-align:middle">
<span style="font-size:18px;line-height:36px">🔒</span>
</td>
<td style="padding-left:12px">
<p style="margin:0;font-family:${F};font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${DM}">Security notice</p>
</td>
</tr>
</table>
<h1 style="margin:0 0 12px;font-family:${F};font-size:20px;font-weight:700;line-height:1.25;color:${TX};letter-spacing:-.03em">${heading}</h1>
<p style="margin:0 0 16px;font-family:${F};font-size:15px;line-height:1.7;color:${MT}">${body}</p>
<p style="margin:0 0 24px;font-family:${F};font-size:14px;line-height:1.65;color:${MT}">${detail}</p>
<hr style="margin:0 0 24px;border:none;border-top:1px solid ${BD}">
<p style="margin:0;font-family:${F};font-size:13px;line-height:1.6;color:${DM}">
If you did not make this change, contact us immediately at <a href="mailto:matty@purepulse.one" style="color:${PU};text-decoration:none">matty@purepulse.one</a> or visit the <a href="https://vibecodes.space/dashboard/settings/security" style="color:${PU};text-decoration:none">Security settings page</a>.
</p>
</td></tr>
${footer(footerNote)}`)
}

// ─── Authentication templates ─────────────────────────────────────────────────

/** Supabase: Authentication → Email Templates → Confirm signup */
export const confirmSignup = {
  subject: 'Confirm your VibeCodes account',
  html: actionCard(
    'Confirm your email',
    'Thanks for signing up for VibeCodes. Click the button below to confirm your email address and start building your site.',
    'Confirm email →',
    '{{ .ConfirmationURL }}',
    "If you didn't create a VibeCodes account, you can safely ignore this email.",
  ),
}

/** Supabase: Authentication → Email Templates → Invite user */
export const inviteUser = {
  subject: "You've been invited to a VibeCodes workspace",
  html: actionCard(
    "You're invited",
    "You've been invited to collaborate on a VibeCodes site. Click the button below to accept the invitation and create your account.",
    'Accept invitation →',
    '{{ .ConfirmationURL }}',
    "If you weren't expecting an invitation, you can safely ignore this email.",
  ),
}

/** Supabase: Authentication → Email Templates → Magic link
 *  Variables: {{ .Token }} (OTP code), {{ .ConfirmationURL }} (magic link) */
export const magicLink = {
  subject: 'Your VibeCodes sign-in code',
  html: otpCard(
    'Sign in to VibeCodes',
    'Use the code below or click the magic link to sign in to your workspace.',
    '{{ .Token }}',
    "If you didn't request this, you can safely ignore it.",
    { cta: 'Sign in with magic link', href: '{{ .ConfirmationURL }}' },
  ),
}

/** Supabase: Authentication → Email Templates → Change email address */
export const changeEmail = {
  subject: 'Confirm your new email address',
  html: actionCard(
    'Confirm your new email',
    "We received a request to change the email address on your VibeCodes account. Click the button below to confirm your new address. If you didn't make this request, you can ignore this email — your current address won't change.",
    'Confirm new email →',
    '{{ .ConfirmationURL }}',
    "If you didn't request this change, ignore this email.",
  ),
}

/** Supabase: Authentication → Email Templates → Reset password */
export const resetPassword = {
  subject: 'Reset your VibeCodes password',
  html: actionCard(
    'Reset your password',
    'We received a request to reset the password for your VibeCodes account. Click the button below to choose a new password. This link expires in 1 hour.',
    'Reset password →',
    '{{ .ConfirmationURL }}',
    "If you didn't request a password reset, you can safely ignore this email.",
  ),
}

/** Supabase: Authentication → Email Templates → Reauthentication
 *  Variable: {{ .Token }} */
export const reauthentication = {
  subject: 'VibeCodes verification code',
  html: otpCard(
    'Verify it’s you',
    'Enter the code below to confirm your identity before continuing with your account change.',
    '{{ .Token }}',
    "If you didn't request this, contact us at matty@purepulse.one.",
  ),
}

// ─── Security notification templates ─────────────────────────────────────────

/** Supabase: Authentication → Security notifications → Password changed */
export const passwordChanged = {
  subject: 'Your VibeCodes password was changed',
  html: notifyCard(
    'Password changed',
    'The password for your VibeCodes account was successfully changed.',
    'If you made this change, no further action is needed.',
    'You received this because a password change was made on your account.',
  ),
}

/** Supabase: Authentication → Security notifications → Email address changed */
export const emailChanged = {
  subject: 'Your VibeCodes email address was changed',
  html: notifyCard(
    'Email address updated',
    'The email address on your VibeCodes account has been changed.',
    'If you made this change, no further action is needed.',
    'You received this because an email address change was made on your account.',
  ),
}

/** Supabase: Authentication → Security notifications → Phone number changed */
export const phoneChanged = {
  subject: 'Your VibeCodes phone number was changed',
  html: notifyCard(
    'Phone number updated',
    'The phone number associated with your VibeCodes account has been changed.',
    'If you made this change, no further action is needed.',
    'You received this because a phone number change was made on your account.',
  ),
}

/** Supabase: Authentication → Security notifications → Sign-in method linked */
export const signinMethodLinked = {
  subject: 'A new sign-in method was added to your VibeCodes account',
  html: notifyCard(
    'New sign-in method linked',
    'A new sign-in method has been linked to your VibeCodes account.',
    'This means you can now sign in using the newly linked provider or credential.',
    'You received this because your account sign-in methods were changed.',
  ),
}

/** Supabase: Authentication → Security notifications → Sign-in method removed */
export const signinMethodRemoved = {
  subject: 'A sign-in method was removed from your VibeCodes account',
  html: notifyCard(
    'Sign-in method removed',
    'A sign-in method has been removed from your VibeCodes account.',
    'If you made this change, you can no longer use that method to sign in.',
    'You received this because your account sign-in methods were changed.',
  ),
}

/** Supabase: Authentication → Security notifications → MFA method added */
export const mfaAdded = {
  subject: 'Two-factor authentication was enabled on your VibeCodes account',
  html: notifyCard(
    'Two-factor authentication enabled',
    'A two-factor authentication (2FA) method has been added to your VibeCodes account.',
    "Your account is now more secure. You'll be prompted for a second factor when signing in.",
    'You received this because 2FA was added to your account.',
  ),
}

/** Supabase: Authentication → Security notifications → MFA method removed */
export const mfaRemoved = {
  subject: 'Two-factor authentication was removed from your VibeCodes account',
  html: notifyCard(
    'Two-factor authentication removed',
    'A two-factor authentication (2FA) method has been removed from your VibeCodes account.',
    'If you made this change, sign-in will no longer require a second factor for this method.',
    'You received this because 2FA was removed from your account.',
  ),
}
