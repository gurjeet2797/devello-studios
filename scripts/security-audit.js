const fs = require('fs');
const path = require('path');

// Security audit script for Devello Inc

const securityIssues = [];
const securityRecommendations = [];

// 1. Check for hardcoded secrets
function checkHardcodedSecrets() {
  
  const srcDir = path.join(__dirname, '..', 'components');
  const pagesDir = path.join(__dirname, '..', 'pages');
  const libDir = path.join(__dirname, '..', 'lib');
  
  const secretPatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /private[_-]?key/i,
    /access[_-]?key/i,
    /auth[_-]?token/i
  ];
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        secretPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (pattern.test(line) && !line.includes('process.env') && !line.includes('//')) {
                securityIssues.push({
                  type: 'hardcoded-secret',
                  file: filePath,
                  line: index + 1,
                  severity: 'critical',
                  message: 'Potential hardcoded secret found'
                });
              }
            });
          }
        });
      }
    });
  }
  
  scanDirectory(srcDir);
  scanDirectory(pagesDir);
  scanDirectory(libDir);
}

// 2. Check for dangerous functions
function checkDangerousFunctions() {
  
  const srcDir = path.join(__dirname, '..', 'components');
  const pagesDir = path.join(__dirname, '..', 'pages');
  const libDir = path.join(__dirname, '..', 'lib');
  
  const dangerousFunctions = [
    'eval(',
    'Function(',
    'setTimeout(',
    'setInterval(',
    'document.write(',
    'innerHTML',
    'outerHTML'
  ];
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        dangerousFunctions.forEach(func => {
          if (content.includes(func)) {
            securityIssues.push({
              type: 'dangerous-function',
              file: filePath,
              function: func,
              severity: 'high',
              message: `Dangerous function ${func} found`
            });
          }
        });
      }
    });
  }
  
  scanDirectory(srcDir);
  scanDirectory(pagesDir);
  scanDirectory(libDir);
}

// 3. Check for input validation
function checkInputValidation() {
  
  const pagesDir = path.join(__dirname, '..', 'pages', 'api');
  
  if (!fs.existsSync(pagesDir)) return;
  
  const files = fs.readdirSync(pagesDir, { withFileTypes: true });
  
  files.forEach(file => {
    if (file.isDirectory()) {
      const subDir = path.join(pagesDir, file.name);
      const subFiles = fs.readdirSync(subDir, { withFileTypes: true });
      
      subFiles.forEach(subFile => {
        if (subFile.name.endsWith('.js')) {
          const filePath = path.join(subDir, subFile.name);
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Check if API endpoint has input validation
          if (content.includes('req.body') && !content.includes('validate') && !content.includes('schema')) {
            securityIssues.push({
              type: 'missing-validation',
              file: filePath,
              severity: 'high',
              message: 'API endpoint missing input validation'
            });
          }
        }
      });
    } else if (file.name.endsWith('.js')) {
      const filePath = path.join(pagesDir, file.name);
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('req.body') && !content.includes('validate') && !content.includes('schema')) {
        securityIssues.push({
          type: 'missing-validation',
          file: filePath,
          severity: 'high',
          message: 'API endpoint missing input validation'
        });
      }
    }
  });
}

// 4. Check for CORS configuration
function checkCORS() {
  
  const pagesDir = path.join(__dirname, '..', 'pages', 'api');
  
  if (!fs.existsSync(pagesDir)) return;
  
  const files = fs.readdirSync(pagesDir, { withFileTypes: true });
  let hasCORS = false;
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.name.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('cors') || content.includes('Access-Control-Allow-Origin')) {
          hasCORS = true;
        }
      }
    });
  }
  
  scanDirectory(pagesDir);
  
  if (!hasCORS) {
    securityRecommendations.push({
      type: 'cors-config',
      severity: 'medium',
      message: 'Consider implementing CORS configuration for API endpoints'
    });
  }
}

// 5. Check for rate limiting
function checkRateLimiting() {
  
  const pagesDir = path.join(__dirname, '..', 'pages', 'api');
  
  if (!fs.existsSync(pagesDir)) return;
  
  const files = fs.readdirSync(pagesDir, { withFileTypes: true });
  let hasRateLimit = false;
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.name.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('rate') || content.includes('limit') || content.includes('throttle')) {
          hasRateLimit = true;
        }
      }
    });
  }
  
  scanDirectory(pagesDir);
  
  if (!hasRateLimit) {
    securityRecommendations.push({
      type: 'rate-limiting',
      severity: 'medium',
      message: 'Consider implementing rate limiting for API endpoints'
    });
  }
}

// 6. Check for HTTPS enforcement
function checkHTTPS() {
  
  const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
  
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    
    if (!content.includes('https') && !content.includes('secure')) {
      securityRecommendations.push({
        type: 'https-config',
        severity: 'high',
        message: 'Ensure HTTPS is enforced in production'
      });
    }
  }
}

// 7. Check for security headers
function checkSecurityHeaders() {
  
  const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
  
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    
    const securityHeaders = [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy'
    ];
    
    securityHeaders.forEach(header => {
      if (!content.includes(header)) {
        securityRecommendations.push({
          type: 'security-headers',
          severity: 'medium',
          message: `Consider adding ${header} security header`
        });
      }
    });
  }
}

// Run all security checks
checkHardcodedSecrets();
checkDangerousFunctions();
checkInputValidation();
checkCORS();
checkRateLimiting();
checkHTTPS();
checkSecurityHeaders();

// Generate security report

if (securityIssues.length > 0) {
  securityIssues.forEach((issue, index) => {
  });
}

if (securityRecommendations.length > 0) {
  securityRecommendations.forEach((rec, index) => {
  });
}

if (securityIssues.length === 0 && securityRecommendations.length === 0) {
}


// Save security report
const securityReport = {
  timestamp: new Date().toISOString(),
  issues: securityIssues,
  recommendations: securityRecommendations,
  summary: {
    totalIssues: securityIssues.length,
    criticalIssues: securityIssues.filter(i => i.severity === 'critical').length,
    highIssues: securityIssues.filter(i => i.severity === 'high').length,
    mediumIssues: securityIssues.filter(i => i.severity === 'medium').length,
    recommendations: securityRecommendations.length
  }
};

fs.writeFileSync(
  path.join(__dirname, '..', 'security-audit-report.json'),
  JSON.stringify(securityReport, null, 2)
);


