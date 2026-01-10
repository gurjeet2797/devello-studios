# Supabase Partners Table - Issue & Fix Request

## Problem Summary
We have a `partners` table in Supabase that our Next.js API endpoints are trying to access, but we're getting 500 errors when trying to query or insert data. The endpoints are working correctly, but Supabase is blocking access to the table.

## Current Table Structure
Your `partners` table has these columns:
- `id` (uuid, primary key)
- `user_id` (text)
- `service_type` (varchar)
- `status` (varchar)
- `company_name` (varchar)
- `experience_years` (integer, nullable)
- `description` (text, nullable)
- `portfolio_url` (varchar, nullable)
- `phone` (varchar, nullable)
- `application_data` (jsonb, nullable)
- `approved_at` (timestamptz, nullable)
- `approved_by` (varchar, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Error Details
When our Next.js API routes try to:
1. **Query** the table: `SELECT * FROM partners WHERE user_id = '...'`
2. **Insert** into the table: `INSERT INTO partners (...) VALUES (...)`

We get 500 errors, likely due to:
- **Row Level Security (RLS) policies blocking access**
- The service role key should bypass RLS, but something is preventing access

## What We Need Fixed

### 1. RLS Policy Setup
We need RLS policies that allow:
- **Service role** to have full access (read, insert, update, delete)
- **Authenticated users** to read their own partner records
- **Authenticated users** to insert their own partner applications

### 2. Required Policies

Please create these RLS policies:

**Policy 1: Service Role Full Access**
```sql
-- Allow service role (used by API routes) to do everything
CREATE POLICY "service_role_full_access"
ON partners
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

**Policy 2: Users can read their own records**
```sql
-- Users can read their own partner application
CREATE POLICY "users_read_own_partner"
ON partners
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);
```

**Policy 3: Users can insert their own applications**
```sql
-- Users can insert their own partner applications
CREATE POLICY "users_insert_own_partner"
ON partners
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);
```

**Policy 4: Users can update their own pending applications**
```sql
-- Users can update their own applications (if pending)
CREATE POLICY "users_update_own_pending"
ON partners
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id AND status = 'pending')
WITH CHECK (auth.uid()::text = user_id);
```

### 3. Alternative: Disable RLS (Temporary for Testing)
If you want to test quickly first, you can temporarily:
- Go to Table Editor → `partners` table
- Toggle RLS **OFF**
- Test the endpoints
- Then re-enable RLS and add the policies above

## API Endpoints That Need Access

Our Next.js API routes use the **service role key** (`SUPABASE_SERVICE_ROLE_KEY`), which should bypass RLS. If it's not bypassing, the policies above will ensure access.

Endpoints:
1. `GET /api/partners/status` - Reads partner status for current user
2. `POST /api/partners/apply` - Inserts new partner application

## Verification Steps

After fixing, test by:
1. Visiting `http://localhost:3000/api/partners/test-table` (should return success)
2. Submitting a partner application through the UI
3. Checking the Supabase dashboard to see the new record

## Important Notes

- The `user_id` column stores the Supabase auth user ID as **text** (not uuid)
- We're using `auth.uid()::text` in policies to match the text format
- The service role should have full access regardless of RLS
- Make sure the table name is exactly `partners` (lowercase)

