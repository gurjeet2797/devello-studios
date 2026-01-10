import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import { UserService } from '../../../lib/userService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
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

      // Get all addresses for user
      const addresses = await prisma.userAddress.findMany({
        where: { user_id: prismaUser.id },
        orderBy: [
          { is_primary: 'desc' },
          { created_at: 'desc' }
        ],
      });

      return res.status(200).json({ success: true, addresses });
    } catch (error) {
      console.error('Error fetching addresses:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
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

      const { title, address_line1, address_line2, city, state, zip_code, country, is_primary } = req.body;

      // Validate required fields
      if (!address_line1 || !city || !state || !zip_code) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // If setting as primary, unset other primary addresses
      if (is_primary) {
        await prisma.userAddress.updateMany({
          where: { user_id: prismaUser.id, is_primary: true },
          data: { is_primary: false },
        });
      }

      // Create new address
      const address = await prisma.userAddress.create({
        data: {
          user_id: prismaUser.id,
          title: title || null,
          address_line1,
          address_line2: address_line2 || null,
          city,
          state,
          zip_code,
          country: country || 'US',
          is_primary: is_primary || false,
        },
      });

      return res.status(201).json({ success: true, address });
    } catch (error) {
      console.error('Error creating address:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

