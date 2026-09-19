# ASTRA

A responsive, local-first astrology consultation **pitch prototype**. Modern Indian-inspired indigo, saffron and purposeful gradients pair with a storytelling homepage and a complete discovery, booking, client, astrologer, consultation and feedback journey.

## Run locally

Requires Node.js 20.9+ and npm.

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. Development, production preview and browser tests share this canonical port. Run either development or production preview, not both against the same build directory.

```sh
npm run typecheck
npm run lint
npm run format
npm test
npm run build
npm run start
npm run test:e2e
```

`npm run format` writes Prettier changes. Use `npm run format:check` to verify formatting without writing files.

If Playwright reports a missing browser, run `npx playwright install chromium` before retrying its tests.

## Try the demo

Choose **Demo controls** to enter the client or astrologer workspace. Or explore the landing page, choose an astrologer, sign in with a fictional name/contact, and book a session. The demo client is Shivam; the demo astrologer is Ananya Sharma.

The homepage begins with **your question -> your guide -> your conversation -> your next chapter**. Choose a question topic, explore a tradition in your preferred consultation language, or try the keyboard-accessible four-step consultation preview. Language options derive from current fictional guide profiles and combine with specialty filters in the directory; they are not an interface-translation feature.

The complete flow is: discovery -> advisor profile -> duration/date/time -> review and mock payment -> booking confirmation -> client dashboard -> **Start demo now** -> simulated video and chat -> end consultation -> rating and feedback.

The astrologer can edit availability and profile details. Bookable slots derive from the same schedules and existing bookings; dashboards, sessions and feedback share one state model. The **Clients** navigation item opens a grouped view within `/astrologer/sessions?view=clients`.

Scheduled joining becomes available near the booking time. **Start demo now** is a presentation shortcut, not a reschedule: the original booked date and time are retained.

## Persistence and repeatability

Data stays in versioned local browser storage. Reloads preserve identities, schedules, bookings, profile edits, messages and feedback. Demo controls expose loading, empty, error and mock payment-failure scenarios.

Legacy sample portrait references are migrated on load without resetting saved edits or replacing custom portrait references. Birth details are private by default; clients must explicitly opt in before booked astrologers can view them.

**Reset demo** asks for confirmation and restores 10 fictional astrologers, 10 bookings (5 completed), 5 past sessions, 20 chat messages, 5 testimonials and at least 20 derived available start times. It removes only ASTRA-owned demo data.

Dates use `en-IN` formatting and `Asia/Kolkata` (IST), irrespective of the browser's timezone. A reset anchors the virtual demo clock at 9:00 AM on the current IST date; it advances while the app is open and is checkpointed locally. Reset before a new pitch for the same predictable starting experience.

## What is simulated

This is **not** a launched consultation service.

- Authentication and role guards are local UI simulation, not security boundaries.
- Payments never collect card details, contact a provider or transfer money.
- Video/device controls and screen sharing are illustrative; no camera or microphone permissions are requested.
- Chat messages, responses and read receipts are local and scripted, not remote communications.
- No email, SMS or push messages are sent.
- Advisors, ratings, testimonials, verification badges, earnings and historical counts are fictional demonstration content.
- Birth information is optional. Do not enter real sensitive personal information into this demonstration.
- Same-browser updates are coordinated for the demo; there is no distributed transaction or multi-device concurrency guarantee.
- Astrology is presented as personal reflection, not medical, legal or financial advice or a guarantee of outcomes.

`/tech-stack` explicitly distinguishes the implemented frontend/local adapters from the proposed PostgreSQL, authenticated API, AWS, video, payment and notification architecture.

## Implementation map

`src/app` contains App Router screens; `src/components` holds shared accessible UI and shells; `src/features` groups workflows; `src/types/domain.ts` is the shared contract; `src/lib` and `src/services` provide the local simulation and replaceable service boundaries. Tests cover state transitions, scheduling, interface behavior and browser journeys.

All 17 required route patterns, plus the Clients query view, are included in the browser matrix at 375, 390, 430, 768, 1024 and 1440 CSS pixels. Desktop and mobile consultation layouts include keyboard-accessible controls and a mobile chat sheet.

## Assets

The ASTRA wordmark, orbital drawings and interface are original for this prototype.

The active fonts are locally bundled **Manrope** (headings, controls and body) and **Gloock** (the wordmark), distributed under the SIL Open Font License. Font files and licenses are in `public/fonts/`. The earlier Bodoni Moda and Source Sans 3 assets remain bundled but are not loaded by the application.

The original kundli SVG in `src/components/kundli-art.tsx` is an illustrative twelve-house geometric drawing, not a generated birth chart or prediction. Previously used story photographs remain locally bundled: `public/story/dawn.jpg` uses `photo-1470252649378-9c29740c9fa8`, and `public/story/perspective.jpg` uses `photo-1464822759023-fed622ff2c3b` (Unsplash). No image or font needs a third-party request at runtime. Browser route coverage eagerly loads and decodes all images, including those below the fold, and fails on broken asset responses.

Local portrait photographs are illustrative stock from Unsplash, used under the [Unsplash License](https://unsplash.com/license). Depicted people are **not** represented as actual ASTRA astrologers or endorsers. Source image identifiers, in `public/portraits/1.jpg` through `10.jpg` order:

1. `photo-1580489944761-15a19d654956`
2. `photo-1506794778202-cad84cf45f1d`
3. `photo-1534528741775-53994a69daeb`
4. `photo-1500648767791-00dcc994a43e`
5. `photo-1551836022-d5d88e9218df`
6. `photo-1472099645785-5658abf4ff4e`
7. `photo-1551836022-4c4c79ecde51`
8. `photo-1519085360753-af0119f7cbe7`
9. `photo-1508214751196-bcfd4ca60f91`
10. `photo-1560250097-0b93528c311a`

Original image URLs use `https://images.unsplash.com/<identifier>`. Replace these sample assets, fictional identities and endorsements with consented production content before any launch.
