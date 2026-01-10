import { getAuthenticatedUser } from '../../../lib/authUtils';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await getAuthenticatedUser(req, res);
    if (!auth) {
      return;
    }

    // Check if user has a partner application (using Prisma)
    const partnerData = await prisma.partner.findUnique({
      where: { user_id: auth.prismaUser.id }
    });

    console.log('✅ [PARTNERS_STATUS] Query result:', {
      hasData: !!partnerData,
      status: partnerData?.status
    });

    // Return status
    if (!partnerData) {
      return res.status(200).json({
        isPartner: false,
        status: 'not_applied',
        partnerData: null
      });
    }

    return res.status(200).json({
      isPartner: partnerData.status === 'approved',
      status: partnerData.status,
      partnerData: {
        id: partnerData.id,
        companyName: partnerData.company_name,
        serviceType: partnerData.service_type,
        status: partnerData.status,
        experienceYears: partnerData.experience_years,
        description: partnerData.description,
        phone: partnerData.phone,
        portfolioUrl: partnerData.portfolio_url,
        appliedAt: partnerData.created_at,
        approvedAt: partnerData.approved_at,
        approvedBy: partnerData.approved_by
      }
    });

  } catch (error) {
    console.error('❌ [PARTNERS_STATUS] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
