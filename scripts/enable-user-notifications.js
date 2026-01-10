// Script to enable email notifications for a user
// Usage: node scripts/enable-user-notifications.js <supabase_user_id>

import prisma from '../lib/prisma.js';

async function enableUserNotifications(supabaseUserId) {
  try {
    console.log('🔍 Looking up user...', { supabaseUserId });

    // Find user by supabase_user_id
    const user = await prisma.user.findUnique({
      where: { supabase_user_id: supabaseUserId },
      include: { profile: true }
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log('✅ Found user:', {
      id: user.id,
      email: user.email,
      hasProfile: !!user.profile,
      currentNotificationsEnabled: user.profile?.email_notifications_enabled || false
    });

    // Update or create profile with notifications enabled
    if (!user.profile) {
      console.log('📝 Creating profile with notifications enabled...');
      await prisma.userProfile.create({
        data: {
          user_id: user.id,
          email_notifications_enabled: true
        }
      });
    } else {
      console.log('📝 Updating profile to enable notifications...');
      await prisma.userProfile.update({
        where: { user_id: user.id },
        data: {
          email_notifications_enabled: true
        }
      });
    }

    console.log('✅ Email notifications enabled successfully!');
    
    // Verify
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true }
    });

    console.log('✅ Verification:', {
      emailNotificationsEnabled: updatedUser.profile?.email_notifications_enabled
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get supabase_user_id from command line args
const supabaseUserId = process.argv[2];

if (!supabaseUserId) {
  console.error('❌ Usage: node scripts/enable-user-notifications.js <supabase_user_id>');
  console.error('   Or: node scripts/enable-user-notifications.js <email>');
  process.exit(1);
}

// If it looks like an email, find user by email first
if (supabaseUserId.includes('@')) {
  prisma.user.findUnique({
    where: { email: supabaseUserId }
  }).then(user => {
    if (user) {
      enableUserNotifications(user.supabase_user_id);
    } else {
      console.error('❌ User not found with email:', supabaseUserId);
      process.exit(1);
    }
  });
} else {
  enableUserNotifications(supabaseUserId);
}

