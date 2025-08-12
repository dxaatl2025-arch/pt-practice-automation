// server/src/repositories/mongo/UserRepository.js - COMPLETE IMPLEMENTATION
const IUserRepository = require('../interfaces/IUserRepository');
const bcrypt = require('bcrypt');

class MongoUserRepository extends IUserRepository {
  constructor(UserModel) {
    super();
    this.User = UserModel;
    console.log('🍃 MongoDB UserRepository initialized');
  }

  async create(userData) {
    try {
      // Hash password if provided
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      const user = new this.User(userData);
      const savedUser = await user.save();
      
      // Remove password from response
      const userObj = savedUser.toObject();
      delete userObj.password;
      return userObj;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const user = await this.User.findById(id).select('-password').lean();
      return user;
    } catch (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async findByEmail(email) {
    try {
      const user = await this.User.findOne({ email }).select('-password').lean();
      return user;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      // Hash password if being updated
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const user = await this.User.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      ).select('-password').lean();
      
      return user;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const result = await this.User.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async list(options = {}) {
    try {
      const { filters = {}, sort = { createdAt: -1 }, skip = 0, limit = 10 } = options;

      const [users, total] = await Promise.all([
        this.User.find(filters).select('-password').sort(sort).skip(skip).limit(limit).lean(),
        this.User.countDocuments(filters)
      ]);

      return {
        users,
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }
  }

  async authenticate(email, password) {
    try {
      const user = await this.User.findOne({ email });
      if (!user) return null;

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return null;

      // Return user without password
      const userObj = user.toObject();
      delete userObj.password;
      return userObj;
    } catch (error) {
      throw new Error(`Failed to authenticate user: ${error.message}`);
    }
  }

  async findByRole(role, options = {}) {
    try {
      const { sort = { createdAt: -1 }, limit } = options;
      const query = this.User.find({ role }).select('-password').sort(sort);
      
      if (limit) query.limit(limit);
      return await query.lean();
    } catch (error) {
      throw new Error(`Failed to find users by role: ${error.message}`);
    }
  }

  async count(filters = {}) {
    try {
      return await this.User.countDocuments(filters);
    } catch (error) {
      throw new Error(`Failed to count users: ${error.message}`);
    }
  }
}

module.exports = MongoUserRepository;