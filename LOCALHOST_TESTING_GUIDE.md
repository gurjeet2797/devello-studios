# Localhost Testing Guide - Multi-Domain Setup

## Overview

This guide explains how to test all domains locally without modifying your hosts file or affecting production.

## Quick Start

### Option 1: Use Different Ports (Recommended)

No host file changes needed! Just use different ports:

```bash
# Main domain (develloinc.com)
npm run dev:main
# Opens on http://localhost:3000

# Studios domain (devellostudios.com)
npm run dev:studios
# Opens on http://localhost:3001

# Tech domain (devellotech.com)
npm run dev:tech
# Opens on http://localhost:3002
```

### Option 2: Use Environment Variable

Set `NEXT_PUBLIC_DOMAIN_TYPE` in your `.env.local` file:

```bash
# For studios testing
NEXT_PUBLIC_DOMAIN_TYPE=studios
npm run dev

# For tech testing
NEXT_PUBLIC_DOMAIN_TYPE=tech
npm run dev

# For main domain (default)
# Don't set the variable or set it to 'main'
npm run dev
```

## How It Works

### Port-Based Detection

The middleware and `pages/index.js` automatically detect which domain you're testing based on the port:

- **Port 3000** → Main domain (Welcome page)
- **Port 3001** → Studios domain (Studios page)
- **Port 3002** → Tech domain (Software page)

### Environment Variable Detection

If you set `NEXT_PUBLIC_DOMAIN_TYPE` in your `.env.local` file, it takes priority over port detection.

## Testing Each Domain

### Main Domain (localhost:3000)

```bash
npm run dev:main
```

- Homepage shows Welcome page
- `/studios` redirects to `http://localhost:3001`
- `/software` redirects to `http://localhost:3002`
- All other pages work normally

### Studios Domain (localhost:3001)

```bash
npm run dev:studios
```

- Homepage shows Studios page
- `/studios` also shows Studios page
- `/lighting` works
- `/assisted-edit` works
- `/general-edit` works
- `/profile` works
- Other pages redirect to homepage

### Tech Domain (localhost:3002)

```bash
npm run dev:tech
```

- Homepage shows Software page
- `/software` also shows Software page
- `/profile` works
- Other pages redirect to homepage

## Running Multiple Servers

You can run all three simultaneously in separate terminal windows:

```bash
# Terminal 1
npm run dev:main

# Terminal 2
npm run dev:studios

# Terminal 3
npm run dev:tech
```

Then test cross-domain redirects:
- Visit `http://localhost:3000/studios` → Should redirect to `http://localhost:3001`
- Visit `http://localhost:3000/software` → Should redirect to `http://localhost:3002`

## Environment Variables for Local Testing

Create a `.env.local` file in the root directory:

```bash
# For Studios domain testing
NEXT_PUBLIC_DOMAIN_TYPE=studios
NEXT_PUBLIC_STUDIOS_DOMAIN=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# For Tech domain testing
NEXT_PUBLIC_DOMAIN_TYPE=tech
NEXT_PUBLIC_TECH_DOMAIN=http://localhost:3002
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# For Main domain testing (default)
NEXT_PUBLIC_DOMAIN_TYPE=main
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Troubleshooting

### Port Already in Use

If a port is already in use, you can change it:

```bash
# Use a different port
next dev -p 3003
```

Then update the middleware to recognize that port, or use the environment variable method instead.

### Wrong Page Showing

1. **Check the port**: Make sure you're using the correct port
2. **Check environment variable**: If you have `NEXT_PUBLIC_DOMAIN_TYPE` set, it overrides port detection
3. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. **Check console**: Look for any errors in the browser console

### Redirects Not Working

Cross-domain redirects between localhost ports should work automatically. If they don't:

1. Make sure both servers are running
2. Check that the middleware is detecting the correct domain
3. Verify the redirect URLs in the middleware match your localhost ports

## Benefits of This Approach

✅ **No host file changes** - Works out of the box  
✅ **No production impact** - Completely separate from live domains  
✅ **Easy switching** - Just change the port or env var  
✅ **Multiple domains** - Can test all domains simultaneously  
✅ **Matches production** - Same code, same behavior  

## Production vs Localhost

| Production | Localhost |
|-----------|-----------|
| `develloinc.com` | `localhost:3000` |
| `devellostudios.com` | `localhost:3001` |
| `devellotech.com` | `localhost:3002` |

The code automatically detects which environment you're in and routes accordingly.
