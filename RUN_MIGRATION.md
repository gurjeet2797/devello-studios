# Database Migration Instructions

To add the conversations system to your database, you have two options:

## Option 1: Run SQL Migration Manually (Recommended)

1. Connect to your PostgreSQL database (via Supabase dashboard or psql)
2. Run the SQL file: `prisma/migrations/manual_add_conversations.sql`
3. This will:
   - Create the `conversations` table
   - Add new columns to `partner_messages` table (conversation_id, user_id, sender_id, reply_to_id)
   - Create all necessary indexes and foreign keys

## Option 2: Use Prisma DB Push (Faster but may have warnings)

```bash
npx prisma db push --accept-data-loss
```

**Note**: This will warn about dropping `basic_upload_count` and `pro_upload_count` columns if they exist. If you don't need those columns, this is safe.

## After Migration

Run this to regenerate Prisma Client:
```bash
npx prisma generate
```

Then restart your development server.

