#!/usr/bin/env node

/**
 * Debug Mode Toggle Script
 * 
 * This script allows toggling debug mode in production for troubleshooting.
 * Use with caution - debug mode exposes sensitive information.
 * 
 * Usage:
 *   node scripts/toggle-debug.js on   # Enable debug mode
 *   node scripts/toggle-debug.js off  # Disable debug mode
 *   node scripts/toggle-debug.js     # Show current status
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(process.cwd(), '.env.local');

function getCurrentDebugMode() {
  try {
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    const debugMatch = envContent.match(/DEBUG_MODE=(.+)/);
    return debugMatch ? debugMatch[1].trim() === 'true' : false;
  } catch (error) {
    return false;
  }
}

function setDebugMode(enabled) {
  let envContent = '';
  
  try {
    envContent = fs.readFileSync(ENV_FILE, 'utf8');
  } catch (error) {
    // File doesn't exist, create it
    envContent = '';
  }
  
  const debugRegex = /DEBUG_MODE=.+/;
  const newDebugLine = `DEBUG_MODE=${enabled}`;
  
  if (debugRegex.test(envContent)) {
    envContent = envContent.replace(debugRegex, newDebugLine);
  } else {
    envContent += envContent.endsWith('\n') ? '' : '\n';
    envContent += newDebugLine + '\n';
  }
  
  fs.writeFileSync(ENV_FILE, envContent);
}

function main() {
  const command = process.argv[2];
  const currentMode = getCurrentDebugMode();
  
  switch (command) {
    case 'on':
      if (currentMode) {
      } else {
        setDebugMode(true);
      }
      break;
      
    case 'off':
      if (!currentMode) {
      } else {
        setDebugMode(false);
      }
      break;
      
    default:
      if (currentMode) {
      }
      break;
  }
}

main(); 
