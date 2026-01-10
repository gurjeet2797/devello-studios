# Fix Failed Migration Issue

## Understanding the Problem

1. **Failed Migration**: `20251206_store_orders_align` failed and is blocking new migrations
2. **Manual Table Creation**: If you manually created `house_build_products`, Prisma doesn't know about it
3. **Migration Tracking**: Prisma tracks all migrations in `_prisma_migrations` table

## Solution Options

### Option 1: Mark Failed Migration as Applied (If it Actually Succeeded)

If the migration actually worked but Prisma thinks it failed:

```bash
npx prisma migrate resolve --applied 20251206_store_orders_align
```

Then apply your new migration:
```bash
npx prisma migrate deploy
```

### Option 2: Mark Failed Migration as Rolled Back (If it Failed)

If the migration actually failed and you need to re-run it:

```bash
npx prisma migrate resolve --rolled-back 20251206_store_orders_align
```

Then manually fix the issue and re-run:
```bash
npx prisma migrate deploy
```

### Option 3: Use DB Push (Development Only - Quick Fix)

If you just want to sync your schema without dealing with migrations:

```bash
# This will sync your Prisma schema to the database
npx prisma db push

# Regenerate Prisma Client
npx prisma generate
```

**Warning**: This doesn't create migration files. Use only in development.

### Option 4: Manual SQL Execution (Recommended for Production)

If migrations are too problematic, run the SQL directly:

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `prisma/migrations/20250115_create_house_build_products/migration.sql`
3. Then mark the migration as applied:

```bash
npx prisma migrate resolve --applied 20250115_create_house_build_products
```

### Option 5: Check What Actually Failed

First, check the migration status:

```bash
# Check migration status
npx prisma migrate status
```

Then check the `_prisma_migrations` table in Supabase to see the error message.

## Recommended Steps

1. **Check migration status**:
   ```bash
   npx prisma migrate status
   ```

2. **If the failed migration actually worked**, mark it as applied:
   ```bash
   npx prisma migrate resolve --applied 20251206_store_orders_align
   ```

3. **If you manually created the table**, either:
   - Delete it and let Prisma create it, OR
   - Mark the new migration as applied if the table already exists

4. **Apply new migrations**:
   ```bash
   npx prisma migrate deploy
   ```

5. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

## Verify Everything Works

```bash
# Open Prisma Studio to see your tables
npx prisma studio

# Or check in Supabase Dashboard → Table Editor
```
