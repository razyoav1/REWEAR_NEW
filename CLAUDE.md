# Rewear New — Project Context

## What this project is
A **brand-new version** of the Rewear secondhand clothing marketplace app.
Built from scratch to be better-looking and better-functioning than the original at `../Rewear`.

The original app (for reference) is at `C:\Users\yoavr\Desktop\VSProjects\Rewear`.

## Design direction chosen: Bold & Playful
- **Always dark mode** — background `#0a0a0a`
- **Primary accent:** Hot pink `#FF2D9E` → `hsl(328 100% 59%)`
- **Secondary accent:** Electric lime `#AAFF00` → `hsl(80 100% 50%)`
- **Font:** Space Grotesk (loaded via Google Fonts in index.html)
- **Feel:** Gen-Z, energetic, bold — like Depop meets streetwear

## Supabase project
- **URL:** `https://jddcaaasineiikfzhjel.supabase.co`
- **Anon key:** in `.env` as `VITE_SUPABASE_PUBLISHABLE_KEY`
- This is a SEPARATE project from the original Rewear Supabase (`xiltxycbdpjcjbnivfnb`)
- Migrations from the original project have NOT been applied yet — needs to be done

## Tech stack
- React 18 + TypeScript + Vite
- Tailwind CSS v3 + shadcn/ui (Radix UI)
- Framer Motion (animations)
- React Router v6 (routing)
- Supabase (auth + db + storage)
- React Query (data fetching)
- Sonner (toast notifications)
- Space Grotesk font

## Current status
The project scaffold is complete. All pages are stubbed out. Ready to build features.

### What's been built:
- Full routing structure (20+ pages + admin panel)
- Design system (CSS variables, Tailwind config, animations)
- App layout with animated bottom nav (Compass/Discover, Search, Heart/Saved, MessageCircle/Inbox, User/Me)
- Auth page (UI complete — needs Supabase tables)
- Onboarding page (3-step wizard — needs Supabase profiles table)
- All page stubs with correct layout/skeleton UI
- Core UI components: Button, Card, Input, Badge, Avatar, Skeleton, Separator, Label, Sonner

### What still needs to be built (in priority order):
1. Apply Supabase migrations (copy from `../Rewear/supabase/migrations/` to this project)
2. Auth flow — connect login/signup to Supabase
3. Discover page — swipe cards with real listings
4. Search page — listing grid with filters
5. Create listing flow
6. Listing detail page
7. Messages / chat
8. Profile page
9. Wishlist / collections
10. Admin panel

## Key file locations
- Design system: `src/index.css`, `tailwind.config.ts`
- Supabase client: `src/integrations/supabase/client.ts`
- Auth context: `src/contexts/AuthContext.tsx`
- Types: `src/types/index.ts`
- Utils: `src/lib/utils.ts`
- Layout: `src/components/layout/` (AppLayout.tsx, BottomNav.tsx)
- Pages: `src/pages/`
- UI components: `src/components/ui/`

## Running the project
Requires Node.js installed. Then:
```
npm install
npm run dev
```
Opens at http://localhost:5173

## User preferences
- User is new to local development (hasn't run the project locally before)
- Prefers being given options/choices before big decisions
- Building iteratively — suggest what to build next and let user choose
