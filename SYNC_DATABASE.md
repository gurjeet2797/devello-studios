# Sync Database Schema

The database is missing the `custom_product_requests` and `quotes` tables. You need to create them.

## Option 1: Run Manual SQL Migration (Recommended)

Run the SQL from `prisma/migrations/manual_create_custom_product_requests/migration.sql` directly in your Supabase SQL Editor or database client.

This will create:
- `custom_product_requests` table
- `quotes` table
- All necessary indexes and foreign keys

## Option 2: Use Prisma DB Push (Development Only)

**Warning: This will modify your database schema directly without creating migration files. Use only in development.**

```bash
npx prisma db push
```

This will sync your Prisma schema to the database, creating any missing tables.

## Option 3: Create Migration Manually

If you want to use Prisma migrations:

1. First, mark existing migrations as applied (if they're already in your DB):
   ```bash
   npx prisma migrate resolve --applied 20250121_add_order_type_to_product_orders
   npx prisma migrate resolve --applied fix_partners_nullable_fields
   ```

2. Then create and apply the new migration:
   ```bash
   npx prisma migrate dev --name create_custom_product_requests
   ```

## After Creating Tables

1. Regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```

2. Restart your development server

## Verify Tables Exist

You can verify the tables were created by running:
```bash
npx prisma studio
```

Or check in your Supabase dashboard under Table Editor.

