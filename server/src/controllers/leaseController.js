// src/controllers/leaseController.js
const { validationResult } = require('express-validator');
const LeaseAgreement = require('../models/LeaseAgreement');
const Property = require('../models/Property');
const User = require('../models/User');

const leaseController = {
  // GET /api/leases - Get all leases with filters
  getLeases: async (req, res) => {
    try {
      const { landlord, tenant, property, status, page = 1, limit = 10 } = req.query;
      
      let filter = {};
      if (landlord) filter.landlord = landlord;
      if (tenant) filter.tenant = tenant;
      if (property) filter.property = property;
      if (status) filter.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [leases, total] = await Promise.all([
        LeaseAgreement.find(filter)
          .populate('property', 'title address rent')
          .populate('landlord', 'firstName lastName email')
          .populate('tenant', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        LeaseAgreement.countDocuments(filter)
      ]);

      res.json({
        status: 'success',
        data: {
          leases,
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
        message: 'Failed to fetch leases',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // GET /api/leases/:id - Get lease by ID
  getLease: async (req, res) => {
    try {
      const lease = await LeaseAgreement.findById(req.params.id)
        .populate('property')
        .populate('landlord', 'firstName lastName email phone')
        .populate('tenant', 'firstName lastName email phone');

      if (!lease) {
        return res.status(404).json({
          status: 'error',
          message: 'Lease not found'
        });
      }

      res.json({
        status: 'success',
        data: { lease }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch lease',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // POST /api/leases - Create new lease
  createLease: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      // Get property and verify ownership
      const property = await Property.findById(req.body.property);
      if (!property) {
        return res.status(404).json({
          status: 'error',
          message: 'Property not found'
        });
      }

      // Verify tenant exists
      const tenant = await User.findById(req.body.tenant);
      if (!tenant || tenant.role !== 'tenant') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid tenant'
        });
      }

      const leaseData = {
        ...req.body,
        landlord: property.landlord
      };

      const lease = new LeaseAgreement(leaseData);
      await lease.save();
      await lease.populate('property landlord tenant');

      res.status(201).json({
        status: 'success',
        message: 'Lease created successfully',
        data: { lease }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create lease',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // PUT /api/leases/:id - Update lease
  updateLease: async (req, res) => {
    try {
      const lease = await LeaseAgreement.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      ).populate('property landlord tenant');

      if (!lease) {
        return res.status(404).json({
          status: 'error',
          message: 'Lease not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Lease updated successfully',
        data: { lease }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update lease',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // DELETE /api/leases/:id - Delete lease
  deleteLease: async (req, res) => {
    try {
      const lease = await LeaseAgreement.findByIdAndDelete(req.params.id);
      if (!lease) {
        return res.status(404).json({
          status: 'error',
          message: 'Lease not found'
        });
      }

      // Make property available again
      await Property.findByIdAndUpdate(lease.property, { 
        status: 'active',
        'availability.isAvailable': true 
      });

      res.json({
        status: 'success',
        message: 'Lease deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete lease',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // POST /api/leases/:id/sign - Sign lease
  signLease: async (req, res) => {
    try {
      const { signedBy } = req.body; // 'tenant' or 'landlord'
      const updateField = `signatures.${signedBy}.signed`;
      const dateField = `signatures.${signedBy}.signedAt`;

      const lease = await LeaseAgreement.findByIdAndUpdate(
        req.params.id,
        {
          [updateField]: true,
          [dateField]: new Date()
        },
        { new: true }
      ).populate('property landlord tenant');

      if (!lease) {
        return res.status(404).json({
          status: 'error',
          message: 'Lease not found'
        });
      }

      // Check if both parties signed
      if (lease.signatures.tenant.signed && lease.signatures.landlord.signed && lease.status === 'draft') {
        lease.status = 'active';
        await lease.save();
      }

      res.json({
        status: 'success',
        message: 'Lease signed successfully',
        data: { lease }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to sign lease',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = leaseController;