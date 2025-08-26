// server/src/controllers/propertyController.js - FIXED BINDING
const repositoryFactory = require('../repositories/factory');

class PropertyController {
  constructor() {
    this.propertyRepo = repositoryFactory.getPropertyRepository();
    console.log(`📋 PropertyController using ${repositoryFactory.dbTarget} database`);
  }

  // Create property - use arrow function to bind 'this'
createProperty = async (req, res) => {
  try {
    // DEBUG: Check what authentication middleware provides
    console.log('DEBUG: req.user =', req.user);
    console.log('DEBUG: Authorization header present:', !!req.headers.authorization);
    
   const propertyData = {
  ...req.body,
  landlordId: req.user?.id  // Changed from req.user?.databaseId
};
    
    console.log('DEBUG: landlordId being sent to Prisma =', propertyData.landlordId);

    const property = await this.propertyRepo.create(propertyData);

      // API response identical regardless of database
      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: property
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // List properties - use arrow function to bind 'this'
  listProperties = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        city,
        state,
        minRent,
        maxRent,
        bedrooms,
        status
      } = req.query;

      const skip = (page - 1) * limit;

      // Build search criteria
      if (minRent || maxRent) {
        // Use repository's filterByCriteria method
        const result = await this.propertyRepo.filterByCriteria(
          { minRent, maxRent, bedrooms, status },
          { skip: parseInt(skip), limit: parseInt(limit) }
        );

        return res.json({
          success: true,
          data: result.properties,
          pagination: {
            page: result.page,
            totalPages: result.totalPages,
            total: result.total,
            limit: parseInt(limit)
          }
        });
      }

      if (city || state) {
        // Use repository's searchByLocation method
        const result = await this.propertyRepo.searchByLocation(
          { city, state },
          { skip: parseInt(skip), limit: parseInt(limit) }
        );

        return res.json({
          success: true,
          data: result.properties,
          pagination: {
            page: result.page,
            totalPages: result.totalPages,
            total: result.total,
            limit: parseInt(limit)
          }
        });
      }

      // Default list
      const result = await this.propertyRepo.list({
        skip: parseInt(skip),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: result.properties,
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

  // Alias method - use arrow function to bind 'this'
  getProperties = async (req, res) => {
    return this.listProperties(req, res);
  }

  // Get single property - use arrow function to bind 'this'
  getProperty = async (req, res) => {
    try {
      const { id } = req.params;
      const property = await this.propertyRepo.findById(id);

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      res.json({
        success: true,
        data: property
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update property - use arrow function to bind 'this'
  updateProperty = async (req, res) => {
    try {
      const { id } = req.params;
      const property = await this.propertyRepo.update(id, req.body);

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      res.json({
        success: true,
        message: 'Property updated successfully',
        data: property
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete property - use arrow function to bind 'this'
  deleteProperty = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.propertyRepo.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      res.json({
        success: true,
        message: 'Property deleted successfully'
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
const propertyController = new PropertyController();
module.exports = propertyController;