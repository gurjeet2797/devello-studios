# Newsletter Subscribers Setup

This guide explains how to set up the newsletter subscribers table in Supabase.

## Database Schema

The `newsletter_subscribers` table has the following structure:

```sql
CREATE TABLE "newsletter_subscribers" (
  "id" SERIAL NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "subscribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "unsubscribed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);
```

## Setup Instructions

### Option 1: Using Prisma Migration (Recommended)

1. **Run Prisma migration:**
   ```bash
   npx prisma migrate dev --name create_newsletter_subscribers
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

### Option 2: Manual SQL Execution

1. **Connect to your Supabase database** using the SQL editor or psql

2. **Execute the migration SQL:**
   ```sql
   -- CreateTable
   CREATE TABLE "newsletter_subscribers" (
       "id" SERIAL NOT NULL,
       "email" VARCHAR(255) NOT NULL,
       "subscribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "status" VARCHAR(20) NOT NULL DEFAULT 'active',
       "unsubscribed_at" TIMESTAMP(3),
       "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
   );

   -- CreateIndex
   CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");
   CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers"("status");
   CREATE INDEX "newsletter_subscribers_subscribed_at_idx" ON "newsletter_subscribers"("subscribed_at");
   ```

### Option 3: Using the Setup Script

1. **Run the setup script:**
   ```bash
   node scripts/create-newsletter-table.js
   ```

## Table Features

- **Unique email constraint**: Prevents duplicate subscriptions
- **Status tracking**: Track active, unsubscribed, and bounced emails
- **Timestamps**: Track subscription and unsubscription dates
- **Indexes**: Optimized for queries by status and subscription date

## API Endpoint

The newsletter subscription API is available at:
- **Endpoint**: `POST /api/newsletter/subscribe`
- **Body**: `{ "email": "user@example.com" }`
- **Response**: Success/error message

## Testing

After setup, you can test the newsletter subscription:

1. **Visit the homepage** and scroll to the "Stay Updated" section
2. **Enter an email** and click Subscribe
3. **Check the database** to verify the subscription was recorded

## Troubleshooting

### Common Issues

1. **Table already exists**: The migration will skip if the table exists
2. **Permission errors**: Ensure your database user has CREATE TABLE permissions
3. **Connection issues**: Verify your DATABASE_URL is correct

### Verification

Check if the table was created successfully:

```sql
SELECT * FROM newsletter_subscribers LIMIT 5;
```

## Next Steps

1. **Set up email service**: Integrate with SendGrid, Mailchimp, or similar
2. **Create unsubscribe functionality**: Add unsubscribe links to emails
3. **Analytics**: Track subscription rates and engagement
4. **Bulk operations**: Create admin interface for managing subscribers
