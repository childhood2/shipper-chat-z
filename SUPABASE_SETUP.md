# Import Prisma into Supabase

Your app currently uses **SQLite**. These steps switch it to **Supabase (PostgreSQL)**.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Choose organization, name (e.g. `shipper-chat`), database password, and region.
4. Wait for the project to be ready.

---

## 2. Get the database connection string

1. In the Supabase dashboard, open your project.
2. Go to **Project Settings** (gear) → **Database**.
3. Under **Connection string**, choose **URI**.
4. Copy the URI. It looks like:
   ```text
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your database password.

**For Prisma migrations** (e.g. `prisma migrate deploy`), use the **direct** connection (port **5432**), not the pooler (6543). You can find it in the same **Database** settings under “Direct connection” or “Session mode”.

---

## 3. Switch Prisma to PostgreSQL

Your `prisma/schema.prisma` has been updated to use PostgreSQL. The only change is:

- `provider = "sqlite"` → `provider = "postgresql"`

No model changes are required; Prisma maps your schema to PostgreSQL.

---

## 4. Set your `.env`

Set `DATABASE_URL` to your Supabase PostgreSQL URL.

**Option A – Connection pooler (recommended for the app):**

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Option B – Direct connection (needed for migrations):**

```env
# For running migrations (e.g. prisma migrate deploy)
DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

Use **Option B** (direct, port 5432) when you run migrations. For local dev you can use a single `DATABASE_URL` with the direct connection (5432) so both app and migrations work.

**Example (replace with your values):**

```env
DATABASE_URL="postgresql://postgres.abcdefghij:MySecretPassword@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

---

## 5. Apply the schema to Supabase

Your existing migrations were generated for **SQLite**, so they are not applied directly to PostgreSQL. Use one of these approaches.

### Option A: Push schema (quickest)

This creates/updates tables in Supabase from `schema.prisma` **without** using the old SQLite migrations:

```bash
npx prisma db push
```

Use this to get running quickly. No migration history is stored in the Supabase DB.

### Option B: New migration for PostgreSQL (recommended for production)

1. **Rename or move** the existing SQLite migrations so Prisma doesn’t try to run them on PostgreSQL:
   - e.g. rename `prisma/migrations` to `prisma/migrations_sqlite_backup`.

2. Create a fresh initial migration for PostgreSQL:
   ```bash
   npx prisma migrate dev --name init_postgres
   ```
   This generates a new migration (PostgreSQL-compatible) and applies it to the DB pointed to by `DATABASE_URL`.

3. From then on, use:
   - `npx prisma migrate dev` for local development
   - `npx prisma migrate deploy` for production (e.g. CI or after deploy)

---

## 6. Generate Prisma Client

After the schema is applied:

```bash
npx prisma generate
```

Your app can keep using `PrismaClient` as before; only the database backend changes.

---

## 7. (Optional) Migrate existing SQLite data

If you have important data in `prisma/dev.db` and want it in Supabase:

1. Export from SQLite (e.g. CSV or raw SQL).
2. Use a script or Supabase SQL editor to insert into the new tables, or use a tool like [pgloader](https://pgloader.io/) to migrate SQLite → PostgreSQL.

If you don’t need the old data, skip this and start with an empty Supabase database.

---

## Summary checklist

- [ ] Create Supabase project and get connection string.
- [ ] Set `DATABASE_URL` in `.env` (direct connection, port 5432, for migrations).
- [ ] Run `npx prisma db push` **or** baseline with `prisma migrate dev --name init_postgres`.
- [ ] Run `npx prisma generate`.
- [ ] Run your app and confirm it talks to Supabase.

---

## Troubleshooting

- **SSL**: If you get SSL errors, add `?sslmode=require` to `DATABASE_URL` (Supabase usually requires SSL).
- **Migrations**: Use the **direct** connection (port 5432) for `prisma migrate`; pooler (6543) can cause issues with migrations.
- **Auth**: If you later use Supabase Auth, you can align `User` with `auth.users` (e.g. use `auth.uid()` and sync with your `User` table). That can be a follow-up step.
