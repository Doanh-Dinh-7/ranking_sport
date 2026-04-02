# Deployment Guide

This guide covers deploying your Football Tournament Platform to Vercel and setting up Supabase.

## Prerequisites

- A Supabase account (free at [supabase.com](https://supabase.com))
- A Vercel account (free at [vercel.com](https://vercel.com))
- Your code pushed to GitHub (Vercel needs GitHub for deployments)

## Step 1: Set Up Supabase Database

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in the form:
   - **Name**: `football-tournament` (or your choice)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
4. Wait for the project to be ready (2-3 minutes)

### Run Database Migrations

Once your project is ready:

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `scripts/001-tournament-schema.sql` from this repo
4. Paste it into the SQL Editor
5. Click **Run**
6. Repeat steps 2-5 for `scripts/002-trigger-standings.sql`
7. Repeat steps 2-5 for `scripts/003-seed-data.sql` (this adds demo data)

You should see no errors. If you do, check:
- Each SQL script is complete (copy the entire file)
- You're running them in the correct order

### Get Your Credentials

1. In Supabase, go to **Settings** → **API** (left sidebar)
2. You'll see:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon (public) key**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Save these values — you'll need them next.

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. In your project directory:
```bash
vercel
```

3. Follow the prompts:
   - Link to your GitHub project
   - Select framework: **Next.js**
   - Choose root directory: **./** (current directory)
   - Build command: Use default
   - Output directory: Use default

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New...** → **Project**
3. Select your GitHub repository
4. Framework: **Next.js**
5. Continue to next step

### Add Environment Variables

After connecting your repo:

1. In the Vercel project settings, go to **Settings** → **Environment Variables**
2. Add these 4 variables:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
ADMIN_USERNAME=<your-username>
ADMIN_PASSWORD=<your-strong-password>
```

Replace the bracketed values with your actual Supabase credentials and admin password.

### Deploy

Once you've added environment variables:

1. Click **Deploy**
2. Wait 2-3 minutes for the build to complete
3. Your app is now live! Vercel will give you a URL like `https://football-tournament.vercel.app`

## Step 3: Verify Everything Works

Visit your deployed app:
1. Go to `https://your-app-url.vercel.app`
2. You should see the dashboard with tournament info
3. Check the **Standings** page
4. Click on a **Match** to see details
5. Go to `/admin/login` and log in with your credentials
6. Try entering a match result to test the admin functionality

## Troubleshooting

### "Supabase Connection Failed"

**Problem**: Dashboard shows empty data or error

**Solution**:
1. Check that `NEXT_PUBLIC_SUPABASE_URL` is correct (including `https://`)
2. Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
3. Verify the database tables exist:
   - Go to Supabase → **Table Editor**
   - You should see: `teams`, `matches`, `venues`, `standings`, `match_events`
4. Redeploy with correct environment variables

### "Admin Login Fails"

**Problem**: Can't log in to admin panel

**Solution**:
1. Check that `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set
2. Try clearing browser cookies: Open DevTools → Application → Cookies → Delete all
3. Try logging in again
4. If still failing, re-check the credentials in Vercel Settings

### "Build Failed"

**Problem**: Vercel build fails with an error

**Solution**:
1. Check Vercel build logs: Project → **Deployments** → Click the failed deploy → **Build Logs**
2. Common issues:
   - Missing environment variables (check Settings → Environment Variables)
   - Typo in `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Fix the issue and redeploy

### "Standings Not Updating"

**Problem**: Admin enters match result but standings don't change

**Solution**:
1. Check that the PostgreSQL trigger was created:
   - Go to Supabase → **SQL Editor** → **New Query**
   - Run: `SELECT * FROM pg_proc WHERE proname = 'update_standings';`
   - You should see one result
2. Check the `standings` table directly:
   - Go to **Table Editor** → **standings**
   - Verify data is there
3. If trigger failed:
   - Go to **Functions** in Supabase (left sidebar)
   - Check if there are any errors
   - Re-run `scripts/002-trigger-standings.sql`

## Updating Your App

### Push Changes to Production

1. Make changes locally
2. Push to GitHub:
```bash
git add .
git commit -m "Your message"
git push origin main
```

3. Vercel automatically redeploys when you push
4. Check the **Deployments** tab in Vercel to see progress

### Update Database

1. Make SQL changes in a new file: `scripts/004-my-changes.sql`
2. Go to Supabase → **SQL Editor** → **New Query**
3. Paste your SQL and run
4. No need to redeploy Next.js (database changes are instant)

## Keeping Secrets Secure

**NEVER** commit `.env.local` to GitHub. The Vercel GitHub app automatically prevents this, but:

- Never share your `ADMIN_PASSWORD` 
- Never share your Supabase `ANON_KEY` in public repos (it's "public" but still requires the Supabase project URL to be useful)
- Rotate your admin password periodically if needed

## Performance Tips

- All public pages are cached by Vercel's CDN (free tier)
- Admin pages require authentication, so they're not cached
- Supabase database is optimized for tournament use with < 16 teams
- For larger tournaments, consider upgrading Supabase tier

## Monitoring

### Check Deployment Logs

1. Go to Vercel project dashboard
2. Click **Deployments**
3. Click the most recent deploy
4. Click **Logs** to see build/runtime logs

### Check Database Health

1. Go to Supabase project dashboard
2. Click **Database** → **Backups** (see if backups are happening)
3. Click **Logs** (see if there are query errors)

## Rollback

If something breaks:

1. Go to Vercel **Deployments**
2. Find the previous working deployment
3. Click the **...** menu → **Promote to Production**
4. Your app rolls back instantly

## Need Help?

- **Vercel issues**: Check [vercel.com/docs](https://vercel.com/docs)
- **Supabase issues**: Check [supabase.com/docs](https://supabase.com/docs)
- **Next.js issues**: Check [nextjs.org/docs](https://nextjs.org/docs)

---

That's it! Your Football Tournament Platform is now live and ready to use.
