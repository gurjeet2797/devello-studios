# How Domain Routing Works - Technical Explanation

## The Problem We Fixed

**Before**: Client-side detection caused:
- Initial server render always showed Welcome page
- Client-side JavaScript detected domain and switched
- Flash of wrong content or caching issues

**After**: Server-side detection:
- Correct page rendered immediately on server
- No client-side flash
- Works with caching

## How It Works Now

### 1. Server-Side Detection (`getServerSideProps`)

When a request comes in, Next.js runs `getServerSideProps` **before** rendering:

```javascript
export async function getServerSideProps(context) {
  // Check environment variable first (most reliable)
  const domainType = process.env.NEXT_PUBLIC_DOMAIN_TYPE;
  
  // Fallback: Detect from request hostname
  const hostname = context.req.headers.host;
  const domain = hostname.split(':')[0];
  
  // Determine domain type
  let detectedDomainType = domainType || detectFromHostname(domain);
  
  return {
    props: {
      domainType: detectedDomainType,
      hostname: domain
    }
  };
}
```

### 2. Component Receives Domain Info

The `Home` component receives `domainType` and `hostname` as props:

```javascript
export default function Home({ domainType, hostname }) {
  // domainType is: 'studios', 'tech', or 'main'
  // Render correct page based on domainType
}
```

### 3. Rendering Logic

- `domainType === 'studios'` → Shows `<StudiosPage />`
- `domainType === 'tech'` → Shows `<SoftwarePage />`
- `domainType === 'main'` → Shows `<Welcome />`

## Detection Methods (Priority Order)

### Method 1: Environment Variable (Recommended)
- **Variable**: `NEXT_PUBLIC_DOMAIN_TYPE`
- **Values**: `main`, `studios`, or `tech`
- **Set in**: Vercel project settings
- **Why**: Most reliable, no parsing needed

### Method 2: Hostname Detection (Fallback)
- **Source**: `context.req.headers.host`
- **Logic**: Parses hostname to determine domain
- **Why**: Works even if env var not set (backward compatible)

## Request Flow

```
User visits devellostudios.com
    ↓
Next.js receives request
    ↓
middleware.js runs (checks domain, allows request)
    ↓
getServerSideProps runs (detects domain = 'studios')
    ↓
Home component renders with domainType='studios'
    ↓
Shows StudiosPage immediately (server-rendered)
    ↓
HTML sent to browser with correct content
```

## Environment Variables Required

### In Vercel Dashboard:

**Main Project** (`devello-main`):
```
NEXT_PUBLIC_DOMAIN_TYPE=main
```

**Studios Project** (`devello-studios`):
```
NEXT_PUBLIC_DOMAIN_TYPE=studios
```

**Tech Project** (`devello-tech`):
```
NEXT_PUBLIC_DOMAIN_TYPE=tech
```

## Why This Works Better

1. **Server-Side Rendering**: Correct content in initial HTML
2. **No Flash**: No client-side switching
3. **SEO Friendly**: Search engines see correct content immediately
4. **Caching Works**: Vercel can cache per-domain correctly
5. **Fast**: No client-side JavaScript needed for routing

## Testing

After setting environment variables and deploying:

1. **devellostudios.com**:
   - Should show Studios page immediately
   - No flash of Welcome page
   - Check page source - should have Studios content in HTML

2. **devellotech.com**:
   - Should show Software page immediately
   - No flash of Welcome page
   - Check page source - should have Software content in HTML

3. **develloinc.com**:
   - Should show Welcome page
   - Works as before

## Troubleshooting

### Still showing wrong page?

1. **Check environment variable is set**:
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_DOMAIN_TYPE` exists and has correct value

2. **Redeploy after setting variable**:
   - Environment variables require a new deployment
   - Go to Deployments → Redeploy

3. **Check build logs**:
   - Look for any errors in Vercel deployment logs
   - Verify `getServerSideProps` is running

4. **Clear cache**:
   - Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
   - Or test in incognito mode

### Fallback is working but env var isn't?

- The hostname detection fallback should work automatically
- But setting the env var is recommended for reliability
- Check that the variable name is exactly `NEXT_PUBLIC_DOMAIN_TYPE` (case-sensitive)

## Summary

✅ **Server-side detection** = Correct page from first render  
✅ **Environment variable** = Most reliable method  
✅ **Hostname fallback** = Works even without env var  
✅ **No client-side flash** = Better UX and SEO

