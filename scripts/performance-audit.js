const fs = require('fs');
const path = require('path');

// Performance audit script for Devello Inc

// Check for common performance issues
const issues = [];
const recommendations = [];

function checkConsoleLogs() {
  
  const srcDir = path.join(__dirname, '..', 'components');
  const pagesDir = path.join(__dirname, '..', 'pages');
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
          issues.push({
            type: 'console-logs',
            file: filePath,
            severity: 'medium',
            message: 'Console logs found in production code'
          });
        }
      }
    });
  }
  
  scanDirectory(srcDir);
  scanDirectory(pagesDir);
}

// 2. Check for large dependencies
function checkDependencies() {
  
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const largeDeps = [
    'framer-motion',
    'react-spring',
    'three',
    'chart.js',
    'd3'
  ];
  
  largeDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      recommendations.push({
        type: 'large-dependency',
        dependency: dep,
        message: `Consider code-splitting for ${dep}`
      });
    }
  });
}

// 3. Check for missing React.memo usage
function checkReactMemo() {
  
  const srcDir = path.join(__dirname, '..', 'components');
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for components that could benefit from React.memo
        if (content.includes('export default function') && 
            !content.includes('React.memo') && 
            !content.includes('memo(') &&
            content.includes('props')) {
          recommendations.push({
            type: 'react-memo',
            file: filePath,
            message: 'Consider wrapping component with React.memo for performance'
          });
        }
      }
    });
  }
  
  scanDirectory(srcDir);
}

// 4. Check for missing useMemo/useCallback
function checkHooks() {
  
  const srcDir = path.join(__dirname, '..', 'components');
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for expensive calculations that could use useMemo
        if (content.includes('useState') && 
            (content.includes('.map(') || content.includes('.filter(') || content.includes('.reduce(')) &&
            !content.includes('useMemo')) {
          recommendations.push({
            type: 'use-memo',
            file: filePath,
            message: 'Consider using useMemo for expensive calculations'
          });
        }
        
        // Check for functions that could use useCallback
        if (content.includes('useEffect') && 
            content.includes('function') && 
            !content.includes('useCallback')) {
          recommendations.push({
            type: 'use-callback',
            file: filePath,
            message: 'Consider using useCallback for functions passed to useEffect'
          });
        }
      }
    });
  }
  
  scanDirectory(srcDir);
}

// 5. Check for missing error boundaries
function checkErrorBoundaries() {
  
  const pagesDir = path.join(__dirname, '..', 'pages');
  const hasErrorBoundary = fs.existsSync(path.join(pagesDir, '_error.js'));
  
  if (!hasErrorBoundary) {
    issues.push({
      type: 'error-boundary',
      severity: 'high',
      message: 'Missing error boundary - add _error.js to pages directory'
    });
  }
}

// 6. Check for security issues
function checkSecurity() {
  
  const srcDir = path.join(__dirname, '..', 'components');
  const pagesDir = path.join(__dirname, '..', 'pages');
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Check for dangerous patterns
          if (content.includes('dangerouslySetInnerHTML')) {
            issues.push({
              type: 'security',
              file: filePath,
              severity: 'high',
              message: 'dangerouslySetInnerHTML found - ensure content is sanitized'
            });
          }
          
          if (content.includes('eval(') || content.includes('Function(')) {
            issues.push({
              type: 'security',
              file: filePath,
              severity: 'critical',
              message: 'eval() or Function() found - security risk'
            });
          }
        }
    });
  }
  
  scanDirectory(srcDir);
  scanDirectory(pagesDir);
}

// Run all checks
checkConsoleLogs();
checkDependencies();
checkReactMemo();
checkHooks();
checkErrorBoundaries();
checkSecurity();

// Generate report

if (issues.length > 0) {
  issues.forEach((issue, index) => {
  });
}

if (recommendations.length > 0) {
  recommendations.forEach((rec, index) => {
  });
}

if (issues.length === 0 && recommendations.length === 0) {
}


// Save report to file
const report = {
  timestamp: new Date().toISOString(),
  issues,
  recommendations,
  summary: {
    totalIssues: issues.length,
    criticalIssues: issues.filter(i => i.severity === 'critical').length,
    highIssues: issues.filter(i => i.severity === 'high').length,
    mediumIssues: issues.filter(i => i.severity === 'medium').length,
    recommendations: recommendations.length
  }
};

fs.writeFileSync(
  path.join(__dirname, '..', 'performance-audit-report.json'),
  JSON.stringify(report, null, 2)
);


