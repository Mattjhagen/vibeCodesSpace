# Vibecodes brand & design system

This document defines the visual identity used across the landing page and Site Builder so the product feels like one consistent brand (similar to Squarespace’s unified look).

## Brand name

- **Product name:** Vibecodes (or “Vibecodes.space” where the domain is relevant).
- **Tagline:** “Create your website” — used in hero and onboarding.
- **Logo mark:** The `{ V }` graphic in the hero (brace, V, brace). Use for recognition; pair with the wordmark when needed.

## Voice & tone

- Clear and welcoming for non-technical users.
- Confident but not salesy. Focus on “you can do this” and “no code required.”
- Short sentences and scannable copy.

## Color palette

| Role | Token | Hex | Use |
|------|--------|-----|-----|
| Background (base) | `--bg-primary` | `#0a0a0c` | Page background |
| Background (elevated) | `--bg-elevated` | `#121214` | Sections, cards |
| Background (card) | `--bg-card` | `#161618` | Cards, modals, toolbar |
| Border | `--border` | `#252528` | Dividers, inputs |
| Text (primary) | `--text-primary` | `#fafafa` | Headings, body |
| Text (secondary) | `--text-secondary` | `#a1a1aa` | Supporting copy |
| Text (muted) | `--text-muted` | `#71717a` | Hints, captions |
| **Accent** | `--accent` | `#a78bfa` | Links, highlights, icons, active states |
| Accent (soft) | `--accent-soft` | `rgba(167,139,250,0.12)` | Subtle fills |
| CTA (primary button) | `--cta-bg` | `#ffffff` | “Get started”, “Start building” |
| CTA text | `--cta-text` | `#0a0a0c` | Text on white buttons |

Primary CTAs are **white buttons with dark text** (Squarespace-style). Secondary actions use outline or muted fills.

## Typography

- **Font:** Inter (with system-ui fallback). Load via Google Fonts or equivalent.
- **Scale:** Use CSS variables `--text-xs` through `--text-3xl` for consistent sizing.
- **Weights:** 500 (medium), 600 (semibold), 700 (bold). Avoid light for body on dark backgrounds.
- **Letter-spacing:** Slight negative on headlines (`--tracking-tight`); slightly positive on wordmark (`--tracking-brand` or 0.04em).

## Spacing & layout

- **Container:** Max-width 1200px, horizontal padding 20px.
- **Spacing scale:** Use `--space-1` through `--space-12` for margins and padding so rhythm stays consistent.

## Radii & shadows

- **Radii:** `--radius-sm` (6px), `--radius-md` (8px), `--radius-lg` (12px), `--radius-xl` (16px). Use for buttons, cards, modals.
- **Shadows:** `--shadow-sm`, `--shadow-md`, `--shadow-lg` for depth on dark backgrounds.

## Motion

- **Easing:** `--transition` (0.35s cubic-bezier(0.4, 0, 0.2, 1)) for hovers and toggles.
- **Modals/overlays:** `--ease-out` for enter animations.
- Keep animations subtle (e.g. translateY(-2px), opacity, scale) so the feel stays calm and professional.

## Where it’s applied

- **Landing page:** `index.html` + `styles.css` — all tokens live in `:root` in `styles.css`.
- **Site Builder:** `builder.html` — toolbar and chrome use the same tokens (via shared or inline variables) so the builder clearly belongs to the same product.
- **Templates:** Optional: templates can use a light or dark variant; current set uses dark surfaces and accent for consistency with the app.

## Checklist for new UI

- [ ] Use design tokens from `styles.css` (no hardcoded hex for brand colors).
- [ ] Primary action = white button; secondary = outline or muted.
- [ ] Same font (Inter) and spacing scale.
- [ ] Borders and shadows from the token set.
- [ ] Hover/active states use `--accent` or `--accent-soft` where appropriate.
