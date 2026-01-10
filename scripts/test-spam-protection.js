#!/usr/bin/env node

/**
 * Test script for spam protection and form validation
 * Tests various spam patterns and legitimate submissions
 */

// Check if fetch is available, use http/https as fallback
let fetch;
try {
  if (typeof globalThis.fetch === 'function') {
    fetch = globalThis.fetch;
  } else if (typeof fetch === 'function') {
    // Already available
    fetch = fetch;
  } else {
    // Try to use node-fetch if available
    try {
      fetch = require('node-fetch');
    } catch (e) {
      // Fallback to http/https for older Node versions
      const http = require('http');
      const https = require('https');
      const { URL } = require('url');
      
      fetch = async (url, options = {}) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        return new Promise((resolve, reject) => {
          const body = options.body ? JSON.stringify(options.body) : '';
          const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body),
              ...options.headers
            }
          };
          
          const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                statusText: res.statusMessage,
                text: async () => data,
                json: async () => {
                  try {
                    return JSON.parse(data);
                  } catch (e) {
                    throw new Error('Invalid JSON response');
                  }
                }
              });
            });
          });
          
          req.on('error', reject);
          if (body) req.write(body);
          req.end();
        });
      };
    }
  }
} catch (e) {
  console.error('Error: Could not initialize fetch:', e.message);
  console.error('Please use Node.js 18+ or install node-fetch: npm install node-fetch');
  process.exit(1);
}

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test cases
const testCases = [
  // SPAM PATTERNS - Should be rejected
  {
    name: 'Gibberish Name - Random Characters',
    data: {
      name: 'iogBYcDIsPFMMyOktn',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'This is a legitimate message to test if gibberish name is caught.'
    },
    shouldPass: false,
    expectedError: 'name'
  },
  {
    name: 'Gibberish Subject - Random Characters',
    data: {
      name: 'John Doe',
      email: 'test@example.com',
      subject: 'QkkXTwwJXKUYbODjYiMMhvX',
      message: 'This is a legitimate message to test if gibberish subject is caught.'
    },
    shouldPass: false,
    expectedError: 'subject'
  },
  {
    name: 'Gibberish Message - Random Characters',
    data: {
      name: 'John Doe',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'CXeWnXlaHxcnNlIL'
    },
    shouldPass: false,
    expectedError: 'message'
  },
  {
    name: 'Gibberish Name and Subject - Random Characters',
    data: {
      name: 'yEDZLINAVsIPCfUBQVzjo',
      email: 'test@example.com',
      subject: 'zDizdyMMUzRPEPYYEEBmuayY',
      message: 'This is a legitimate message.'
    },
    shouldPass: false,
    expectedError: 'name'
  },
  {
    name: 'Honeypot Field Filled - Bot Detection',
    data: {
      name: 'John Doe',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'This is a legitimate message.',
      website: 'http://spam-bot.com' // Honeypot field - should be empty
    },
    shouldPass: false,
    expectedError: 'honeypot'
  },
  {
    name: 'Message Too Short - Less than 5 words',
    data: {
      name: 'John Doe',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'Hi there.'
    },
    shouldPass: false,
    expectedError: 'message'
  },
  {
    name: 'Name Too Short',
    data: {
      name: 'A',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'This is a legitimate message with enough words to pass validation.'
    },
    shouldPass: false,
    expectedError: 'name'
  },
  {
    name: 'Keyboard Mashing Pattern',
    data: {
      name: 'qwertyuiop',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'This is a legitimate message with enough words to pass validation.'
    },
    shouldPass: false,
    expectedError: 'name'
  },
  {
    name: 'Repeated Characters',
    data: {
      name: 'aaaaaaa',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'This is a legitimate message with enough words to pass validation.'
    },
    shouldPass: false,
    expectedError: 'name'
  },
  {
    name: 'Alternating Pattern',
    data: {
      name: 'abababab',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'This is a legitimate message with enough words to pass validation.'
    },
    shouldPass: false,
    expectedError: 'name'
  },
  
  // LEGITIMATE PATTERNS - Should pass
  {
    name: 'Legitimate Submission - Valid Data',
    data: {
      name: 'John Smith',
      email: 'john.smith@example.com',
      subject: 'Inquiry about your services',
      message: 'I am interested in learning more about your services and would like to schedule a consultation.'
    },
    shouldPass: true
  },
  {
    name: 'Legitimate Submission - With Middle Name',
    data: {
      name: 'Mary Jane Smith',
      email: 'mary.smith@example.com',
      subject: 'Question about pricing',
      message: 'Hello, I would like to know more about your pricing structure and available packages for my business needs.'
    },
    shouldPass: true
  },
  {
    name: 'Legitimate Submission - Long Message',
    data: {
      name: 'Robert Johnson',
      email: 'robert@example.com',
      subject: 'Project inquiry',
      message: 'I am reaching out to discuss a potential project. We are looking for a custom solution that can help streamline our business operations. I would appreciate the opportunity to discuss this further with your team.'
    },
    shouldPass: true
  },
  {
    name: 'Legitimate Submission - International Name',
    data: {
      name: 'José García',
      email: 'jose.garcia@example.com',
      subject: 'Service inquiry',
      message: 'I am interested in your services and would like to learn more about how you can help with our project requirements.'
    },
    shouldPass: true
  }
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkServerConnection() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${BASE_URL}/api/contact/send`, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return false;
    }
    // Other errors might still mean server is reachable
    return true;
  }
}

async function testSubmission(testCase) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${BASE_URL}/api/contact/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.data),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let data;
    try {
      // Handle both text() and json() methods
      if (typeof response.text === 'function') {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } else if (typeof response.json === 'function') {
        data = await response.json();
      } else {
        data = {};
      }
    } catch (parseError) {
      data = { error: 'Failed to parse response', raw: parseError.message };
    }

    // For spam tests, we expect 400 status (rejected)
    // For legitimate tests, we expect 200 status (accepted)
    const passed = testCase.shouldPass 
      ? response.ok && response.status === 200
      : !response.ok && (response.status === 400 || response.status === 429);

    return {
      passed,
      status: response.status,
      response: data,
      testCase
    };
  } catch (error) {
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout - server may not be responding';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused - is the server running?';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Host not found - check the URL';
    }

    return {
      passed: false,
      status: 'ERROR',
      response: { error: errorMessage, code: error.code },
      testCase
    };
  }
}

async function runTests() {
  log('\n🧪 Testing Spam Protection System\n', 'cyan');
  log('=' .repeat(60), 'blue');
  log(`Testing against: ${BASE_URL}`, 'cyan');
  
  // Check server connection first
  log('\n🔍 Checking server connection...', 'yellow');
  const serverAvailable = await checkServerConnection();
  if (!serverAvailable) {
    log('❌ Cannot connect to server!', 'red');
    log(`   Make sure your Next.js server is running on ${BASE_URL}`, 'red');
    log('   Start it with: npm run dev', 'yellow');
    log('\n   Or test against production:', 'yellow');
    log('   $env:TEST_URL="https://develloinc.com"; npm run test-spam', 'yellow');
    process.exit(1);
  }
  log('✅ Server connection OK\n', 'green');
  
  let passedTests = 0;
  let failedTests = 0;
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    log(`\n[${i + 1}/${testCases.length}] ${testCase.name}`, 'yellow');
    log(`Expected: ${testCase.shouldPass ? 'PASS' : 'REJECT'}`, 'cyan');
    
    const result = await testSubmission(testCase);
    results.push(result);

    if (result.passed) {
      log('✅ Test PASSED', 'green');
      passedTests++;
    } else {
      log('❌ Test FAILED', 'red');
      log(`   Status: ${result.status}`, 'red');
      log(`   Response: ${JSON.stringify(result.response, null, 2)}`, 'red');
      failedTests++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('\n📊 Test Summary\n', 'cyan');
  log(`Total Tests: ${testCases.length}`, 'blue');
  log(`✅ Passed: ${passedTests}`, 'green');
  log(`❌ Failed: ${failedTests}`, 'red');
  log(`Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`, 'blue');

  // Detailed results
  log('\n📋 Detailed Results\n', 'cyan');
  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`${status} [${index + 1}] ${result.testCase.name}`, color);
    if (!result.passed) {
      log(`   Status: ${result.status}`, 'red');
      if (result.response.error) {
        log(`   Error: ${result.response.error}`, 'red');
      }
    }
  });

  // Recommendations
  if (failedTests > 0) {
    log('\n⚠️  Recommendations:', 'yellow');
    log('   - Review failed test cases above', 'yellow');
    log('   - Check validation logic in lib/formValidation.js', 'yellow');
    log('   - Verify API endpoints are using validation', 'yellow');
  } else {
    log('\n🎉 All tests passed! Spam protection is working correctly.', 'green');
  }

  log('\n' + '='.repeat(60) + '\n', 'blue');
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { testCases, runTests };
