# ASTRA: Indian roots, modern conversations

## Visual direction

Modern Indian wellness, not an antique astrology portal. Indigo gives the product depth; saffron and peach provide warmth; crisp white and cool-tinted surfaces make the task screens feel current. Purposeful linear gradients belong on hero regions, selected actions, workspace navigation and summary areas, not every card. Never use gradients as text fills.

The homepage retains its question-to-conversation story, but replaces the generic landscape opening with an original North Indian-style kundli illustration. It is visibly labeled illustrative, never calculated or personal. Warm geometric light and a single restrained chart entrance supply energy without constant animation. A thin saffron ribbon under the hero carries topic chips and short illustrative quotes; it pauses on hover or focus and does not sit on the kundli.

## Typography and shared components

Manrope is the primary face for headings, controls and body copy. Headings use 750 weight and tight, readable tracking; Gloock is reserved for the ASTRA wordmark through `--font-brand`. `--font-display` aliases Manrope for compatible existing components.

Use clear white advisor surfaces, generous profile images, 13px primary-action corners, quiet 1px boundaries and subtle offset shadows. Active selections are indigo with white text; workspace navigation uses a warm saffron active treatment. Body text remains at least AA contrast.

## Tokens

Canonical definitions are in `src/app/globals.css`.

| Role            | Value     |
| --------------- | --------- |
| Indigo          | `#202657` |
| Night           | `#111638` |
| Soft indigo     | `#343e80` |
| Accent          | `#4b55b5` |
| Saffron         | `#bb631b` |
| Light saffron   | `#ffd391` |
| Peach           | `#ffd5b8` |
| Canvas          | `#f7f8fc` |
| Paper           | `#ffffff` |
| Ink             | `#1d2442` |
| Supporting text | `#5d657a` |
| Border          | `#e0e5ef` |

Shared gradients: `--gradient-night` for light-on-dark regions; `--gradient-warm` for dark-on-warm regions; `--gradient-surface` for subtly tinted light sections.

## Indian context and engagement

Indian context is functional, not costume. Homepage language choices derive from current guide profiles; tradition links combine specialty and language filters. Unavailable combinations show an explicit no-match message rather than a dead link. The directory accepts removable `search`, `specialty` and `language` query filters and retains them across reloads.

Topics include career transitions, competitive exams, marriage conversations and family expectations without stereotyping or promising outcomes. Vedic astrology, tarot, numerology and Vastu are distinct approaches, not equivalent claims of scientific accuracy. Language selection describes fictional guide profiles; it does not promise translated UI or operational live service.

## Surface families

- Homepage: indigo/saffron hero, interactive questions, language/tradition exploration, human guides, accessible consultation preview and a warm ending.
- Directory: gradient introduction, crisp filter panel, strong search and white profile cards.
- Profile, booking and auth: modern gradient summaries and clear white forms. Duration, schedule, price and consent remain unambiguous.
- Client and astrologer workspaces: gradient indigo sidebar, white working surfaces, legible metrics and restrained colored summaries.
- Consultation: dark stage, clear simulated call controls, white chat and an accessible mobile sheet.
- Architecture: contemporary layer cards with the implemented/proposed distinction preserved.

The homepage chapter navigation uses an indigo gradient journey bar, saffron icon medallions and numbered landmarks. Warm hover/focus surfaces emphasize clickable destinations without pretending a chapter is selected. Keep the native section anchors, four-column desktop layout and compact two-column phone layout; decorative icons and numbers stay out of link names.

## Integrity and accessibility

All assets and fonts remain local. No new remote asset dependency is introduced; the kundli is original SVG. Illustrative profiles, verification, reviews and simulated services stay explicitly qualified.

Keyboard focus, dialog escape/restore, arrow-key calendars, pressed-state topics and roving-tabindex consultation tabs remain mandatory. Selection foreground/background changes are atomic so transitions never temporarily destroy contrast. Reduced motion disables the chart entrance and the voice ribbon marquee. Native scrolling stays intact.

Validate all routes at 375, 390, 430, 768, 1024 and 1440px, eagerly decode all images, and cover desktop/mobile journeys and accessibility. Keep visual review bounded to a batched review and one confirmation.

## Compact phone journey

At 600px and below, the homepage is a concise decision path rather than the desktop story stacked vertically. Keep its default document height at or below 4800px for the seeded demo at 375/390/430px widths; the hero stays below 650px and guide discovery starts within 2100px.

Open with a luminous kundli stage and overlapping question card, then the offer, primary action, and a compact moving ribbon of topics and illustrative voices. Keep compact profile rows with rating/price/profile links, and short consultation step selectors with one active preview. All four featured guides and language/tradition links remain available. Secondary approach descriptions and three additional testimonials expand on request through labeled buttons with expanded state; desktop keeps the full content visible. Never shrink touch targets or clamp essential booking information to meet the height budget.
