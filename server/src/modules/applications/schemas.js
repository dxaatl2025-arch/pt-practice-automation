const { z } = require('zod');

const ApplicationCreateSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  
  // Applicant info - MATCH FRONTEND EXACTLY
  fullName: z.string().min(1, 'Full name is required'),
  dob: z.string().transform(str => new Date(str)),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  
  // Current address - MATCH FRONTEND EXACTLY
  currentAddress: z.string().min(1, 'Current address is required'),
  yearsAtAddress: z.number().min(0, 'Years at address must be positive'),
  reasonForMoving: z.string().optional(),
  
  // Employment - MATCH FRONTEND EXACTLY
  employerName: z.string().min(1, 'Employer name is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  employerAddress: z.string().min(1, 'Employer address is required'),
  employerPhone: z.string().min(10, 'Valid employer phone is required'),
  employmentLength: z.string().min(1, 'Employment length is required'),
  monthlyIncome: z.number().int().min(0, 'Valid monthly income is required'),
  otherIncome: z.string().optional(), // STRING not number
  
  // Rental history - MATCH FRONTEND EXACTLY
  prevAddress: z.string().optional(),
  prevLandlordName: z.string().optional(),
  prevLandlordContact: z.string().optional(),
  reasonForLeaving: z.string().optional(),
  wasLateRent: z.boolean().default(false),
  
  // Reference - MATCH FRONTEND EXACTLY
  refName: z.string().min(1, 'Reference name is required'),
  refRelationship: z.string().min(1, 'Reference relationship is required'),
  refContact: z.string().min(10, 'Valid reference contact is required'),
  
  // Household - MATCH FRONTEND EXACTLY
  occupants: z.number().int().min(1, 'Number of occupants is required'),
  
  // Pets - MATCH FRONTEND EXACTLY (include hasPets)
  hasPets: z.boolean().optional(),
  pets: z.array(z.object({
    type: z.string().min(1, 'Pet type is required'),
    count: z.number().int().min(1, 'Pet count must be at least 1'),
    description: z.string().min(1, 'Pet description is required')
  })).optional(),
  
  // Vehicles - MATCH FRONTEND EXACTLY (include hasVehicles)
  hasVehicles: z.boolean().optional(),
  vehicles: z.array(z.object({
    make: z.string().min(1, 'Vehicle make is required'),
    model: z.string().min(1, 'Vehicle model is required'),
    year: z.number().int().min(1990).max(2025, 'Vehicle year must be between 1990-2025'),
    license: z.string().min(1, 'License plate is required')
  })).optional(),
  
  // Disclosures - MATCH FRONTEND EXACTLY
  wasEvicted: z.boolean().default(false),
  felony: z.boolean().default(false),
  
  // Application details - MATCH FRONTEND EXACTLY
  desiredMoveIn: z.string().transform(str => new Date(str)),
  consentBackground: z.boolean().refine(val => val === true, {
    message: 'Background check consent is required'
  }),
  signature: z.string().min(1, 'Digital signature is required')
});

const ApplicationStatusSchema = z.object({
  status: z.enum(['APPROVED', 'DECLINED'])
});

module.exports = {
  ApplicationCreateSchema,
  ApplicationStatusSchema
};