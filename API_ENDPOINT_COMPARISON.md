# API Endpoint Comparison: Profile vs Partners

## Key Difference Summary

| Aspect | Profile API (`/api/user/profile`) | Partners API (`/api/partners/apply`) |
|--------|----------------------------------|--------------------------------------|
| **Database** | Prisma (PostgreSQL ORM) | Supabase Client (Direct) |
| **Table Access** | Prisma-managed tables | Supabase-managed tables |
| **User Creation** | `UserService.getOrCreateUser()` → Creates in Prisma `users` table | Tries to create in Supabase `users` table |
| **Data Storage** | Prisma schema → `users`, `user_profiles` tables | Supabase schema → `partners` table |
| **Error Handling** | Prisma error handling | Supabase error handling |
| **RLS** | No RLS (Prisma bypasses) | RLS policies apply |
| **Service Role** | Not needed (Prisma) | Required (Supabase) |

## Detailed Comparison

### Profile API Flow
```
1. Get token → Verify with Supabase Auth
2. Use Prisma to query/update database
3. UserService.getOrCreateUser() → Creates in Prisma tables
4. Returns Prisma data
```

### Partners API Flow
```
1. Get token → Verify with Supabase Auth
2. Check if user exists in Supabase `users` table
3. Create user in Supabase `users` if missing
4. Insert into Supabase `partners` table
5. Returns Supabase data
```

## Problem

**Profile API works because:**
- Uses Prisma which connects directly to PostgreSQL
- No RLS restrictions
- Prisma manages its own schema

**Partners API fails because:**
- Uses Supabase client which enforces RLS
- Must satisfy foreign key constraint (`user_id` → `public.users.id`)
- Service role key may not be configured correctly
- Supabase `users` table might not exist or have different structure

## Solution Options

1. **Use Prisma for partners** (like profile API)
   - Create Prisma model for Partner
   - Use Prisma instead of Supabase client
   - No RLS issues

2. **Fix Supabase setup** (keep Supabase)
   - Ensure service role key is set
   - Verify `users` table exists in Supabase
   - Check RLS policies allow service role access
   - Ensure foreign key relationship is correct

