// server/src/controllers/aiController.js
const { generateLeaseAgreement } = require('../services/openaiService');
const prisma = require('../config/prisma');

const generateLease = async (req, res) => {
  try {
    const { leaseTerms, propertyId } = req.body;

    // Validation
    if (!leaseTerms || typeof leaseTerms !== 'string' || leaseTerms.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lease terms are required and must be a non-empty string'
      });
    }

    // Optional: Get property information if propertyId is provided
    let propertyInfo = {};
    if (propertyId) {
      try {
const property = await prisma.property.findUnique({
  where: { id: propertyId }
});
if (property) {
  propertyInfo = {
    address: property.address,
    type: property.type,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms
  };
}
      } catch (error) {
        console.log('Property lookup failed, continuing without property info:', error.message);
      }
    }

    // Generate lease using OpenAI
    const result = await generateLeaseAgreement(leaseTerms, propertyInfo);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate lease agreement',
        error: result.error
      });
    }

    // Log usage for monitoring
    console.log(`Lease generated successfully. Tokens used: ${result.tokensUsed}`);

    return res.status(200).json({
      success: true,
      message: 'Lease agreement generated successfully',
      leaseDocument: result.leaseDocument,
      tokensUsed: result.tokensUsed,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Generate lease error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while generating lease',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  generateLease
};