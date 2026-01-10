import { createSupabaseAuthClient } from '../../../../../lib/supabaseClient';
import { UserService } from '../../../../../lib/userService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get user
    const supabase = createSupabaseAuthClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const prismaUser = await UserService.getOrCreateUser(user.id, user.email);
    if (!prismaUser) {
      return res.status(500).json({ error: 'Failed to retrieve user account' });
    }

    // Verify address belongs to user
    const existingAddress = await prisma.userAddress.findUnique({
      where: { id },
    });

    if (!existingAddress || existingAddress.user_id !== prismaUser.id) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Unset all other primary addresses
    await prisma.userAddress.updateMany({
      where: { user_id: prismaUser.id, is_primary: true },
      data: { is_primary: false },
    });

    // Set this address as primary
    const address = await prisma.userAddress.update({
      where: { id },
      data: { is_primary: true },
    });

    return res.status(200).json({ success: true, address });
  } catch (error) {
    console.error('Error setting primary address:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

