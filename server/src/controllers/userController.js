// server/src/controllers/userController.js - COMPLETE IMPLEMENTATION
const repositoryFactory = require('../repositories/factory');

class UserController {
  constructor() {
    // Dependency injection - repository is injected via factory
    this.userRepo = repositoryFactory.getUserRepository();
    console.log(`📋 UserController using ${repositoryFactory.dbTarget} database`);
  }

  // Get all users - SAME API, different backend
  getUsers = async (req, res) => {
    try {
      const { page = 1, limit = 10, role } = req.query;
      const skip = (page - 1) * limit;
      
      const filters = role ? { role } : {};
      
      // Repository abstracts the database implementation
      const result = await this.userRepo.list({
        filters,
        skip: parseInt(skip),
        limit: parseInt(limit)
      });
      
      // API response identical regardless of database
      res.json({
        success: true,
        data: result.users,
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

  // Get user by ID - SAME API, different backend
  getUser = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Repository abstracts the database implementation
      const user = await this.userRepo.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // API response identical regardless of database
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create user - SAME API, different backend
  createUser = async (req, res) => {
    try {
      const { email, password, firstName, lastName, role, phone } = req.body;
      
      // Check if user exists - repository method
      const existingUser = await this.userRepo.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }
      
      // Repository handles password hashing internally
      const user = await this.userRepo.create({
        email,
        password,
        firstName,
        lastName,
        role,
        phone
      });
      
      // API response identical regardless of database
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
  }

  // Update user
  updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await this.userRepo.update(id, req.body);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
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
  }

  // Delete user
  deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await this.userRepo.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
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
  }

  // Get tenants (users with role 'tenant')
  getTenants = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      
      const result = await this.userRepo.list({
        filters: { role: 'TENANT' },
        skip: parseInt(skip),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: result.users,
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

  // Get landlords (users with role 'landlord')
  getLandlords = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      
      const result = await this.userRepo.list({
        filters: { role: 'LANDLORD' },
        skip: parseInt(skip),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: result.users,
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
}

// Export controller instance
const userController = new UserController();
module.exports = userController;