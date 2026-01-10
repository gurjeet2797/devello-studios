#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.next/**',
  'scripts/**',
  '*.config.js',
  '*.config.ts',
  'test/**',
  'tests/**',
  '__tests__/**',
  '*.test.js',
  '*.test.ts',
  '*.spec.js',
  '*.spec.ts'
];

// Console methods to remove in production
const CONSOLE_METHODS = [
  'console.info', 
  'console.debug',
  'console.warn'
];

// Keep console.error for production error tracking
const KEEP_IN_PRODUCTION = [
  'console.error'
];

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(filePath);
  });
}

function removeConsoleLogs(content, filePath) {
  let modified = false;
  let newContent = content;

  CONSOLE_METHODS.forEach(method => {
    const regex = new RegExp(`\\s*${method.replace('.', '\\.')}\\s*\\([^)]*\\);?\\s*`, 'g');
    const matches = newContent.match(regex);
    if (matches) {
      newContent = newContent.replace(regex, '');
      modified = true;
    }
  });

    // Add import for production logger
    if (!newContent.includes('import productionLogger')) {
      newContent = newContent.replace(
        /import.*from.*['"]\.\.\/lib\/logger['"];?\s*/,
        (match) => {
          return match + "import productionLogger from '../lib/productionLogger';\n";
        }
      );
    }

    newContent = newContent.replace(/console\.log/g, 'productionLogger.log');
    modified = true;
  }

  return { content: newContent, modified };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, modified } = removeConsoleLogs(content, filePath);
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  
  // Find all JavaScript and TypeScript files
  const patterns = [
    '**/*.js',
    '**/*.jsx', 
    '**/*.ts',
    '**/*.tsx'
  ];
  
  let totalProcessed = 0;
  let totalModified = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { 
      cwd: process.cwd(),
      ignore: EXCLUDE_PATTERNS
    });
    
    files.forEach(file => {
      if (!shouldExcludeFile(file)) {
        totalProcessed++;
        if (processFile(file)) {
          totalModified++;
        }
      }
    });
  });
  
  
  if (totalModified > 0) {
  } else {
  }
}

if (require.main === module) {
  main();
}

module.exports = { removeConsoleLogs, processFile };
