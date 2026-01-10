import { createSupabaseServerClient } from '../../../lib/supabaseClient';
import { UserService } from '../../../lib/userService';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create Supabase client for auth only
    const supabase = createSupabaseServerClient();
    
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Validate token format
    if (!token || token.length < 10) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    // Verify the token and get user (Supabase auth only)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ [PARTNERS_APPLY] Auth error:', authError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.log('✅ [PARTNERS_APPLY] User authenticated:', {
      userId: user.id,
      email: user.email
    });

    // Get or create user in Prisma (like profile API does)
    const prismaUser = await UserService.getOrCreateUser(user.id, user.email);

    // Get form data from request body
    const {
      companyName,
      serviceType,
      yearsExperience,
      phone,
      subservices,
      materials,
      products,
      entityType,
      employeeCount
    } = req.body;

    // Validate required fields
    if (!companyName || !serviceType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Company name and service type are required'
      });
    }

    // Validate service_type matches allowed values
    const allowedServiceTypes = ['construction', 'software_development', 'consulting', 'manufacturing'];
    // Map our frontend values to database values
    const serviceTypeMap = {
      'construction': 'construction',
      'software_dev': 'software_development', // Map frontend value
      'consulting': 'consulting',
      'manufacturing': 'manufacturing'
    };
    
    const mappedServiceType = serviceTypeMap[serviceType] || serviceType;
    if (!allowedServiceTypes.includes(mappedServiceType)) {
      return res.status(400).json({ 
        error: 'Invalid service type',
        details: `Service type must be one of: ${allowedServiceTypes.join(', ')}`
      });
    }

    // Check if user already has an application (using Prisma)
    const existingApplication = await prisma.partner.findUnique({
      where: { user_id: prismaUser.id },
      select: { id: true, status: true }
    });

    if (existingApplication) {
      return res.status(400).json({ 
        error: 'Application already exists',
        status: existingApplication.status,
        message: `You already have a ${existingApplication.status} application.`
      });
    }

    // Prepare application data (store additional fields in JSON)
    const applicationData = {
      submitted_at: new Date().toISOString(),
      submitted_email: user.email,
      subservices: subservices || [],
      materials: materials || [],
      products: products || [],
      entityType: entityType || null,
      employeeCount: employeeCount || null,
      yearsExperience: yearsExperience || null // Store as string since it can be "<1", "1-2", etc.
    };

    console.log('🔍 [PARTNERS_APPLY] Inserting application data:', {
      userId: prismaUser.id,
      companyName: companyName,
      serviceType: mappedServiceType,
      yearsExperience: yearsExperience
    });

    // Parse yearsExperience - it can be a string like "<1", "1-2", "3-5", etc.
    // Try to extract a numeric value, or store null if it's not parseable
    let experienceYearsInt = null;
    if (yearsExperience) {
      // Try to parse ranges like "1-2" (take first number), "<1" (store as null), "10+" (take 10)
      const match = yearsExperience.match(/^(\d+)/);
      if (match) {
        experienceYearsInt = parseInt(match[1]);
      }
    }

    // Insert new application using Prisma (handles defaults automatically)
    const newApplication = await prisma.partner.create({
      data: {
        user_id: prismaUser.id,
        company_name: companyName,
        service_type: mappedServiceType,
        status: 'pending',
        experience_years: experienceYearsInt,
        description: null, // Removed from form
        phone: phone || null,
        portfolio_url: null, // Removed from form
        application_data: applicationData
      },
      select: {
        id: true,
        status: true,
        company_name: true
      }
    });

    console.log('✅ [PARTNERS_APPLY] Application submitted successfully:', {
      applicationId: newApplication.id,
      userId: prismaUser.id,
      companyName: companyName
    });

    return res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: newApplication.id,
        status: newApplication.status,
        companyName: newApplication.company_name
      }
    });

  } catch (error) {
    console.error('❌ [PARTNERS_APPLY] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
