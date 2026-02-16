# Deploy Shipper Chat on Railway

This guide walks you through deploying the Next.js app to [Railway](https://railway.com) with Supabase (PostgreSQL) and NextAuth.

---

## 1. Push your code to GitHub

Your repo is at **https://github.com/NeverSMILE0825/shipper-chat**. Railway will deploy from this repo.

---

## 2. Create a Railway project and connect the repo

1. Go to [railway.com](https://railway.com) and sign in (GitHub login is easiest).
2. Click **New Project**.
3. Choose **Deploy from GitHub repo**.
4. Select **NeverSMILE0825/shipper-chat** (authorize Railway if prompted).
5. Railway will create a service and start a build. You’ll configure it in the next steps.

---

## 3. Set environment variables

In your Railway project, open the service → **Variables** (or **Settings** → **Variables**). Add:

| Variable | Value | Notes |
|----------|--------|--------|
| `NEXTAUTH_URL` | `https://YOUR-APP.up.railway.app` | **Use your Railway app URL.** Create a domain first (see step 4), then set this and redeploy. No trailing slash. |
| `NEXTAUTH_SECRET` | *(random string)* | Same as local, e.g. from `openssl rand -base64 32`. |
| `DATABASE_URL` | *(Supabase pooler URL)* | From Supabase → Project Settings → Database → Connection string (URI, port 6543, with `?pgbouncer=true`). |
| `DIRECT_URL` | *(Supabase direct URL)* | Same project, direct connection (port 5432). Used by Prisma for migrations. |
| `GOOGLE_CLIENT_ID` | *(your Google OAuth client ID)* | From Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | *(your Google OAuth client secret)* | From Google Cloud Console. |

**Important:** Set `NEXTAUTH_URL` **after** you have a public URL (step 4). Until then you can leave it unset or use a placeholder; then update it and redeploy.

---

## 4. Generate a public URL (domain)

1. In the Railway service, open **Settings**.
2. Under **Networking** → **Public Networking**, click **Generate Domain**.
3. You’ll get a URL like `shipper-chat-production-xxxx.up.railway.app`.
4. Copy it, set **`NEXTAUTH_URL`** in Variables to `https://your-generated-domain.up.railway.app` (no trailing slash), and **Redeploy** (Deployments → ⋮ → Redeploy) so the app uses the correct URL.

---

## 5. Build and start commands (optional but recommended)

Railway usually auto-detects Next.js. To run Prisma migrations on every deploy:

1. In the service, go to **Settings** → **Deploy** (or **Build & Deploy**).
2. **Build Command:** leave default (e.g. `npm run build` or auto).
3. **Start Command:** set to:
   ```bash
   npx prisma migrate deploy && npm start
   ```
   This runs Supabase/Prisma migrations before starting the app.

If you don’t set a custom start command, run migrations once manually (see step 7) or from a one-off job.

---

## 6. Deploy

1. Trigger a deploy: **Deployments** → **Deploy** (or push a commit to `main` if you have GitHub connected).
2. Wait for the build to finish. The first deploy may take a few minutes.
3. Open your generated domain (e.g. `https://shipper-chat-production-xxxx.up.railway.app`).

---

## 7. (Optional) Run migrations manually

If you didn’t set the custom start command and need to run migrations once:

1. In Railway, open your service.
2. Use **Settings** → run a one-off command, or install Railway CLI and run:
   ```bash
   railway run npx prisma migrate deploy
   ```

---

## 8. Google OAuth for production

For “Continue with Google” to work on the Railway URL:

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → your OAuth 2.0 Client ID.
2. **Authorized JavaScript origins:** add  
   `https://YOUR-APP.up.railway.app`
3. **Authorized redirect URIs:** add  
   `https://YOUR-APP.up.railway.app/api/auth/callback/google`
4. Save. Use the same client ID/secret in Railway variables.

---

## Checklist

- [ ] Railway project created and connected to **NeverSMILE0825/shipper-chat**.
- [ ] Variables set: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- [ ] Public domain generated and `NEXTAUTH_URL` updated to that URL (no trailing slash).
- [ ] Start command set to `npx prisma migrate deploy && npm start` (recommended).
- [ ] Deploy succeeded and app loads at the Railway URL.
- [ ] Google sign-in: production origin and redirect URI added in Google Cloud Console.

---

## Troubleshooting

- **Build fails:** Check the build logs. Ensure `DATABASE_URL` and `DIRECT_URL` are set (Prisma needs them at build for `prisma generate`). If you use a root `package.json` in a monorepo, set **Root Directory** in Railway to the app folder.
- **App crashes or 503:** Check deploy logs. Often caused by missing `NEXTAUTH_URL` or wrong `DATABASE_URL`. Run `npx prisma migrate deploy` if you haven’t.
- **Google sign-in fails:** Confirm `NEXTAUTH_URL` matches the Railway domain exactly and that the callback URL is added in Google Cloud Console.
