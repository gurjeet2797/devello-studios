# Prisma + Supabase Migration Setup Guide

## Problem
Supabase requires **two different connection strings**:
- **Pooled connection** (port 6543) - for application queries (fast, connection pooling)
- **Direct connection** (port 5432) - for migrations (full PostgreSQL features)

## Solution

### 1. Update your `.env.local` file

Add both connection strings:

```env
# Pooled connection for application queries (port 6543)
DATABASE_URL="postgresql://postgres.vajxcznjxrfdrheqetca:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=20"

# Direct connection for migrations (port 5432)
DIRECT_URL="postgresql://postgres.vajxcznjxrfdrheqetca:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

**Key differences:**
- `DIRECT_URL` uses port **5432** (not 6543)
- `DIRECT_URL` uses `sslmode=require` (not pgbouncer parameters)
- Replace `[PASSWORD]` with your actual Supabase database password

### 2. Get your Supabase connection strings

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **Database**
3. Find **Connection string** section
4. Copy:
   - **Connection pooling** → Use for `DATABASE_URL` (port 6543)
   - **Direct connection** → Use for `DIRECT_URL` (port 5432)

### 3. Run the setup script

```bash
node scripts/setup-supabase-migrations.js
```

Or manually:

```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations (uses DIRECT_URL automatically)
npx prisma migrate deploy
```

### 4. Verify the setup

```bash
# Open Prisma Studio to view your database
npx prisma studio

# Test database connection
npm run dev
```

## Migration Commands

### Create a new migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Apply migrations (production)
```bash
npx prisma migrate deploy
```

### Reset database (development only - DESTRUCTIVE)
```bash
npx prisma migrate reset
```

### Push schema without migrations (development only)
```bash
npx prisma db push
```

## Troubleshooting

### Error: "Can't reach database server"
- Check that `DIRECT_URL` uses port **5432**
- Verify your Supabase password is correct
- Check Supabase dashboard for connection issues

### Error: "Migration failed"
- Ensure `DIRECT_URL` is set in `.env.local`
- Try `npx prisma db push` for development (not recommended for production)

### Error: "Connection pooler does not support transactions"
- You're using the pooled connection (6543) for migrations
- Switch to `DIRECT_URL` (5432) in your Prisma schema

### Verify Prisma schema configuration
Your `prisma/schema.prisma` should have:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooled for queries
  directUrl = env("DIRECT_URL")        // Direct for migrations
}
```

## Production (Vercel)

In Vercel, add both environment variables:

1. **DATABASE_URL** - Pooled connection (port 6543)
2. **DIRECT_URL** - Direct connection (port 5432)

Both should point to your Supabase database with the correct ports.

## Notes

- Always use `DATABASE_URL` (pooled) for application queries
- Always use `DIRECT_URL` (direct) for migrations
- Never run migrations on the pooled connection
- The setup script automatically uses the correct connection for each operation
