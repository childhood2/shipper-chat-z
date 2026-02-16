# NextAuth + Google OAuth: Dev vs Production

## Auth with Supabase (quick check)

Sign-in and sign-up both use **Prisma → Supabase** (no SQLite in auth):

- **Register:** `POST /api/auth/register` → `prisma.user.create` (Supabase).
- **Login (email/password):** NextAuth Credentials → `prisma.user.findUnique` + bcrypt compare (Supabase).
- **Login (Google):** NextAuth Google → `signIn` callback → `prisma.user.findUnique` / `update` / `create` (Supabase).
- **Session:** JWT and session callbacks read user from Prisma (Supabase).

On **Vercel**, set at least: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`. Optionally `DIRECT_URL` if you run migrations from CI.

---

## 1. Environment variable: `NEXTAUTH_URL`

NextAuth uses `NEXTAUTH_URL` as the base URL of your app (for callbacks and cookies).

| Environment | Value |
|-------------|--------|
| **Local dev** | `http://localhost:3000` |
| **Production (Vercel)** | `https://shipper-chat-delta.vercel.app` |

- **No trailing slash** on the URL.
- Locally: set in `.env` (already set to `http://localhost:3000`).
- Production: set in **Vercel** (see below). Do **not** put the production URL in `.env` if that file is only for local dev.

---

## 2. What to do in Vercel (production)

1. Open your project on [Vercel](https://vercel.com) → **Settings** → **Environment Variables**.
2. Add (or update) these for **Production** (and optionally Preview if you use preview URLs):

| Name | Value | Notes |
|------|--------|--------|
| `NEXTAUTH_URL` | `https://shipper-chat-delta.vercel.app` | Your production app URL, no trailing slash |
| `NEXTAUTH_SECRET` | *(same as local)* | e.g. from `openssl rand -base64 32`; must be the same if users can use both dev and prod |
| `GOOGLE_CLIENT_ID` | *(your Google OAuth client ID)* | Same or different OAuth client than dev (see Google section) |
| `GOOGLE_CLIENT_SECRET` | *(your Google OAuth client secret)* | For the client ID you use in production |
| `DATABASE_URL` | *(Supabase pooler URL)* | Same Supabase DB as dev if you want shared data |
| `DIRECT_URL` | *(Supabase direct URL)* | Only needed if you run migrations from Vercel |

3. **Redeploy** after changing env vars so the new values are applied.

---

## 3. What to do in Google Cloud Console

Google OAuth requires **authorized origins** and **redirect URIs** for each environment.

### 3.1 Open OAuth client

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and select your project (or create one).
2. Open **APIs & Services** → **Credentials**.
3. Under **OAuth 2.0 Client IDs**, click your existing **Web client** (or create one: **Create Credentials** → **OAuth client ID** → Application type: **Web application**).

### 3.2 Authorized JavaScript origins

Add both:

- `http://localhost:3000` — for local dev
- `https://shipper-chat-delta.vercel.app` — for production

So the list should include:

- `http://localhost:3000`
- `https://shipper-chat-delta.vercel.app`

### 3.3 Authorized redirect URIs

NextAuth’s Google callback path is: **`{NEXTAUTH_URL}/api/auth/callback/google`**.

Add both:

- `http://localhost:3000/api/auth/callback/google` — for local dev
- `https://shipper-chat-delta.vercel.app/api/auth/callback/google` — for production

Save the client. Changes can take a short time to apply.

### Summary (Google)

| Setting | Dev | Production |
|--------|-----|------------|
| **Authorized JavaScript origins** | `http://localhost:3000` | `https://shipper-chat-delta.vercel.app` |
| **Authorized redirect URIs** | `http://localhost:3000/api/auth/callback/google` | `https://shipper-chat-delta.vercel.app/api/auth/callback/google` |

You can use **one** OAuth client with both URIs/origins, or separate clients for dev and prod (then you’d set different `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in Vercel).

---

## 4. What to do in NextAuth (your app)

- **Local:** `.env` already has `NEXTAUTH_URL=http://localhost:3000`. No code change needed.
- **Production:** Set `NEXTAUTH_URL=https://shipper-chat-delta.vercel.app` in Vercel env vars. NextAuth reads it at runtime; no code change needed.

Optional: if you ever need to derive the URL in code (e.g. for links), you can use:

```ts
const baseUrl = process.env.NEXTAUTH_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
```

For standard NextAuth behavior, setting `NEXTAUTH_URL` per environment is enough.

---

## 5. Checklist

- [ ] **Local:** `.env` has `NEXTAUTH_URL=http://localhost:3000`.
- [ ] **Vercel:** `NEXTAUTH_URL=https://shipper-chat-delta.vercel.app` (no trailing slash) and `NEXTAUTH_SECRET` (and Google + DB vars) set for Production.
- [ ] **Google Cloud Console:** Authorized JavaScript origins include `http://localhost:3000` and `https://shipper-chat-delta.vercel.app`.
- [ ] **Google Cloud Console:** Authorized redirect URIs include `http://localhost:3000/api/auth/callback/google` and `https://shipper-chat-delta.vercel.app/api/auth/callback/google`.
- [ ] Redeploy on Vercel after changing env vars.
