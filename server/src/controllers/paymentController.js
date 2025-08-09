const { validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const LeaseAgreement = require('../models/LeaseAgreement');

const paymentController = {
  getPayments: async (req, res) => {
    try {
      const { tenant, landlord, lease, status, paymentType, page = 1, limit = 10 } = req.query;
      
      let filter = {};
      if (tenant) filter.tenant = tenant;
      if (landlord) filter.landlord = landlord;
      if (lease) filter.lease = lease;
      if (status) filter.status = status;
      if (paymentType) filter.paymentType = paymentType;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [payments, total] = await Promise.all([
        Payment.find(filter)
          .populate('lease', 'monthlyRent startDate endDate')
          .populate('tenant', 'firstName lastName email')
          .populate('landlord', 'firstName lastName email')
          .sort({ dueDate: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Payment.countDocuments(filter)
      ]);

      res.json({
        status: 'success',
        data: {
          payments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch payments',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getPayment: async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id)
        .populate('lease')
        .populate('tenant', 'firstName lastName email')
        .populate('landlord', 'firstName lastName email');

      if (!payment) {
        return res.status(404).json({
          status: 'error',
          message: 'Payment not found'
        });
      }

      res.json({
        status: 'success',
        data: { payment }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch payment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  createPayment: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const lease = await LeaseAgreement.findById(req.body.lease);
      if (!lease) {
        return res.status(404).json({
          status: 'error',
          message: 'Lease not found'
        });
      }

      const paymentData = {
        ...req.body,
        landlord: lease.landlord,
        tenant: lease.tenant
      };

      const payment = new Payment(paymentData);
      await payment.save();
      await payment.populate('lease tenant landlord');

      res.status(201).json({
        status: 'success',
        message: 'Payment created successfully',
        data: { payment }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create payment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  updatePayment: async (req, res) => {
    try {
      const payment = await Payment.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      ).populate('lease tenant landlord');

      if (!payment) {
        return res.status(404).json({
          status: 'error',
          message: 'Payment not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Payment updated successfully',
        data: { payment }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update payment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  deletePayment: async (req, res) => {
    try {
      const payment = await Payment.findByIdAndDelete(req.params.id);
      if (!payment) {
        return res.status(404).json({
          status: 'error',
          message: 'Payment not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Payment deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete payment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  markAsPaid: async (req, res) => {
    try {
      const { paymentMethod, transactionId } = req.body;

      const payment = await Payment.findByIdAndUpdate(
        req.params.id,
        {
          status: 'paid',
          paidDate: new Date(),
          paymentMethod,
          'transactionDetails.transactionId': transactionId
        },
        { new: true }
      ).populate('lease tenant landlord');

      if (!payment) {
        return res.status(404).json({
          status: 'error',
          message: 'Payment not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Payment marked as paid',
        data: { payment }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to process payment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getOverduePayments: async (req, res) => {
    try {
      const overduePayments = await Payment.find({
        status: { $in: ['pending', 'overdue'] },
        dueDate: { $lt: new Date() }
      })
      .populate('lease', 'monthlyRent')
      .populate('tenant', 'firstName lastName email')
      .populate('landlord', 'firstName lastName email')
      .sort({ dueDate: 1 });

      res.json({
        status: 'success',
        data: { payments: overduePayments, count: overduePayments.length }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch overdue payments',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  generateRentPayments: async (req, res) => {
    try {
      const { leaseId, months = 12 } = req.body;

      const lease = await LeaseAgreement.findById(leaseId);
      if (!lease) {
        return res.status(404).json({
          status: 'error',
          message: 'Lease not found'
        });
      }

      const payments = [];
      const startDate = new Date(lease.startDate);

      for (let i = 0; i < months; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + i);
        dueDate.setDate(lease.paymentDueDate);

        if (dueDate <= lease.endDate) {
          const payment = new Payment({
            lease: lease._id,
            tenant: lease.tenant,
            landlord: lease.landlord,
            amount: lease.monthlyRent,
            paymentType: 'rent',
            dueDate: dueDate,
            status: 'pending'
          });

          await payment.save();
          payments.push(payment);
        }
      }

      res.status(201).json({
        status: 'success',
        message: `Generated ${payments.length} rent payments`,
        data: { payments }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate rent payments',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = paymentController;