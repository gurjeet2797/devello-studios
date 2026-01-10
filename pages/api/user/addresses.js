import { getAuthenticatedUser } from '../../../lib/authUtils';
import prisma from '../../../lib/prisma';

/**
 * GET /api/user/addresses - Fetch user's saved addresses
 * POST /api/user/addresses - Create a new address
 * PUT /api/user/addresses - Update an existing address
 * DELETE /api/user/addresses - Delete an address
 */
export default async function handler(req, res) {
  try {
    const { supabaseUser, prismaUser, error } = await getAuthenticatedUser(req);
    
    if (error || !supabaseUser || !prismaUser) {
      return res.status(401).json({ error: error || 'Unauthorized' });
    }

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, prismaUser);
      case 'POST':
        return handlePost(req, res, prismaUser);
      case 'PUT':
        return handlePut(req, res, prismaUser);
      case 'DELETE':
        return handleDelete(req, res, prismaUser);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in addresses API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req, res, prismaUser) {
  const addresses = await prisma.userAddress.findMany({
    where: {
      user_id: prismaUser.id
    },
    orderBy: [
      { is_primary: 'desc' },
      { created_at: 'desc' }
    ]
  });

  return res.status(200).json({ addresses });
}

async function handlePost(req, res, prismaUser) {
  const { 
    title, 
    address_line1, 
    address_line2, 
    city, 
    state, 
    zip_code, 
    country,
    is_primary 
  } = req.body;

  // Validate required fields
  if (!title || !address_line1 || !city || !state || !zip_code) {
    return res.status(400).json({ 
      error: 'Missing required fields: title, address_line1, city, state, zip_code' 
    });
  }

  // If this is set as primary, unset other primary addresses
  if (is_primary) {
    await prisma.userAddress.updateMany({
      where: {
        user_id: prismaUser.id,
        is_primary: true
      },
      data: {
        is_primary: false
      }
    });
  }

  const address = await prisma.userAddress.create({
    data: {
      user_id: prismaUser.id,
      title,
      address_line1,
      address_line2,
      city,
      state,
      zip_code,
      country: country || 'US',
      is_primary: is_primary || false
    }
  });

  return res.status(201).json({ address });
}

async function handlePut(req, res, prismaUser) {
  const { 
    id,
    title, 
    address_line1, 
    address_line2, 
    city, 
    state, 
    zip_code, 
    country,
    is_primary 
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Address ID is required' });
  }

  // Verify ownership
  const existingAddress = await prisma.userAddress.findFirst({
    where: {
      id,
      user_id: prismaUser.id
    }
  });

  if (!existingAddress) {
    return res.status(404).json({ error: 'Address not found' });
  }

  // If this is being set as primary, unset other primary addresses
  if (is_primary && !existingAddress.is_primary) {
    await prisma.userAddress.updateMany({
      where: {
        user_id: prismaUser.id,
        is_primary: true,
        id: { not: id }
      },
      data: {
        is_primary: false
      }
    });
  }

  const address = await prisma.userAddress.update({
    where: { id },
    data: {
      title: title ?? existingAddress.title,
      address_line1: address_line1 ?? existingAddress.address_line1,
      address_line2: address_line2 ?? existingAddress.address_line2,
      city: city ?? existingAddress.city,
      state: state ?? existingAddress.state,
      zip_code: zip_code ?? existingAddress.zip_code,
      country: country ?? existingAddress.country,
      is_primary: is_primary ?? existingAddress.is_primary
    }
  });

  return res.status(200).json({ address });
}

async function handleDelete(req, res, prismaUser) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Address ID is required' });
  }

  // Verify ownership
  const existingAddress = await prisma.userAddress.findFirst({
    where: {
      id,
      user_id: prismaUser.id
    }
  });

  if (!existingAddress) {
    return res.status(404).json({ error: 'Address not found' });
  }

  await prisma.userAddress.delete({
    where: { id }
  });

  return res.status(200).json({ success: true });
}

