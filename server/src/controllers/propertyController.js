// src/controllers/propertyController.js
const { validationResult } = require('express-validator');
const Property = require('../models/Property');
const User = require('../models/User');

const propertyController = {
  // GET /api/properties - Get all properties with filters and pagination
  getProperties: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        page = 1,
        limit = 10,
        city,
        state,
        minRent,
        maxRent,
        bedrooms,
        propertyType,
        isAvailable,
        landlord
      } = req.query;

      // Build filter object
      let filter = {};
      
      if (city) filter['address.city'] = new RegExp(city, 'i');
      if (state) filter['address.state'] = new RegExp(state, 'i');
      if (propertyType) filter.propertyType = propertyType;
      if (landlord) filter.landlord = landlord;
      if (isAvailable !== undefined) filter['availability.isAvailable'] = isAvailable === 'true';
      if (bedrooms) filter.bedrooms = parseInt(bedrooms);
      
      // Rent range filter
      if (minRent || maxRent) {
        filter['rent.amount'] = {};
        if (minRent) filter['rent.amount'].$gte = parseFloat(minRent);
        if (maxRent) filter['rent.amount'].$lte = parseFloat(maxRent);
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Execute query with pagination
      const [properties, total] = await Promise.all([
        Property.find(filter)
          .populate('landlord', 'firstName lastName email phone')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Property.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        status: 'success',
        data: {
          properties,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch properties',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // GET /api/properties/:id - Get property by ID
  getProperty: async (req, res) => {
    try {
      const property = await Property.findById(req.params.id)
        .populate('landlord', 'firstName lastName email phone profileImage');
      
      if (!property) {
        return res.status(404).json({
          status: 'error',
          message: 'Property not found'
        });
      }

      res.json({
        status: 'success',
        data: { property }
      });
    } catch (error) {
      console.error('Error fetching property:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch property',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // POST /api/properties - Create new property
  createProperty: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      // Get landlord from authenticated user (assuming you have auth middleware)
      const landlordId = req.user?.id || req.body.landlord;
      
      // Verify landlord exists and has correct role
      const landlord = await User.findById(landlordId);
      if (!landlord || landlord.role !== 'landlord') {
        return res.status(403).json({
          status: 'error',
          message: 'Only landlords can create properties'
        });
      }

      const propertyData = {
        ...req.body,
        landlord: landlordId
      };

      const property = new Property(propertyData);
      await property.save();
      
      // Populate landlord info before returning
      await property.populate('landlord', 'firstName lastName email');

      res.status(201).json({
        status: 'success',
        message: 'Property created successfully',
        data: { property }
      });
    } catch (error) {
      console.error('Error creating property:', error);
      
      // Handle duplicate key errors
      if (error.code === 11000) {
        return res.status(400).json({
          status: 'error',
          message: 'Property with this information already exists'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to create property',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // PUT /api/properties/:id - Update property
  updateProperty: async (req, res) => {
    try {
      const propertyId = req.params.id;
      const userId = req.user?.id;

      // Find the property first
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({
          status: 'error',
          message: 'Property not found'
        });
      }

      // Check if user owns this property
      if (property.landlord.toString() !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only update your own properties'
        });
      }

      // Update the property
      const updatedProperty = await Property.findByIdAndUpdate(
        propertyId,
        { $set: req.body },
        { new: true, runValidators: true }
      ).populate('landlord', 'firstName lastName email');

      res.json({
        status: 'success',
        message: 'Property updated successfully',
        data: { property: updatedProperty }
      });
    } catch (error) {
      console.error('Error updating property:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update property',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // DELETE /api/properties/:id - Delete property
  deleteProperty: async (req, res) => {
    try {
      const propertyId = req.params.id;
      const userId = req.user?.id;

      // Find the property first
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({
          status: 'error',
          message: 'Property not found'
        });
      }

      // Check if user owns this property
      if (property.landlord.toString() !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only delete your own properties'
        });
      }

      // Check if property has active leases (optional business logic)
      const LeaseAgreement = require('../models/LeaseAgreement');
      const activeLeases = await LeaseAgreement.find({ 
        property: propertyId, 
        status: 'active' 
      });

      if (activeLeases.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete property with active leases'
        });
      }

      await Property.findByIdAndDelete(propertyId);

      res.json({
        status: 'success',
        message: 'Property deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting property:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete property',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // GET /api/properties/search/:query - Search properties
  searchProperties: async (req, res) => {
    try {
      const { query } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const searchFilter = {
        $and: [
          { 'availability.isAvailable': true },
          {
            $or: [
              { title: new RegExp(query, 'i') },
              { description: new RegExp(query, 'i') },
              { 'address.city': new RegExp(query, 'i') },
              { 'address.state': new RegExp(query, 'i') },
              { amenities: { $in: [new RegExp(query, 'i')] } }
            ]
          }
        ]
      };

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [properties, total] = await Promise.all([
        Property.find(searchFilter)
          .populate('landlord', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Property.countDocuments(searchFilter)
      ]);

      res.json({
        status: 'success',
        data: {
          properties,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          },
          searchQuery: query
        }
      });
    } catch (error) {
      console.error('Error searching properties:', error);
      res.status(500).json({
        status: 'error',
        message: 'Search failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = propertyController;