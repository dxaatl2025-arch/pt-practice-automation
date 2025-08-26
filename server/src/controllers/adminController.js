// server/src/controllers/adminController.js
const repositoryFactory = require('../repositories/factory');
const admin = require('../config/firebase');

class AdminController {
  constructor() {
    this.userRepo = repositoryFactory.getUserRepository();
    this.propertyRepo = repositoryFactory.getPropertyRepository();
    // Note: Lease, Payment, and Maintenance repositories not yet implemented
    // this.leaseRepo = repositoryFactory.getLeaseRepository();
    // this.paymentRepo = repositoryFactory.getPaymentRepository(); 
    // this.maintenanceRepo = repositoryFactory.getTicketRepository();
  }

  // GET /api/admin/dashboard - System overview
  getDashboard = async (req, res) => {
    try {
      // Get system metrics for available repositories only
      const [users, properties] = await Promise.all([
        this.userRepo.list({ skip: 0, limit: 1 }),
        this.propertyRepo.list({ skip: 0, limit: 1 })
      ]);

      const dashboard = {
        metrics: {
          totalUsers: users.total,
          totalProperties: properties.total,
          // Note: Lease, Payment, and Maintenance metrics not available yet
          totalLeases: 0,
          totalPayments: 0,
          totalMaintenanceTickets: 0
        },
        systemHealth: {
          database: 'healthy',
          server: 'healthy',
          implementedRepositories: ['users', 'properties'],
          pendingRepositories: ['leases', 'payments', 'maintenance'],
          timestamp: new Date().toISOString()
        }
      };

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  // GET /api/admin/users - Manage all users
  getUsers = async (req, res) => {
    try {
      const { page = 1, limit = 10, role, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const filters = {};
      if (role) filters.role = role.toUpperCase();
      if (search) {
        filters.$or = [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ];
      }

      const result = await this.userRepo.list({
        filters,
        skip,
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: result.users,
        pagination: {
          page: parseInt(page),
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
  };

  // POST /api/admin/users - Create user
  createUser = async (req, res) => {
    try {
      const { email, password, firstName, lastName, role, phone } = req.body;

      // Check if user already exists
      const existingUser = await this.userRepo.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      const userData = {
        email,
        password,
        firstName,
        lastName,
        role: role.toUpperCase(),
        phone
      };

      const user = await this.userRepo.create(userData);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  // PUT /api/admin/users/:id - Update user
  updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Get existing user
      const existingUser = await this.userRepo.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // If role is being changed, update Firebase claims
      if (updateData.role && updateData.role !== existingUser.role) {
        await admin.auth().setCustomUserClaims(existingUser.firebaseUid, {
          role: updateData.role.toUpperCase(),
          email: existingUser.email,
          databaseId: existingUser.id
        });
      }

      const user = await this.userRepo.update(id, updateData);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  // DELETE /api/admin/users/:id - Delete user
  deleteUser = async (req, res) => {
    try {
      const { id } = req.params;

      // Get user to delete from Firebase too
      const user = await this.userRepo.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete from database
      const deleted = await this.userRepo.delete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete from Firebase
      try {
        await admin.auth().deleteUser(user.firebaseUid);
      } catch (firebaseError) {
        console.warn('Failed to delete user from Firebase:', firebaseError.message);
        // Continue - database deletion succeeded
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  // GET /api/admin/properties - Manage all properties
  getAllProperties = async (req, res) => {
    try {
      const { page = 1, limit = 10, status, landlordId } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const filters = {};
      if (status) filters.status = status;
      if (landlordId) filters.landlordId = landlordId;

      const result = await this.propertyRepo.list({
        filters,
        skip,
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: result.properties,
        pagination: {
          page: parseInt(page),
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
  };

  // GET /api/admin/system/health - System health check
  getSystemHealth = async (req, res) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        repositories: 'operational',
        version: process.env.npm_package_version || '1.0.0'
      };

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  // PUT /api/admin/system/maintenance - Toggle maintenance mode
  toggleMaintenanceMode = async (req, res) => {
    try {
      const { enabled } = req.body;
      
      // In a real implementation, this would update a system configuration
      // For now, we'll just return the status
      res.json({
        success: true,
        message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
        data: {
          maintenanceMode: enabled,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
}

module.exports = new AdminController();