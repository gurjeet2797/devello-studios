import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Ads (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17837007247"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17837007247');
            `,
          }}
        />
        
        {/* Google Ads Conversion Tracking */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function gtag_report_conversion(url) {
                var callback = function () {
                  if (typeof(url) != 'undefined') {
                    window.location = url;
                  }
                };
                gtag('event', 'conversion', {
                    'send_to': 'AW-17837007247/-tZLCM28xNgbEI_DrLlC',
                    'value': 1.0,
                    'currency': 'USD',
                    'transaction_id': '',
                    'event_callback': callback
                });
                return false;
              }
            `,
          }}
        />
        
        {/* SEO Meta Tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
        
        {/* Google Search Console Verification - Replace with your verification code */}
        {/* <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE_HERE" /> */}
        
        {/* Google Analytics - Replace with your GA4 measurement ID */}
        {/* <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `
        }} /> */}
        
        
        {/* Favicon and Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        
        {/* Theme Color - Dynamically managed by useStatusBar.js */}
        {/* Initial theme-color will be set by hydration script based on saved preference */}
        {/* Static fallback for iOS Safari - ensures status bar color is set immediately */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#000000" />
        {/* black-translucent allows content to extend under status bar for blur effects */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json?v=2" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="https://static.wixstatic.com/media/c6bfe7_00325be2587049a8bd3a30589a34605a~mv2.jpg?v=2" />
        <link rel="apple-touch-icon" sizes="180x180" href="https://static.wixstatic.com/media/c6bfe7_00325be2587049a8bd3a30589a34605a~mv2.jpg?v=2" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Devello" />
        
        {/* Safari Viewport Fix */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </Head>

      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedPreference = localStorage.getItem('theme-preference');
                  var isLight = savedPreference === 'light';
                  
                  if (isLight) {
                    document.documentElement.classList.remove('dark');
                    document.body.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.body.classList.add('dark');
                  }
                  
                  // Set initial status bar color: #ffffff for light mode, #000000 for dark mode (same for browser and webapp)
                  var statusBarColor = isLight 
                    ? '#ffffff'
                    : '#000000';
                  
                  // Update or create theme-color meta tag
                  var themeColorMeta = document.querySelector('meta[name="theme-color"]');
                  if (themeColorMeta) {
                    themeColorMeta.setAttribute('content', statusBarColor);
                  } else {
                    var meta = document.createElement('meta');
                    meta.setAttribute('name', 'theme-color');
                    meta.setAttribute('content', statusBarColor);
                    document.head.appendChild(meta);
                  }
                  
                  // Ensure apple-mobile-web-app-status-bar-style is set correctly
                  var appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
                  if (appleStatusMeta) {
                    appleStatusMeta.setAttribute('content', 'black-translucent');
                  }
                } catch (e) {
                  // Default to dark mode if localStorage is not available
                  document.documentElement.classList.add('dark');
                  document.body.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
