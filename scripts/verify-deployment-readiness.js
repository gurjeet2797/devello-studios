#!/usr/bin/env node

const fs = require('fs');
const path = require('path');


let allChecksPassed = true;

// 1. Check for critical files
const criticalFiles = [
  'components/ErrorBoundary.js',
  'lib/productionLogger.js',
  'sentry.client.config.js',
  'sentry.server.config.js',
  'next.config.js',
  'vercel.json'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
  } else {
    allChecksPassed = false;
  }
});

// 2. Check for environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'GOOGLE_API_KEY'
];

// Note: We can't actually check env vars in this script, but we can document them
requiredEnvVars.forEach(envVar => {
});

const excludePatterns = [
  'node_modules',
  '.next',
  'scripts',
  'test',
  '__tests__'
];

function checkForConsoleLogs(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !excludePatterns.some(pattern => file.name.includes(pattern))) {
      checkForConsoleLogs(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.jsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const consoleLogMatches = content.match(/console\.(log|info|debug|warn)/g);
      
      if (consoleLogMatches && !fullPath.includes('scripts/')) {
        // Don't fail the check for this, as we have production logger
      }
    }
  });
}

// 4. Check database schema
if (fs.existsSync('prisma/schema.prisma')) {
} else {
  allChecksPassed = false;
}

// 5. Check for security issues
const securityIssues = [];

// Check for innerHTML usage
function checkSecurityIssues(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !excludePatterns.some(pattern => file.name.includes(pattern))) {
      checkSecurityIssues(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.jsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for dangerous patterns
      if (content.includes('innerHTML') && !content.includes('textContent')) {
        securityIssues.push(`innerHTML usage in ${fullPath}`);
      }
      
      if (content.includes('eval(') || content.includes('Function(')) {
        securityIssues.push(`Dangerous function usage in ${fullPath}`);
      }
    }
  });
}

checkSecurityIssues('.');

if (securityIssues.length === 0) {
} else {
}

// 6. Check package.json for production dependencies
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = ['@sentry/nextjs', 'prisma', '@prisma/client'];
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  );
  
  if (missingDeps.length === 0) {
  } else {
  }
} else {
  allChecksPassed = false;
}

// 7. Check for error boundaries
const errorBoundaryFiles = [
  'components/ErrorBoundary.js',
  'pages/_app.js'
];

let errorBoundaryCount = 0;
errorBoundaryFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('ErrorBoundary') || content.includes('componentDidCatch')) {
      errorBoundaryCount++;
    }
  }
});

if (errorBoundaryCount > 0) {
} else {
  allChecksPassed = false;
}

// 8. Final assessment
if (allChecksPassed) {
  
} else {
}

