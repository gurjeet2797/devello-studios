import { NextResponse } from 'next/server';

// Shared pages accessible on Studios domain
const sharedPages = [
  '/profile',
  '/client-portal',
  '/auth/callback',
  '/checkout',
  '/guest-checkout',
  '/order-tracking',
  '/privacy',
  '/terms',
  '/contact',
  '/about',
  '/partners',
  '/shipping',
  '/shipping-policy',
  '/blog',
  '/api',
];

// Studios-specific pages
const studiosPages = [
  '/studios',
  '/lighting',
  '/assisted-edit',
  '/general-edit',
];

// Check if path is allowed
function isAllowedPage(pathname) {
  return sharedPages.some(page => 
    pathname === page || pathname.startsWith(page + '/')
  ) || studiosPages.some(page => 
    pathname === page || pathname.startsWith(page + '/')
  );
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // CRITICAL: Handle OPTIONS (preflight) requests immediately for API routes
  // This must happen before any redirect logic to prevent CORS errors
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const response = new NextResponse(null, { status: 200 });
    const origin = request.headers.get('origin');
    
    // Set CORS headers for preflight
    if (origin) {
      const allowedOrigins = [
        'https://devellostudios.com',
        'https://www.devellostudios.com',
        'http://localhost:3001',
        'http://localhost:3000'
      ];
      
      if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    return response;
  }
  
  // Allow API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow root path (homepage)
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Allow all studios and shared pages
  if (isAllowedPage(pathname)) {
    return NextResponse.next();
  }

  // Block other pages - redirect to homepage
  return NextResponse.redirect(new URL('/', request.url), 301);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

