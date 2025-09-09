const { z } = require('zod');

const createPaymentIntentSchema = z.object({
  leaseId: z.string().min(1, 'Lease ID is required'),
  amount: z.number().positive('Amount must be positive')
});

const createManualPaymentSchema = z.object({
  leaseId: z.string().min(1, 'Lease ID is required'),
  amount: z.number().positive('Amount must be positive'),
  paidAt: z.string().datetime().optional(),
  description: z.string().optional()
});

module.exports = {
  createPaymentIntentSchema,
  createManualPaymentSchema
};