# Spam Protection Test Script

This script tests the spam protection and form validation system to ensure it correctly rejects spam submissions while allowing legitimate ones.

## Usage

### Basic Usage (localhost)
```bash
npm run test-spam
```

### Test Against Production/Staging
```bash
TEST_URL=https://develloinc.com npm run test-spam
```

### Direct Node Execution
```bash
node scripts/test-spam-protection.js
```

## What It Tests

### Spam Patterns (Should be REJECTED):
1. ✅ Gibberish names (random character strings)
2. ✅ Gibberish subjects (random character strings)
3. ✅ Gibberish messages (random character strings)
4. ✅ Honeypot field filled (bot detection)
5. ✅ Messages too short (less than 5 words)
6. ✅ Names too short (less than 2 characters)
7. ✅ Keyboard mashing patterns (qwerty, asdf, etc.)
8. ✅ Repeated characters (aaaaaaa)
9. ✅ Alternating patterns (abababab)

### Legitimate Patterns (Should PASS):
1. ✅ Valid names with proper formatting
2. ✅ Valid email addresses
3. ✅ Meaningful subjects
4. ✅ Messages with sufficient word count
5. ✅ International names (with special characters)
6. ✅ Long, detailed messages

## Test Results

The script will output:
- ✅/❌ for each test case
- Status codes and error messages
- Summary statistics
- Detailed results

## Example Output

```
🧪 Testing Spam Protection System
============================================================

[1/14] Gibberish Name - Random Characters
Expected: REJECT
❌ Test FAILED
   Status: 400
   Response: { "error": "Name appears to be invalid. Please enter your real name." }

[2/14] Legitimate Submission - Valid Data
Expected: PASS
✅ Test PASSED

📊 Test Summary
Total Tests: 14
✅ Passed: 12
❌ Failed: 2
Success Rate: 85.7%
```

## Customization

You can modify the test cases in `scripts/test-spam-protection.js` to add your own test scenarios.

## Notes

- The script includes a 500ms delay between tests to avoid rate limiting
- Tests run against the `/api/contact/send` endpoint
- All tests use the same endpoint but you can modify to test other form endpoints
