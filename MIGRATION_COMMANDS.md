# Migration Commands - Run in Order

## Step 1: Resolve the failed migration (if needed)
```powershell
npx prisma migrate resolve --rolled-back 20250122_remove_full_name_phone_from_addresses
```

## Step 2: Deploy migrations (use deploy instead of dev to avoid shadow database issues)
```powershell
npx prisma migrate deploy
```

## Step 3: Generate Prisma Client
```powershell
npx prisma generate
```

## Step 4: Verify migration status
```powershell
npx prisma migrate status
```

## Alternative: If migrate deploy doesn't work, try applying manually

If you still get errors, you can apply the migration SQL directly to your database:

1. Connect to your database
2. Run the SQL from `prisma/migrations/20250122_create_user_addresses/migration.sql`
3. Then mark it as applied:
```powershell
npx prisma migrate resolve --applied 20250122_create_user_addresses
```

## Notes:
- `migrate dev` uses a shadow database which can cause issues
- `migrate deploy` applies migrations directly to your database (better for production/remote DBs)
- The migration file is idempotent (safe to run multiple times)
