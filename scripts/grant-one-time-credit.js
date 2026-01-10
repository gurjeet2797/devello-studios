#!/usr/bin/env node

/**
 * Grant a one-time upload credit to a user
 * Usage examples:
 *   node scripts/grant-one-time-credit.js --email user@example.com --paymentIntentId pi_xxx --amount 99 --currency usd --purchaseType single_upload --credits 1
 *   node scripts/grant-one-time-credit.js --userId <uuid> --paymentIntentId pi_xxx --amount 99 --currency usd --purchaseType single_upload --credits 1
 */

import prisma from '../lib/prisma.js';
import { UploadAllowanceService } from '../lib/uploadAllowanceService.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const val = args[i + 1];
    if (!key || !key.startsWith('--')) continue;
    out[key.substring(2)] = val;
  }
  return out;
}

async function main() {
  const {
    email,
    userId: userIdArg,
    paymentIntentId,
    amount = '99',
    currency = 'usd',
    purchaseType = 'single_upload',
    credits = '1',
    sessionId
  } = parseArgs();

  if (!paymentIntentId) {
    console.error('Missing required --paymentIntentId');
    process.exit(1);
  }

  let userId = userIdArg;

  try {
    if (!userId) {
      if (!email) {
        console.error('Provide either --userId or --email');
        process.exit(1);
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        console.error(`User not found for email: ${email}`);
        process.exit(1);
      }
      userId = user.id;
    }

    const numericAmount = Number(amount);
    const numericCredits = parseInt(credits, 10);

      userId,
      email,
      paymentIntentId,
      amount: numericAmount,
      currency,
      purchaseType,
      credits: numericCredits,
      sessionId
    });

    const result = await UploadAllowanceService.addOneTimeCredits(userId, numericCredits, {
      paymentIntentId,
      sessionId,
      amount: numericAmount,
      currency,
      purchaseType
    });

      purchaseId: result.id,
      uploadsGranted: result.uploads_granted,
      status: result.status
    });
  } catch (err) {
    console.error('❌ Failed to grant credits:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


