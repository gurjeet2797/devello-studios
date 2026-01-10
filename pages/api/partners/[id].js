import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Partner ID is required' });
    }

    // Get partner details including subservices from application_data
    const partner = await prisma.partner.findUnique({
      where: {
        id: id,
        status: 'approved' // Only return approved partners
      },
      select: {
        id: true,
        company_name: true,
        description: true,
        experience_years: true,
        portfolio_url: true,
        service_type: true,
        application_data: true
      }
    });

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Extract subservices from application_data
    const subservices = partner.application_data?.subservices || [];

    return res.status(200).json({
      partner: {
        id: partner.id,
        companyName: partner.company_name,
        description: partner.description,
        experienceYears: partner.experience_years,
        portfolioUrl: partner.portfolio_url,
        serviceType: partner.service_type,
        subservices: subservices
      }
    });
  } catch (error) {
    console.error('Error fetching partner details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
