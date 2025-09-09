const { z } = require('zod');

const signedUrlSchema = z.object({
  entityType: z.enum(['application', 'property', 'maintenance', 'lease'], {
    required_error: 'Entity type is required'
  }),
  entityId: z.string().min(1, 'Entity ID is required'),
  contentType: z.string().regex(/^(image|application|text)\//, 'Invalid content type'),
  filename: z.string().min(1, 'Filename is required').optional()
});

module.exports = {
  signedUrlSchema
};