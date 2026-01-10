import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get service type from query parameter, default to software_development
    const serviceType = req.query.service_type || 'software_development';
    
    // Get approved partners for the specified service type (public endpoint)
    const partners = await prisma.partner.findMany({
      where: {
        service_type: serviceType,
        status: 'approved'
      },
      select: {
        id: true,
        company_name: true,
        description: true,
        experience_years: true,
        portfolio_url: true,
        phone: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.status(200).json({
      partners: partners.map(p => ({
        id: p.id,
        companyName: p.company_name,
        description: p.description,
        experienceYears: p.experience_years,
        portfolioUrl: p.portfolio_url,
        phone: p.phone,
        createdAt: p.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching public partners:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

