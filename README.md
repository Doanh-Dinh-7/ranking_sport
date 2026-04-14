# Football Tournament 2026 — Tournament Platform

A lightweight, simplified football tournament management platform built with Next.js and Supabase. Perfect for small-scale tournaments (< 16 teams, 1 season, 1 admin).

## Quick Start

### 1. Set Up Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the Supabase dashboard, go to **SQL Editor**
3. Create a new query and run the SQL scripts in this order:
   - Copy the contents of `scripts/001-tournament-schema.sql` and run it
   - Copy the contents of `scripts/002-trigger-standings.sql` and run it
   - Copy the contents of `scripts/003-seed-data.sql` and run it (this adds demo data)

### 2. Get Your Supabase Credentials

1. In your Supabase project, go to **Settings → API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon (public) key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Set Environment Variables

Add these to your `.env.local` file (or through v0 Settings → Vars):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
```

Replace the credentials with your actual Supabase values and set a strong admin password.

### 3b. Logo, banner, and home awards block (optional)

These keys live in `.env` or `.env.local` (see `.env.example`). Values are read in [`lib/tournament.ts`](lib/tournament.ts) on the client, so they **must** use the `NEXT_PUBLIC_` prefix.

| Environment variable | Purpose | Where it is used (summary) |
|----------------------|---------|----------------------------|
| `NEXT_PUBLIC_TOURNAMENT_LOGO_URL` | Tournament logo image | Home (logo on banner), navbar, admin layout, admin login; `app/layout.tsx` (favicon / Apple touch icon) |
| `NEXT_PUBLIC_TOURNAMENT_BANNER_URL` | Large home hero banner | `app/page.tsx` |
| `NEXT_PUBLIC_HOME_CHAMPION_IMAGE_URL` | Champion spotlight (wide image) | `app/page.tsx` — only when `NEXT_PUBLIC_IS_SHOW_AWARD` is enabled |
| `NEXT_PUBLIC_HOME_AWARD_BEST_GOALKEEPER_IMAGE_URL` | Best goalkeeper of the tournament | Same home spotlight section |
| `NEXT_PUBLIC_HOME_AWARD_BEST_PLAYER_IMAGE_URL` | Player of the tournament | Same spotlight section |
| `NEXT_PUBLIC_HOME_AWARD_TOP_SCORER_IMAGE_URL` | Top scorer | Same spotlight section |
| `NEXT_PUBLIC_IS_SHOW_AWARD` | Show or hide the **entire** champion + three individual awards block | Set to `true` (case-insensitive) to show; empty or any other value hides it |

**Notes:**

- If a URL variable is **empty**, the app uses the **fallback** in `lib/tournament.ts` (`DEFAULT_URLS`, typically `/placeholder.svg`).
- Values may be absolute URLs (`https://...`) or static paths under `public` (e.g. `/placeholder-logo.png`).
- After changing env vars, **restart** `pnpm dev`. On Vercel: add variables under **Settings → Environment Variables**, then **Redeploy**.

Example (media-only; merge into your env file):

```env
NEXT_PUBLIC_TOURNAMENT_LOGO_URL=https://example.com/logo.jpg
NEXT_PUBLIC_TOURNAMENT_BANNER_URL=https://example.com/banner.jpg
NEXT_PUBLIC_HOME_CHAMPION_IMAGE_URL=https://example.com/champion.jpg
NEXT_PUBLIC_HOME_AWARD_BEST_GOALKEEPER_IMAGE_URL=https://example.com/gk.jpg
NEXT_PUBLIC_HOME_AWARD_BEST_PLAYER_IMAGE_URL=https://example.com/mvp.jpg
NEXT_PUBLIC_HOME_AWARD_TOP_SCORER_IMAGE_URL=https://example.com/scorer.jpg
NEXT_PUBLIC_IS_SHOW_AWARD=true
```

### 4. Run the Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to see the public dashboard.

## Architecture Overview

### Database Schema (5 Tables)

- **teams**: Team information (name, short name, logo, group)
- **matches**: Match fixtures (home team, away team, score, status, venue, scheduled date)
- **standings**: Auto-calculated league table (updated via PostgreSQL trigger)
- **venues**: Match venues (name, address, coordinates for map)
- **match_events**: Goals, cards, and other match events

### Key Feature: Auto-Standings Update

When the admin enters a match result, a **PostgreSQL trigger** automatically:
1. Fetches the two teams involved
2. Calculates wins/draws/losses and goals
3. Updates the standings table
4. No backend code needed — it happens in the database

### Public Pages (No Auth Required)

- **Dashboard** (`/`) — Latest result, next match, tournament stats
- **Standings** (`/standings`) — Filterable by group (A, B, etc.)
- **Fixtures** (`/fixtures`) — All upcoming and past matches
- **Match Detail** (`/matches/[id]`) — Goals, events, venue details
- **Venues** (`/venues`) — All stadium locations

### Admin Panel (Single Login)

- **Login** (`/admin/login`) — Simple username/password
- **Dashboard** (`/admin`) — Enter match results, view stats, trigger standings update

All admin credentials are stored in environment variables (no database auth needed).

## API Routes

### Public Endpoints

- `GET /api/teams` — All teams
- `GET /api/standings` — League standings
- `GET /api/matches` — All matches
- `GET /api/matches/[id]` — Single match details
- `GET /api/venues` — All venues

### Admin Endpoints (Requires Cookie Auth)

- `POST /api/auth/admin` — Admin login
- `POST /api/admin/match` — Update match result (triggers standings update)
- `GET /api/admin/verify` — Check if admin session is valid
- `POST /api/auth/logout` — Logout

## Customization

### Edit Admin Credentials

Update in `.env.local`:
```env
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_password
```

### Add/Edit Teams

1. Go to Supabase SQL Editor
2. Run:
```sql
INSERT INTO teams (name, short_name, logo_url, group_name)
VALUES ('Your Team Name', 'CODE', 'https://...', 'A');
```

### Add/Edit Matches

1. Go to Supabase SQL Editor
2. Run:
```sql
INSERT INTO matches (home_team_id, away_team_id, venue_id, scheduled_at, stage, status)
VALUES ('team1_id', 'team2_id', 'venue_id', '2026-04-02 19:00', 'group', 'scheduled');
```

### Styling

All styling uses Tailwind CSS v4 with shadcn/ui components. Dark theme is built-in with the following color tokens:

- **Primary**: Blue (navy) for headings and primary actions
- **Accent**: Gold/orange for highlights
- **Neutral**: Dark grays and blacks

Modify color tokens in `app/globals.css` under the `@theme` section.

## Pre-push checklist

Before pushing to the remote (or opening a PR), run these in order:

1. **Lint** — no ESLint errors:
   ```bash
   pnpm lint
   ```
   (or `npm run lint` if you use npm)

2. **Production build** — confirm Next.js compiles like production:
   ```bash
   pnpm build
   ```
   See [Production build](#production-build) below.

3. **Environment variables** — do not commit `.env`, `.env.local`, or secrets; configure the same keys on CI or Vercel (`NEXT_PUBLIC_SUPABASE_*`, `ADMIN_*`, and optionally the media keys from **3b**).

4. **Smoke test** — open main pages (home, standings, fixtures, match detail) if you changed UI or APIs.

## Production build

Optimized production build (type checks, bundle, etc.):

```bash
pnpm install
pnpm build
```

- On success: `.next` is created with no errors in the log.
- After building, run the production server locally:
  ```bash
  pnpm start
  ```
  Default: `http://localhost:3000` (similar to Vercel after deploy).

**Note:** `pnpm dev` is for development; run `pnpm build` before merging or pushing large changes.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repo in [Vercel](https://vercel.com)
3. Add environment variables in **Settings → Environment Variables** (Supabase, admin, and optional `NEXT_PUBLIC_*` keys for logo/banner/spotlight — see **3b** above)
4. Deploy!

The app will be live at `https://your-project.vercel.app`

## Troubleshooting

### "Supabase connection failed"

- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Verify the database tables exist by checking Supabase SQL Editor

### "Admin login not working"

- Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set in environment
- Try clearing browser cookies and logging in again

### "Standings not updating"

- Check that the trigger was created successfully in Supabase
- Go to **Functions** in Supabase to see if there are errors
- Manually check the `standings` table to see if it was updated

### Logo/banner or awards block wrong / not visible

- The champion + individual awards block only shows when `NEXT_PUBLIC_IS_SHOW_AWARD=true`.
- Image URLs must use the `NEXT_PUBLIC_` prefix and the **exact variable names** from the table in **3b**.
- After editing env, restart the dev server or redeploy production.
- If a variable is empty, the app uses placeholders from `lib/tournament.ts`.

## File Structure

```
/vercel/share/v0-project/
├── app/
│   ├── api/                    # API routes
│   ├── admin/                  # Admin pages (login, dashboard)
│   ├── (public pages)          # Dashboard, standings, fixtures, etc.
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home/dashboard
├── components/
│   ├── navbar.tsx              # Navigation bar
│   ├── match-card.tsx          # Match display card
│   ├── standings-table.tsx     # Standings table
│   ├── team-badge.tsx          # Team logo/badge
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── supabase.ts             # Supabase client & types
│   ├── tournament.ts           # Tournament name + image URLs from NEXT_PUBLIC_*
│   └── auth.ts                 # Admin auth helpers
├── scripts/
│   ├── 001-tournament-schema.sql
│   ├── 002-trigger-standings.sql
│   └── 003-seed-data.sql
└── SETUP.md                    # Detailed setup guide
```

## Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Auth**: Simple cookie-based session (admin only)

## Notes

- All public pages are static and cached for performance
- Admin session is stored as an HTTP-only cookie
- The standings table is read-only (managed by triggers)
- No email or notifications system — this is a simple, focused platform

## Support

For issues with Supabase, check [their docs](https://supabase.com/docs).
For issues with Next.js, check [their docs](https://nextjs.org/docs).

---

**Built with v0 × Vercel**
