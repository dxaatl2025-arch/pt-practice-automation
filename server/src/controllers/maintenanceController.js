// src/controllers/maintenanceController.js
const { validationResult } = require('express-validator');
const MaintenanceTicket = require('../models/MaintenanceTicket');

const maintenanceController = {
  // GET /api/maintenance - Get all tickets with filters
  getTickets: async (req, res) => {
    try {
      const { property, tenant, landlord, status, priority, category, page = 1, limit = 10 } = req.query;
      
      let filter = {};
      if (property) filter.property = property;
      if (tenant) filter.tenant = tenant;
      if (landlord) filter.landlord = landlord;
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (category) filter.category = category;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [tickets, total] = await Promise.all([
        MaintenanceTicket.find(filter)
          .populate('property', 'title address')
          .populate('tenant', 'firstName lastName email phone')
          .populate('landlord', 'firstName lastName email phone')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        MaintenanceTicket.countDocuments(filter)
      ]);

      res.json({
        status: 'success',
        data: {
          tickets,
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
        message: 'Failed to fetch maintenance tickets',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // GET /api/maintenance/:id - Get ticket by ID
  getTicket: async (req, res) => {
    try {
      const ticket = await MaintenanceTicket.findById(req.params.id)
        .populate('property')
        .populate('tenant', 'firstName lastName email phone')
        .populate('landlord', 'firstName lastName email phone')
        .populate('communication.from', 'firstName lastName');

      if (!ticket) {
        return res.status(404).json({
          status: 'error',
          message: 'Maintenance ticket not found'
        });
      }

      res.json({
        status: 'success',
        data: { ticket }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch maintenance ticket',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // POST /api/maintenance - Create new ticket
  createTicket: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const ticket = new MaintenanceTicket(req.body);
      await ticket.save();
      await ticket.populate('property tenant landlord');

      res.status(201).json({
        status: 'success',
        message: 'Maintenance ticket created successfully',
        data: { ticket }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create maintenance ticket',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // PUT /api/maintenance/:id - Update ticket
  updateTicket: async (req, res) => {
    try {
      const ticket = await MaintenanceTicket.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      ).populate('property tenant landlord');

      if (!ticket) {
        return res.status(404).json({
          status: 'error',
          message: 'Maintenance ticket not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Maintenance ticket updated successfully',
        data: { ticket }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update maintenance ticket',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // DELETE /api/maintenance/:id - Delete ticket
  deleteTicket: async (req, res) => {
    try {
      const ticket = await MaintenanceTicket.findByIdAndDelete(req.params.id);
      if (!ticket) {
        return res.status(404).json({
          status: 'error',
          message: 'Maintenance ticket not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Maintenance ticket deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete maintenance ticket',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // POST /api/maintenance/:id/assign - Assign ticket to contractor
  assignTicket: async (req, res) => {
    try {
      const { assignedTo, estimatedCost, scheduledDate, contactInfo } = req.body;

      const ticket = await MaintenanceTicket.findByIdAndUpdate(
        req.params.id,
        {
          'assignment.assignedTo': assignedTo,
          'assignment.estimatedCost': estimatedCost,
          'assignment.assignedAt': new Date(),
          'assignment.contactInfo': contactInfo,
          'schedule.scheduledDate': scheduledDate,
          status: 'in_progress'
        },
        { new: true }
      ).populate('property tenant landlord');

      if (!ticket) {
        return res.status(404).json({
          status: 'error',
          message: 'Maintenance ticket not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Ticket assigned successfully',
        data: { ticket }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to assign ticket',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // POST /api/maintenance/:id/comment - Add comment to ticket
  addComment: async (req, res) => {
    try {
      const { message, type = 'note' } = req.body;
      const userId = req.user?.id; // From auth middleware

      const ticket = await MaintenanceTicket.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            communication: {
              from: userId,
              message,
              type,
              timestamp: new Date()
            }
          }
        },
        { new: true }
      ).populate('property tenant landlord')
       .populate('communication.from', 'firstName lastName');

      if (!ticket) {
        return res.status(404).json({
          status: 'error',
          message: 'Maintenance ticket not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Comment added successfully',
        data: { ticket }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to add comment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // GET /api/maintenance/urgent - Get urgent tickets
  getUrgentTickets: async (req, res) => {
    try {
      const urgentTickets = await MaintenanceTicket.find({
        priority: { $in: ['high', 'urgent', 'emergency'] },
        status: { $in: ['open', 'acknowledged', 'in_progress'] }
      })
      .populate('property', 'title address')
      .populate('tenant', 'firstName lastName email phone')
      .populate('landlord', 'firstName lastName email phone')
      .sort({ priority: -1, createdAt: -1 });

      res.json({
        status: 'success',
        data: { tickets: urgentTickets, count: urgentTickets.length }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch urgent tickets',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = maintenanceController; 
