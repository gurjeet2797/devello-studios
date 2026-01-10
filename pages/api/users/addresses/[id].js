import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import { UserService } from '../../../../lib/userService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
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

      const { title, address_line1, address_line2, city, state, zip_code, country, is_primary } = req.body;

      // If setting as primary, unset other primary addresses
      if (is_primary) {
        await prisma.userAddress.updateMany({
          where: { user_id: prismaUser.id, is_primary: true, id: { not: id } },
          data: { is_primary: false },
        });
      }

      // Update address
      const address = await prisma.userAddress.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(address_line1 && { address_line1 }),
          ...(address_line2 !== undefined && { address_line2 }),
          ...(city && { city }),
          ...(state && { state }),
          ...(zip_code && { zip_code }),
          ...(country && { country }),
          ...(is_primary !== undefined && { is_primary }),
        },
      });

      return res.status(200).json({ success: true, address });
    } catch (error) {
      console.error('Error updating address:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
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

      await prisma.userAddress.delete({
        where: { id },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting address:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

