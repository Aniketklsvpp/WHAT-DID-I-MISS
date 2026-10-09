---
name: CatchUp Neo-Brutalist System
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#006d36'
  on-secondary: '#ffffff'
  secondary-container: '#6dfe9c'
  on-secondary-container: '#007439'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#211b00'
  on-tertiary-container: '#988300'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#6dfe9c'
  secondary-fixed-dim: '#4de082'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005227'
  tertiary-fixed: '#ffe24c'
  tertiary-fixed-dim: '#e2c62d'
  on-tertiary-fixed: '#211b00'
  on-tertiary-fixed-variant: '#524600'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Anton
    fontSize: 84px
    fontWeight: '400'
    lineHeight: 84px
    letterSpacing: -0.01em
  headline-xl-mobile:
    fontFamily: Anton
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 50px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Anton
    fontSize: 56px
    fontWeight: '400'
    lineHeight: 60px
    letterSpacing: 0em
  headline-lg-mobile:
    fontFamily: Anton
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: 0em
  headline-md:
    fontFamily: Anton
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 36px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.06em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system serves a local-first, privacy-conscious AI summarizer built for chaotic group chats. It blends bold Neo-Brutalist functionalism with an energetic, playful pop sensibility to transform message overload into quick, delightful takeaways.

- **Brand Tone:** Unapologetic, witty, lightning-fast, and trustworthy.
- **Target Audience:** Digital natives, fast-moving communities, power group-chat participants, and privacy-minded communicators tired of wall-of-text fatigue.
- **Design Movement:** Neo-Brutalism infused with Pop Cartoon Minimalism. High contrast ink-black borders, massive condensed typography, sharp drop offsets, paired alongside soft candy-pastel container fills, rounded edges, and pill navigation tags.

## Colors

The palette relies on an uncompromising, high-impact binary foundation of stark white canvas (`#FFFFFF`) and ink-black strokes (`#000000`), brought to life with vibrant pastel accents that categorize chat topics, sentiment, and summary cards.

### Core Foundation
- **Surface Canvas:** `#FFFFFF` — clean, crisp, stark canvas background.
- **Border & Ink Base:** `#000000` — dense deep-black lines, strokes, and typographic hierarchy.

### Functional Pastel Accents
- **Mint Emerald (Secondary):** `#4ADE80` (accent `#6EE7B7`) — Key takeaways, positive decisions, unread counters, and high-priority action items.
- **Butter Yellow (Tertiary / Mascot):** `#FDE047` (highlight `#FEF08A`) — Attention grabbers, notifications, playful mascot accents, and pinned TL;DR highlights.
- **Electric Lavender:** `#D8B4FE` (soft `#E9D5FF`) — Secondary chat threads, banter digests, and context containers.
- **Melon Peach:** `#FED7AA` (soft `#FECDD3`) — Urgent mentions, links, media previews, and date markers.

### Contrast Rules
- Colored surfaces always host solid `#000000` body copy or heavy black stroke icons.
- Solid `#000000` buttons always host `#FFFFFF` text.
- Never use mid-gray text for critical data; use opacity levels of black (`rgba(0,0,0,0.7)`) to preserve raw ink aesthetic.

## Typography

Typography establishes an editorial, poster-like tension between two contrasting extremes:

1. **The Display Voice (`Anton`):** Heavy, condensed, bold uppercase display type. When deployed on hero statements, slogans, or key section anchors, headlines must be typeset in all-caps and styled with a sharp forward slant (`font-style: italic`), mimicking comic print titles and urgent tabloid callouts.
2. **The Readability Voice (`Plus Jakarta Sans`):** Generous, rounded, humanist grotesque clarity. Handles dense WhatsApp thread extracts, quote blocks, AI summary digest points, and metadata with clean legibility.
3. **The Mechanical Label (`Space Grotesk`):** Fixed-width-inspired sans for buttons, chip tags, filter toggles, timestamps, and metadata pill trackers. Always typeset in full uppercase.

## Layout & Spacing

The layout is built on a responsive 12-column grid for desktop/tablet screens, collapsing into a 4-column stack on mobile viewports.

- **Canvas Philosophy:** Open white space juxtaposed against intentionally crowded, tactile card clusters. Summary cards should intentionally break rigid grid alignments through subtle rotational offsets and vertical layering.
- **Rhythm & Grid Alignment:** Gutters stay generous (`1.5rem` / `24px`) to preserve structural clarity around cards with heavy black stroke borders. Section margins scale down from wide desktop edges (`3rem`) to tight mobile rails (`1.25rem`).
- **Overlapping Deck System:** Summary insights and chat snippet cards do not simply stack vertically; they stagger horizontally and overlap by `-1rem` to `-2rem` on wide screens, creating an analog deck-of-cards aesthetic.

## Elevation & Depth

This system avoids blurred or soft ambient drop shadows entirely. All depth is structural, tactile, and graphic:

- **Border Hierarchy:** All structural panels, buttons, cards, and input fields carry a uniform, uncompromising stroke: `2.5px solid #000000` (or `3px solid #000000` on larger desktop containers).
- **Hard Offset Shadow:** Elevation is communicated solely through crisp, unblurred drop shadows: `box-shadow: 4px 4px 0px #000000` (or `6px 6px 0px #000000` on floating modals and active card decks).
- **Interactive Depth:** When interactive elements (buttons, clickable cards, tags) are hovered or active, the offset shadow compresses (e.g., from `4px 4px` to `0px 0px` with a matching `translate(4px, 4px)`), giving physical tactile feedback.
- **Rotational Dynamics:** Flat visual rhythm is broken by applying persistent micro-rotations: `-2deg` to `+3deg` to stacked testimonial and summary cards, reinforced by z-index stepping.

## Shapes

The shape system pairs pill-shaped buttons and navigation chips with generously rounded, organic structural containers:

- **Buttons, Badges & Chips:** Fully pill-shaped (`border-radius: 9999px`) bound by solid `2.5px` black borders.
- **Cards & Summary Panels:** Built with deep, friendly corners (`border-radius: 28px` to `32px`), softening the aggressive weight of black borders.
- **Mascot & Avatars:** Circular geometries with bold black contour outlines. Mascot accessories or facial elements follow comic line weights.

## Components

### Buttons
- **Primary Action:** Solid black background (`#000000`), white uppercase text (`Space Grotesk` or `Plus Jakarta Sans`, 700 weight), pill shape (`rounded-full`), padded `12px 28px`. Includes an upward-slanted arrow icon (`↗`) or action chevron. On hover: shifts down-right with reverse black border outline.
- **Secondary / Chip Button:** White surface (`#FFFFFF`) with `2.5px solid #000000` border, black label text in all-caps, pill shape. On hover: fills with light Butter Yellow (`#FEF08A`) or Mint Green (`#6EE7B7`).
- **Icon / Utility Button:** Perfect circle (`48px x 48px`), `2.5px solid #000000`, containing stark black geometric glyphs (e.g., `+`, `×`, search).

### Summary & Digest Cards
- Generously rounded corners (`28px`), encased in `2.5px` or `3px solid #000000`.
- Solid background fills from the pastel family: Mint Green (`#4ADE80`), Lavender (`#D8B4FE`), or Warm Yellow (`#FDE047`).
- Content is arranged with clear typographic hierarchy: huge italic Anton lead-ins, readable Plus Jakarta Sans message quotes, and bottom metadata labels (e.g., "ANDROID USER • 14:02 PM") pinned at the bottom left.
- Layered layout support: cards support `-2deg` or `+2.5deg` tilt transforms to simulate physical paper notes pinned together.

### Chips & Filter Tags
- Pill-shaped tags (`rounded-full`) with `2px solid #000000` border, `6px 14px` padding, uppercase `Space Grotesk` label font.
- State variation: Inactive chips stay `#FFFFFF`; active chips turn to solid color fill with offset drop shadow `2px 2px 0px #000000`.

### Form Inputs & Text Fields
- Clean white field with `2.5px solid #000000` border, rounded `16px` to `20px`.
- High-contrast black placeholder text at 60% opacity.
- Focus state: Hard offset shadow `3px 3px 0px #000000`, no blurred blue halo or soft ring.

### Chat Quote Callouts & Pill Counters
- WhatsApp message references are framed inside miniature white pill balloons nested inside pastel cards, bordered with `1.5px solid #000000`.
- Pill counters (e.g., "342 MESSAGES SKIPPED"): Solid yellow or coral pill with bold condensed lettering and black border.