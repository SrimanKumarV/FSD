# Alumnex Connect — UI/UX AI Build Guide

**Purpose of this document:** This is a ready-to-use prompt + reference spec for instructing an AI coding assistant (Claude, GPT, etc.) to redesign or extend Alumnex Connect's UI so it looks like a real, polished product rather than a student project. It's written in two parts:

1. **The prompt** — copy-paste this directly to an AI assistant when asking it to build or fix a UI screen.
2. **The reference spec** — everything the AI needs to know about your actual existing design system, so it doesn't invent a new one or contradict what's already there.

This matters because Alumnex Connect already has a genuinely good design foundation (CSS-variable-based theming, 7 pre-built themes, a fluid type scale, glassmorphism utilities, a `Button`/`Modal` component library). The biggest UI risk right now isn't "no design system" — it's an AI assistant ignoring the existing one and bolting on inconsistent one-off styles. This doc exists to prevent that.

---

## Part 1: The Prompt

Copy this block, fill in the `[SCREEN/FEATURE]` bracket, and paste it to your AI assistant along with the relevant file(s):

```
You are acting as a senior product designer and frontend engineer working on
Alumnex Connect, a MERN-stack alumni networking and mentorship platform.

Before writing any code, read docs/UI_UX_AI_BUILD_GUIDE.md in this repo in full.
It documents our existing design system (colors, typography, spacing, motion,
component library, and accessibility rules). Do not introduce new colors, fonts,
spacing scales, or button/card styles that aren't already defined there — extend
the existing system, don't replace it.

Task: [SCREEN/FEATURE — e.g. "Redesign the Mentorship request card and the
Mentorship dashboard page"]

Requirements:
1. Reuse the shared components already in frontend/src/components/ui/
   (Button, Modal, Skeleton, EmptyState, ScrollReveal) instead of writing new
   inline button/modal markup. If a needed primitive doesn't exist yet
   (e.g. Input, Card, Badge, Toast), build it as a new shared component in
   that same folder, following the existing Button.js/Modal.js pattern
   (forwardRef, variant + size props, Tailwind + CSS-variable colors).
2. Support both light and dark mode using the existing `dark:` variant
   pattern — check the target page in an existing dark-mode screenshot or
   by reading a sibling page's className patterns before adding new ones.
3. Respect the existing 7-theme system (minimalist, cyber-neon, heroui,
   designcode) — use theme-agnostic utility classes (bg-primary-600,
   text-secondary-500, etc.) rather than hardcoded hex colors, so the
   screen renders correctly under every theme without extra work.
4. Add real interaction detail: hover states, focus rings, loading states
   (use the existing Skeleton component, not a spinner-only state), empty
   states (use EmptyState), and error states — a screen that only has a
   "happy path" design isn't done.
5. Add accessibility attributes as you build, not as an afterthought:
   aria-label on icon-only buttons, role="dialog" + focus trapping on any
   new modal, aria-invalid + aria-describedby on form fields with
   validation errors, aria-current on active nav items.
6. Use framer-motion (already a dependency) for meaningful transitions only
   — page-enter fades, modal enter/exit, list-item stagger on load. Avoid
   decorative animation that adds latency without adding clarity.
7. Mobile-first: check the layout at 375px width before anything wider.
   Use the existing sm:/md:/lg: breakpoint pattern already used across
   the codebase.
8. Show me the actual before/after — if you're changing an existing page,
   tell me specifically what changed and why, in plain language, not just
   a diff.

Reference examples of "good" already in this codebase: frontend/src/utils/api.js
(for how defensive/production-minded our code already is), Modal.js and
Button.js (for the component API pattern to follow), and DevPulse.js (for how
data-dense screens are currently laid out with cards + charts).

Ask me one clarifying question only if something is genuinely ambiguous —
otherwise make a reasonable choice consistent with the design system and note
the assumption.
```

---

## Part 2: Reference Spec — What Already Exists (don't reinvent this)

### Design Philosophy
Alumnex Connect's visual identity is **glassmorphic, theme-adaptive, and data-forward** — it's a platform where people browse dense information (profiles, job listings, coding stats, mentorship matches), so clarity and hierarchy matter more than decoration. The existing aesthetic leans modern-SaaS (think Linear, Notion, Vercel dashboard) rather than playful-consumer (not Duolingo-style illustration-heavy).

**Keep:** glassmorphism on cards/nav, fluid typography, CSS-variable theming, dark mode as a first-class citizen (not an afterthought).
**Avoid:** flat corporate-template look (generic blue gradients, stock illustration people, default Bootstrap spacing), and avoid over-animating — the platform handles real tasks (job applications, mentorship requests), so motion should clarify state changes, not perform.

### Color System
Colors are **not hardcoded hex** — they're CSS custom properties consumed through Tailwind:
```
--color-primary-50 through --color-primary-900   (defined per-theme in index.css)
```
Tailwind maps these via `rgb(var(--color-primary-500) / <alpha-value>)`, so `bg-primary-600`, `text-primary-500`, `border-primary-200` etc. all resolve correctly under every active theme automatically. `secondary` colors are currently hardcoded Tailwind slate values (`#f8fafc` → `#475569`) rather than theme-variable — when adding new UI, prefer `primary`/`gray` theme-aware tokens for anything that should shift per-theme, and reserve hardcoded `secondary` slate only for genuinely neutral chrome that shouldn't change across themes.

**Seven themes exist**, toggled via a class on `<html>`:
`theme-minimalist-light`, `theme-minimalist-dark`, `theme-cyber-neon`, `theme-heroui-light`, `theme-heroui-dark`, `theme-designcode-light`, `theme-designcode-dark` — plus the base light/dark toggle. New UI must be tested (or at least reasoned about) against more than one theme, not just the default.

**Contrast rule:** in light mode, do not use `text-gray-400` for body text or metadata — it fails WCAG AA (≈2.8:1 against white). Use `text-gray-500` or `text-gray-600` for secondary text in light mode; reserve `text-gray-400` for `dark:` contexts or purely decorative icon glyphs.

### Typography
- Font: **Outfit** (variable font, weights 300–800).
- Base size is **fluid**, not fixed: `clamp(12px, 0.8vw + 8px, 18px)` — this scales smoothly across viewport width rather than jumping at breakpoints. Preserve this pattern for any new base-level type changes; don't reintroduce fixed `16px` roots.
- Scale in use: `text-7xl` (hero) → `text-4xl`/`2xl`/`xl` (section headers) → `text-sm`/`base`/`lg` (body). Use this scale; don't invent intermediate sizes like `text-[22px]`.

### Spacing & Layout
- Tailwind's default spacing scale, consistently applied — no arbitrary pixel values (`p-[13px]`) unless matching a genuinely fixed external constraint (e.g. an icon's exact box size).
- Responsive breakpoints: `sm:` / `md:` / `lg:` used consistently; design mobile-first (base classes = mobile, breakpoint prefixes = larger).

### Component Library (`frontend/src/components/ui/`)
| Component | Status | Pattern to follow for new ones |
|---|---|---|
| `Button.js` | Exists — variant (`primary`/`secondary`/`ghost`/`danger`) + size props, `forwardRef`, built-in loading state, focus ring | Use as the template for any new interactive primitive |
| `Modal.js` | Exists — `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, Escape-to-close, labeled close button | Use as the template for any overlay/drawer/popover |
| `Skeleton.js` | Exists — has `role`/`aria-busy` | Use for all loading states; don't add ad hoc spinners |
| `EmptyState.js` | Exists — has `aria-label` | Use for all "no data" states instead of a blank div |
| `ScrollReveal.js` | Exists | Use for on-scroll entrance animation instead of hand-rolled `IntersectionObserver` code |

**Known gap (as of this writing):** most pages still hand-roll button markup (`className="bg-primary-600 hover:bg-primary-700 ..."`) instead of importing `Button`. When touching any page that has this pattern, migrate it to the shared component as part of the change rather than adding another copy of the inline style.

**Missing primitives worth building if a task needs them:** `Input` (text/select/textarea with built-in label + error-message wiring to `aria-invalid`/`aria-describedby`), `Card`, `Badge`/`Tag`, `Toast`/notification banner, `Tooltip`. Build these once, in the same folder, following the `Button.js` API pattern — don't inline a one-off version inside a page component.

### Motion
`framer-motion` is already a dependency. Use it for:
- Page-level enter/exit fades on route change
- Modal/drawer enter-exit (scale + fade, not slide-from-nowhere)
- List stagger on initial load (job cards, forum posts, profile grids)

Avoid: motion on every hover, parallax effects, or anything that delays perceived interactivity — this is a utility platform, not a marketing site.

### Accessibility Baseline (currently a known gap — treat as a requirement, not a nice-to-have)
- Every icon-only button needs `aria-label`.
- Every modal/dialog needs `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and a focus trap (see `Modal.js` for the reference implementation already in the codebase).
- Every form field with validation needs `aria-invalid` and `aria-describedby` pointing to the error message element, not just a red border.
- Every nav item needs `aria-current="page"` when active.
- Run new UI work through `eslint-plugin-jsx-a11y` if it's added to the project, or manually check against the four rules above at minimum.

### Dark Mode
Handled two ways in the current codebase — know both:
1. Tailwind's `dark:` variant on individual classes (the default, preferred approach for new code).
2. A small set of global override rules in `index.css` (`.dark .bg-red-50`, `.dark .bg-green-50`, etc.) for cases where a third-party or dynamically-generated class can't easily carry a `dark:` prefix. Only add to this second pattern if you hit that exact situation — default to `dark:` variants otherwise.

### What "production-grade UI" means for this specific project
Given Alumnex Connect is a real platform handling job applications, mentorship matching, and identity-verified profiles — not a marketing site — "awesome UI" here specifically means:
- **Every state is designed**, not just the happy path: loading, empty, error, and success states for every data-fetching screen.
- **Information density is handled with hierarchy**, not just more whitespace — profile pages, DevPulse stats, and job listings are inherently data-dense; the job of good design here is organizing that density (cards, tabs, progressive disclosure) rather than hiding it.
- **Trust signals are visually reinforced** — verified badges, approval-status indicators, and rating/reputation numbers (from DevPulse, mentorship reviews, job postings) should be visually distinct and consistent across every page they appear on, since this is an identity-and-credibility platform.
- **Consistency across 38 pages** matters more than any single page being individually clever — a new AI-generated page should look like it was built by the same team as the other 37, not like a new design language got introduced.

---

## Quick Checklist for Any New UI Work

- [ ] Read this doc before writing code
- [ ] Reused existing `Button`/`Modal`/`Skeleton`/`EmptyState` instead of new inline versions
- [ ] Used theme-variable color classes (`primary-*`), not hardcoded hex
- [ ] Checked contrast in light mode (no unscoped `text-gray-400` on body text)
- [ ] Added `dark:` variants
- [ ] Designed loading, empty, and error states — not just the happy path
- [ ] Added ARIA attributes (labels, dialog roles, invalid/describedby, aria-current)
- [ ] Mobile-first, checked at 375px
- [ ] Motion used purposefully via framer-motion, not decoratively
- [ ] Visually consistent with the rest of the app, not a new one-off style
