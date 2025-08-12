// server/src/controllers/leaseController.js - REFACTORED TO USE REPOSITORY
const repositoryFactory = require('../repositories/factory');

class LeaseController {
  constructor() {
    // Dependency injection - repository is injected via factory
    this.leaseRepo = repositoryFactory.getLeaseRepository();
    console.log(`📋 LeaseController using ${repositoryFactory.dbTarget} database`);
  }

  // Get all leases - SAME API, different backend
  getLeases = async (req, res) => {
    try {
      const { page = 1, limit = 10, status, propertyId, tenantId } = req.query;
      const skip = (page - 1) * limit;
      
      const filters = {};
      if (status) filters.status = status;
      if (propertyId) filters.propertyId = propertyId;
      if (tenantId) filters.tenantId = tenantId;
      
      // Repository abstracts the database implementation
      const result = await this.leaseRepo.list({
        filters,
        skip: parseInt(skip),
        limit: parseInt(limit)
      });
      
      // API response identical regardless of database
      res.json({
        success: true,
        data: result.leases,
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

  // Get lease by ID - SAME API, different backend
  getLease = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Repository abstracts the database implementation
      const lease = await this.leaseRepo.findById(id);
      
      if (!lease) {
        return res.status(404).json({
          success: false,
          message: 'Lease not found'
        });
      }
      
      // API response identical regardless of database
      res.json({
        success: true,
        data: lease
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create lease - SAME API, different backend
  createLease = async (req, res) => {
    try {
      const leaseData = {
        ...req.body,
        // Add any default values or processing here
      };
      
      // Repository handles the database implementation
      const lease = await this.leaseRepo.create(leaseData);
      
      // API response identical regardless of database
      res.status(201).json({
        success: true,
        message: 'Lease created successfully',
        data: lease
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update lease
  updateLease = async (req, res) => {
    try {
      const { id } = req.params;
      
      const lease = await this.leaseRepo.update(id, req.body);
      
      if (!lease) {
        return res.status(404).json({
          success: false,
          message: 'Lease not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Lease updated successfully',
        data: lease
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete lease
  deleteLease = async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await this.leaseRepo.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Lease not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Lease deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get leases by property
  getLeasesByProperty = async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { limit } = req.query;
      
      const leases = await this.leaseRepo.findByPropertyId(propertyId, {
        limit: limit ? parseInt(limit) : undefined
      });
      
      res.json({
        success: true,
        data: leases
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get leases by tenant
  getLeasesByTenant = async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { limit } = req.query;
      
      const leases = await this.leaseRepo.findByTenantId(tenantId, {
        limit: limit ? parseInt(limit) : undefined
      });
      
      res.json({
        success: true,
        data: leases
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get active leases
  getActiveLeases = async (req, res) => {
    try {
      const leases = await this.leaseRepo.findActiveLeases();
      
      res.json({
        success: true,
        data: leases
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get expiring leases
  getExpiringLeases = async (req, res) => {
    try {
      const { days = 30 } = req.query;
      
      const leases = await this.leaseRepo.findExpiringLeases(parseInt(days));
      
      res.json({
        success: true,
        data: leases
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

// Export controller instance
const leaseController = new LeaseController();
module.exports = leaseController;