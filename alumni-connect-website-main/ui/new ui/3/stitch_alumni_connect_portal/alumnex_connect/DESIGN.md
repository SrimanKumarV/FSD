---
name: Alumnex Connect
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#dc2626'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
  alumni-magenta: '#c026d3'
  student-cyan: '#0ea5e9'
  success: '#16a34a'
  warning: '#d97706'
  glass-light: rgba(255, 255, 255, 0.80)
  glass-dark: rgba(31, 41, 55, 0.60)
typography:
  display-2xl:
    fontFamily: Outfit
    fontSize: 4.5rem
    fontWeight: '800'
    lineHeight: '1'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Outfit
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 1.875rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.015em
  title-lg:
    fontFamily: Outfit
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-base:
    fontFamily: Outfit
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-bold:
    fontFamily: Outfit
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Outfit
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  caption-xs:
    fontFamily: Outfit
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.02em
  code-mono:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  gutter: 1rem
  margin-mobile: 1rem
  margin-desktop: 2rem
---

## Brand & Style

The design system for this platform is built on a **Glassmorphic, Theme-Adaptive, and Data-Forward** philosophy. It is designed to serve a professional ecosystem of university alumni and students, balancing high-density information architecture with the visual lightness of modern SaaS tools like Linear or Vercel.

The aesthetic utilizes semi-transparent backdrop-filtered acrylic layers, hairline borders, and subtle radial mesh gradients to create depth. It prioritizes clarity and hierarchy over pure decoration, ensuring that complex data—such as developer telemetry and mentorship matching—remains accessible and scannable. The system is fundamentally adaptive, supporting seven distinct themes while maintaining a consistent structural "DNA."

## Colors

The color architecture is dynamic and tokenized. Colors are defined as CSS custom properties (`--color-primary-50` through `--color-primary-900`) to allow for runtime theme switching.

- **Primary (Cobalt Blue):** Used for primary actions, active indicators, and focal points.
- **Secondary (Slate):** Reserved for neutral chrome and secondary interface elements that do not change significantly across themes.
- **Named Accents:** `alumni-magenta` is strictly for verified alumni/mentor identities, while `student-cyan` identifies mentees and peer contributors.
- **Contrast & Accessibility:** Avoid using `text-gray-400` for body text in light mode (it fails WCAG AA); use `text-gray-600` instead. Reserve lighter grays for decorative icons or dark mode metadata.

## Typography

This design system uses a fluid typography scale. The root font size is calculated dynamically: `clamp(12px, 0.8vw + 8px, 18px)`. This ensures that all `rem`-based measurements scale proportionally with the viewport width.

- **Main Font:** **Outfit** is used for all display, heading, and body copy. It provides a contemporary, geometric feel that remains friendly and readable.
- **Mono Font:** **JetBrains Mono** is used exclusively for technical telemetry (git metrics, programming ratings) and command-line interfaces to maintain a "developer-first" feel for DevPulse stats.

## Layout & Spacing

The layout follows a fluid 12-column grid system with content-aware containers (`max-w-7xl`). 

- **Grid Strategy:** Use standard Tailwind responsive breakpoints (`sm:`, `md:`, `lg:`) with a mobile-first approach. 
- **Rhythm:** Spacing follows a 4px base unit, moving through a rhythmic scale of 8px, 16px, 24px, and 32px.
- **Handling Density:** For data-dense screens, use grid gaps of `1.5rem` (gap-6) and avoid excessive whitespace that would force unnecessary scrolling. Organize complex telemetry into modular cards or tabbed panels.

## Elevation & Depth

Visual hierarchy is established primarily through **Glassmorphic Tonal Layers** and **Low-contrast Outlines**:

- **Glassmorphism:** Use `backdrop-blur-md` or `backdrop-blur-lg` on elevated surfaces like cards, navigation bars, and modals. Combine this with a semi-transparent background (`white/80` or `gray-800/60`).
- **Hairline Borders:** Surfaces should be defined by subtle borders (`border-white/50` for light mode, `border-gray-700/50` for dark mode) rather than heavy shadows.
- **Ambient Depth:** Use low-opacity primary-tinted shadows (`shadow-primary-500/30`) only for interactive hover states or primary action buttons to denote focus and interactivity.

## Shapes

The design system uses a "Rounded" shape language to complement the geometric nature of the Outfit font.

- **Standard Elements:** Use `rounded-xl` (12px) for buttons, small cards, and input fields.
- **Container Surfaces:** Larger cards and modals use `rounded-2xl` (16px) or `rounded-3xl` (24px) for a more substantial, modern feel.
- **Avatars & Chips:** Use `rounded-full` for user profile photos and status indicators.
- **Theme Variations:** Note that specific themes like "HeroUI" may override these to higher roundedness (up to 32px) to achieve a more "pill-shaped" aesthetic.

## Components

### Buttons
Buttons use `rounded-xl` and require integrated loading states (spinner icons). Primary buttons use high-contrast primary colors with an ambient primary-tinted glow on hover. Ghost variants should be used for secondary actions like "Profile Preview."

### Cards & Inputs
The `.glass-card` and `.glass-input` classes are central. They feature semi-transparent backgrounds and backdrop blurs. Inputs should transition to a solid background and `ring-2` on focus. Cards in lists should have a subtle upward translation on hover (`-translate-y-0.5`).

### Accessibility
All components must include baseline accessibility:
- **Icon Buttons:** Require `aria-label`.
- **Form Fields:** Must use `aria-invalid` and `aria-describedby` when errors are present.
- **Modals:** Must implement focus trapping and `role="dialog"`.
- **Loading:** Use `Skeleton` components with `aria-busy="true"` instead of ad-hoc spinners.

### Status Indicators
Use high-contrast chips for verification status. Verified alumni badges must use the brand-specific `alumni-magenta` color to maintain identity consistency across the platform.