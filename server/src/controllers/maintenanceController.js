// src/controllers/maintenanceController.js - Fixed version
const { validationResult } = require('express-validator');
const repositoryFactory = require('../repositories/factory');

class MaintenanceController {
  constructor() {
    // Use the correct method name from your factory
    this.ticketRepo = repositoryFactory.getMaintenanceTicketRepository();
    console.log(`📋 MaintenanceController using ${repositoryFactory.dbTarget} database`);
  }

  // GET /api/maintenance - Get all tickets with filters
  getTickets = async (req, res) => {
    try {
      const { property, tenant, landlord, status, priority, category, page = 1, limit = 10 } = req.query;
      
      let filters = {};
      if (property) filters.propertyId = property;
      if (tenant) filters.tenantId = tenant;
      if (status) filters.status = status?.toUpperCase();
      if (priority) filters.priority = priority?.toUpperCase();

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const result = await this.ticketRepo.list({
        filters,
        skip: parseInt(skip),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: result.tickets,
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
        message: 'Failed to fetch maintenance tickets',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/maintenance/:id - Get ticket by ID
  getTicket = async (req, res) => {
    try {
      const ticket = await this.ticketRepo.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Maintenance ticket not found'
        });
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch maintenance ticket',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/maintenance - Create new ticket
  createTicket = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const ticket = await this.ticketRepo.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Maintenance ticket created successfully',
        data: ticket
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create maintenance ticket',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // PUT /api/maintenance/:id - Update ticket
  updateTicket = async (req, res) => {
    try {
      const ticket = await this.ticketRepo.update(req.params.id, req.body);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Maintenance ticket not found'
        });
      }

      res.json({
        success: true,
        message: 'Maintenance ticket updated successfully',
        data: ticket
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update maintenance ticket',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
// Add these methods to your MaintenanceController class:

// GET /api/maintenance/urgent - Get urgent tickets
getUrgentTickets = async (req, res) => {
  try {
    const result = await this.ticketRepo.list({
      filters: {
        priority: { in: ['HIGH', 'URGENT'] },
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      },
      limit: 50
    });

    res.json({
      success: true,
      data: result.tickets,
      count: result.total
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch urgent tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// POST /api/maintenance/:id/assign - Assign ticket to contractor
assignTicket = async (req, res) => {
  try {
    const { assignedTo, estimatedCost, scheduledDate, contactInfo } = req.body;

    const ticket = await this.ticketRepo.update(req.params.id, {
      assignedTo,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      contactInfo,
      status: 'IN_PROGRESS'
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance ticket not found'
      });
    }

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to assign ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// POST /api/maintenance/:id/comment - Add comment to ticket
addComment = async (req, res) => {
  try {
    const { message, type = 'note' } = req.body;

    // For now, just update the ticket (you can enhance this later)
    const ticket = await this.ticketRepo.update(req.params.id, {
      lastComment: message,
      lastCommentType: type,
      lastCommentDate: new Date()
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance ticket not found'
      });
    }

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
  // DELETE /api/maintenance/:id - Delete ticket
  deleteTicket = async (req, res) => {
    try {
      const deleted = await this.ticketRepo.delete(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Maintenance ticket not found'
        });
      }

      res.json({
        success: true,
        message: 'Maintenance ticket deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete maintenance ticket',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

// Export controller instance
const maintenanceController = new MaintenanceController();
module.exports = maintenanceController;