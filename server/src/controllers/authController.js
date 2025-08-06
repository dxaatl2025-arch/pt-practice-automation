const admin = require('../config/firebase');
const { validationResult } = require('express-validator');

const authController = {
  register: async (req, res) => {
    try {
      res.status(201).json({
        status: 'success',
        message: 'User registration endpoint - Development mode',
        data: { user: { id: '123', email: 'dev@test.com', role: 'landlord' } }
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Registration failed' });
    }
  },

  login: async (req, res) => {
    try {
      res.json({
        status: 'success',
        message: 'Login successful - Development mode',
        data: { user: { id: '123', email: 'dev@test.com', role: 'landlord' } }
      });
    } catch (error) {
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }
  },

  getMe: async (req, res) => {
    res.json({
      status: 'success',
      data: { user: { id: '123', email: 'dev@test.com', role: 'landlord' } }
    });
  },

  updateProfile: async (req, res) => {
    res.json({
      status: 'success',
      message: 'Profile updated - Development mode',
      data: { user: { id: '123', email: 'dev@test.com', role: 'landlord' } }
    });
  }
};

module.exports = authController;
