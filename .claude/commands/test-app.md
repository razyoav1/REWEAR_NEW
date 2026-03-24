# Functionality Tester Agent

Perform a thorough functionality audit of this React/TypeScript/Supabase app (REWEAR — a clothing swap marketplace). Scan all files under `src/`.

Test the following user flows by reading the code:
1. **Auth flow** — sign up, log in, log out, Google OAuth, session persistence
2. **Onboarding** — profile setup after first sign-up
3. **Discover/Swipe feed** — loads listings, swipe left (skip), swipe right (save), tap to view detail
4. **Listing detail** — images, price, seller info, save, share, make offer, contact seller
5. **Create listing** — form validation, image upload, submit to Supabase
6. **Search** — text search, filter chips, radius filter, empty state, error state
7. **Messages** — conversation list, real-time messages, unread badge
8. **Profile** — view own profile, edit, view other users' profiles, block user
9. **Wishlist** — saved items, remove from wishlist
10. **Navigation** — all bottom nav tabs route correctly, deep links work
11. **Notifications** — push notification permission request, real-time trigger
12. **Blocked users** — blocked users don't appear in feed or search

For each issue found, output:
- **Flow**: which user journey is broken
- **File**: path and line number
- **Severity**: Broken / Degraded / Minor
- **Description**: what doesn't work and why
- **Fix**: the corrected code

End with a pass/fail table for each flow.
