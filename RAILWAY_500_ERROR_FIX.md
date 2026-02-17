# Railway 500 Error Fix - Database Connection Issue

## Problem
The registration endpoint returns 500 error because Prisma can't connect to the database:
```
Can't reach database server at `postgres.crhngpegktqqtrbreptf:5432`
```

## Root Causes

1. **Railway Start Command**: Still using `next start -p $PORT` instead of `npm start`
2. **Missing DATABASE_URL**: Railway environment variables don't have `DATABASE_URL` set

## Fix Steps

### Step 1: Fix Railway Start Command

1. Go to **Railway Dashboard** → Your Service
2. Click **Settings** → **Deploy** (or **Build & Deploy**)
3. Find **Start Command** field
4. **Delete/Remove** any existing command (like `next start -p $PORT`)
5. Set it to:
   ```bash
   npm start
   ```
   Or for automatic migrations:
   ```bash
   npm run start:with-migrations
   ```
6. **Save** the settings

### Step 2: Set Database Environment Variables in Railway

1. Go to **Railway Dashboard** → Your Service
2. Click **Variables** tab
3. Make sure these are set:

   **Required:**
   - `DATABASE_URL` = `postgresql://postgres.crhngpegktqqtrbreptf:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
     - Use your actual password (URL-encoded if it has special characters)
     - Port **6543** (pooler) - for application queries
   
   - `DIRECT_URL` = `postgresql://postgres.crhngpegktqqtrbreptf:[YOUR-PASSWORD]@db.crhngpegktqqtrbreptf.supabase.co:5432/postgres`
     - Use your actual password (URL-encoded)
     - Port **5432** (direct) - only for migrations

   **Important Notes:**
   - `DATABASE_URL` is used by the application for all queries
   - `DIRECT_URL` is only used by Prisma migrations
   - Make sure passwords are URL-encoded if they contain special characters like `#`, `&`, `%`

### Step 3: Verify Other Environment Variables

Also ensure these are set:
- `NEXTAUTH_URL` = `https://shipper-chat-z-production.up.railway.app` (your Railway domain)
- `NEXTAUTH_SECRET` = (your secure random secret)
- `GOOGLE_CLIENT_ID` = (optional, if using Google OAuth)
- `GOOGLE_CLIENT_SECRET` = (optional, if using Google OAuth)

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click **⋮** (three dots) on the latest deployment
3. Click **Redeploy**

Or push a new commit to trigger automatic deployment.

## How to Get Your Database URLs

1. Go to **Supabase Dashboard** → Your Project
2. **Project Settings** → **Database**
3. Under **Connection string**:
   - **For DATABASE_URL**: Select "URI", "Transaction Pooler", port **6543**
   - **For DIRECT_URL**: Select "URI", "Session mode", port **5432**

## Password URL Encoding

If your password contains special characters, encode them:
- `#` → `%23`
- `&` → `%26`
- `%` → `%25`
- `!` → `%21`
- etc.

Example: Password `#yX9*4R&%G!mhL9` becomes `%23yX9*4R%26%25G!mhL9`

## Verification

After fixing and redeploying:
1. Check Railway logs - should see `node .next/standalone/server.js` starting (not `next start`)
2. No database connection errors
3. Registration should work without 500 errors
