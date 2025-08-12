// server/src/controllers/paymentController.js - REFACTORED TO USE REPOSITORY
const repositoryFactory = require('../repositories/factory');

class PaymentController {
  constructor() {
    // Dependency injection - repository is injected via factory
    this.paymentRepo = repositoryFactory.getPaymentRepository();
    console.log(`📋 PaymentController using ${repositoryFactory.dbTarget} database`);
  }

  // Get all payments - SAME API, different backend
  getPayments = async (req, res) => {
    try {
      const { page = 1, limit = 10, status, type, leaseId, tenantId } = req.query;
      const skip = (page - 1) * limit;
      
      const filters = {};
      if (status) filters.status = status;
      if (type) filters.paymentType = type;
      if (leaseId) filters.leaseId = leaseId;
      if (tenantId) filters.tenantId = tenantId;
      
      // Repository abstracts the database implementation
      const result = await this.paymentRepo.list({
        filters,
        skip: parseInt(skip),
        limit: parseInt(limit)
      });
      
      // API response identical regardless of database
      res.json({
        success: true,
        data: result.payments,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get payment by ID - SAME API, different backend
  getPayment = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Repository abstracts the database implementation
      const payment = await this.paymentRepo.findById(id);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
      
      // API response identical regardless of database
      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create payment - SAME API, different backend
  createPayment = async (req, res) => {
    try {
      const paymentData = {
        ...req.body,
        // Add any default values or processing here
      };
      
      // Repository handles the database implementation
      const payment = await this.paymentRepo.create(paymentData);
      
      // API response identical regardless of database
      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: payment
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update payment
  updatePayment = async (req, res) => {
    try {
      const { id } = req.params;
      
      const payment = await this.paymentRepo.update(id, req.body);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Payment updated successfully',
        data: payment
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete payment
  deletePayment = async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await this.paymentRepo.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Payment deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get payments by lease
  getPaymentsByLease = async (req, res) => {
    try {
      const { leaseId } = req.params;
      const { limit } = req.query;
      
      const payments = await this.paymentRepo.findByLeaseId(leaseId, {
        limit: limit ? parseInt(limit) : undefined
      });
      
      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get payments by tenant
  getPaymentsByTenant = async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { limit } = req.query;
      
      const payments = await this.paymentRepo.findByTenantId(tenantId, {
        limit: limit ? parseInt(limit) : undefined
      });
      
      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get overdue payments
  getOverduePayments = async (req, res) => {
    try {
      const payments = await this.paymentRepo.findOverduePayments();
      
      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get upcoming payments
  getUpcomingPayments = async (req, res) => {
    try {
      const { days = 7 } = req.query;
      
      const payments = await this.paymentRepo.findUpcomingPayments(parseInt(days));
      
      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mark payment as paid
  markPaymentPaid = async (req, res) => {
    try {
      const { id } = req.params;
      const { paidDate, transactionId, paymentMethod } = req.body;
      
      const payment = await this.paymentRepo.update(id, {
        status: 'paid',
        paidDate: paidDate || new Date(),
        transactionId,
        paymentMethod
      });
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Payment marked as paid',
        data: payment
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

// Export controller instance
const paymentController = new PaymentController();
module.exports = paymentController;