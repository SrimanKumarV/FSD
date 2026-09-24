/**
 * Alumnex Connect - Standalone Weekly Digest & SMTP Activity Trigger
 * 
 * Usage:
 *   node scripts/sendWeeklyDigest.js                           # Runs for all eligible users
 *   node scripts/sendWeeklyDigest.js --test=you@example.com    # Sends a single test email
 *   node scripts/sendWeeklyDigest.js --dry-run                 # Simulates without sending
 *   node scripts/sendWeeklyDigest.js --force                   # Ignores 6-day cooldown
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { runWeeklyEngagementJob } = require('../jobs/engagementCron');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const testArg = args.find(a => a.startsWith('--test='));
const testEmail = testArg ? testArg.split('=')[1] : null;

async function main() {
  console.log('='.repeat(60));
  console.log('  ALUMNEX CONNECT — WEEKLY DIGEST & SMTP ACTIVITY RUNNER');
  console.log('='.repeat(60));
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Dry Run: ${isDryRun}`);
  console.log(`Force Send: ${isForce}`);
  console.log(`Target: ${testEmail ? `Test recipient (${testEmail})` : 'All eligible users'}`);
  console.log('-'.repeat(60));

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/alumnex-connect';
  
  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4
    });
    console.log('Connected to MongoDB successfully.\n');

    const result = await runWeeklyEngagementJob({
      dryRun: isDryRun,
      forceAll: isForce,
      testEmail: testEmail,
      delayMs: 300
    });

    console.log('\n' + '='.repeat(60));
    console.log('  EXECUTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Status:            ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Eligible Users:    ${result.totalEligible}`);
    console.log(`Emails Dispatched: ${result.sentCount}`);
    console.log(`Inactive Users:    ${result.inactiveUsersCount} (inactivity template sent)`);
    console.log(`Skipped (Recent):  ${result.skippedCount}`);
    console.log(`Failed / Errors:   ${result.failedCount}`);
    console.log(`Duration:          ${(result.durationMs / 1000).toFixed(2)}s`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('\nErrors encountered:');
      result.errors.forEach(e => console.log(`  - ${e.email}: ${e.error}`));
    }

    console.log('='.repeat(60));

    await mongoose.connection.close();
  } catch (err) {
    console.error('Fatal execution error:', err);
    try { await mongoose.connection.close(); } catch (_) {}
    process.exitCode = 1;
  }
}

main();
