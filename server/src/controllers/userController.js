 const { validationResult } = require('express-validator');
const User = require('../models/User');

const userController = {
  getUsers: async (req, res) => {
    try {
      const { role, page = 1, limit = 10 } = req.query;
      
      let filter = {};
      if (role) filter.role = role;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(filter)
      ]);

      res.json({
        status: 'success',
        data: {
          users,
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
        message: 'Failed to fetch users',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getUser: async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('-password');
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      res.json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  createUser: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const user = new User(req.body);
      await user.save();

      res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: { user }
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          status: 'error',
          message: 'Email or Firebase UID already exists'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to create user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  updateUser: async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      res.json({
        status: 'success',
        message: 'User updated successfully',
        data: { user }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      res.json({
        status: 'success',
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  loginUser: async (req, res) => {
    try {
      const { email, firebaseUid } = req.body;
      
      let user;
      if (firebaseUid) {
        user = await User.findOne({ firebaseUid });
      } else if (email) {
        user = await User.findOne({ email });
      }

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      user.lastLogin = new Date();
      await user.save();

      res.json({
        status: 'success',
        message: 'Login successful',
        data: { user }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = userController;
