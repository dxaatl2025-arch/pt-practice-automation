const PaymentsService = require('../service/paymentsService');
const { createPaymentIntentSchema, createManualPaymentSchema } = require('../schemas/paymentsSchemas');

class PaymentsController {
  constructor(paymentsService = null) {
    this.paymentsService = paymentsService || new PaymentsService();
  }

  createPaymentIntent = async (req, res) => {
    try {
      const validatedData = createPaymentIntentSchema.parse(req.body);
      const userId = req.user.id;

      const result = await this.paymentsService.createPaymentIntent(
        validatedData.leaseId,
        validatedData.amount,
        userId
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Create payment intent error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create payment intent'
      });
    }
  };

  createManualPayment = async (req, res) => {
    try {
      const validatedData = createManualPaymentSchema.parse(req.body);
      const landlordId = req.user.id;

      const payment = await this.paymentsService.createManualPayment(
        validatedData.leaseId,
        validatedData.amount,
        validatedData.paidAt,
        landlordId,
        validatedData.description
      );

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('❌ Create manual payment error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create manual payment'
      });
    }
  };

  getPayment = async (req, res) => {
    try {
      const paymentId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;

      const payment = await this.paymentsService.getPaymentById(paymentId, userId, userRole);

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('❌ Get payment error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get payment'
      });
    }
  };
}

module.exports = PaymentsController;