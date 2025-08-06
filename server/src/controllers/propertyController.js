const { validationResult } = require('express-validator');

const mockProperties = [
  {
    id: '1',
    title: 'Beautiful 2BR Apartment',
    description: 'Modern apartment in downtown',
    address: { city: 'Atlanta', state: 'GA' },
    rent: { amount: 1500 },
    bedrooms: 2,
    bathrooms: 2,
    propertyType: 'apartment'
  }
];

const propertyController = {
  getProperties: async (req, res) => {
    res.json({
      status: 'success',
      data: {
        properties: mockProperties,
        pagination: { page: 1, limit: 10, total: 1, pages: 1 }
      }
    });
  },

  getProperty: async (req, res) => {
    res.json({
      status: 'success',
      data: { property: mockProperties[0] }
    });
  },

  createProperty: async (req, res) => {
    res.status(201).json({
      status: 'success',
      message: 'Property created - Development mode',
      data: { property: { ...req.body, id: '2' } }
    });
  },

  updateProperty: async (req, res) => {
    res.json({
      status: 'success',
      message: 'Property updated - Development mode'
    });
  },

  deleteProperty: async (req, res) => {
    res.json({
      status: 'success',
      message: 'Property deleted - Development mode'
    });
  }
};

module.exports = propertyController;
