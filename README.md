# Shipper Chat MVP

Next.js app with SQLite (Drizzle), NextAuth (credentials), and pixel-perfect Chat UI per `docs/DESIGN_AND_PROJECT_SPEC.md` and `docs/IMPLEMENTATION_PLAN.md`.

## Setup

1. **Install dependencies** (from project root, without elevated privileges):

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `NEXTAUTH_URL=http://localhost:3000`
   - `NEXTAUTH_SECRET` — e.g. run `openssl rand -base64 32` and paste the result.
   - Optional: `DATABASE_URL=file:./data/shipper.db` (default is `data/shipper.db`).

3. **Database**

   Ensure the `data` folder exists, then generate and run migrations:

   ```bash
   mkdir -p data   # or: md data on Windows
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign in (any email/name for dev); you’ll be redirected to `/chat` with the sidebar and chat shell.

## Implemented so far

- **Phase 0:** Design tokens in `globals.css`, app shell, Next.js + TypeScript.
- **Phase 1:** Drizzle + SQLite schema (User, Chat, ChatMember, Message), NextAuth credentials auth, login page, AuthGate, redirect to `/chat`.
- **Phase 2 (partial):** Main layout with Sidebar (logo, House, Chat, Star, avatar placeholder); Chat page shell with “Message” top bar and content area.

## Next steps (see `docs/IMPLEMENTATION_PLAN.md`)

- Phase 2: Pixel-perfect sidebar (all nav icons, active states).
- Phases 3–4: Chat TopBar (search, bell, settings), ChatListItem with unread/archive/three-dot.
- Phases 5–8: Message Settings popup, New Message popup, Contact Info popup, Menu.
- Phases 9–10: APIs, WebSocket, conversation view, online/offline.

## Scripts

- `npm run dev` — start dev server
- `npm run build` / `npm run start` — production
- `npm run db:generate` — generate Drizzle migrations
- `npm run db:migrate` — run migrations
- `npm run db:studio` — open Drizzle Studio
