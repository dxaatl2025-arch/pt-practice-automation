// server/src/repositories/prisma/UserRepository.js - COMPLETE IMPLEMENTATION
const IUserRepository = require('../interfaces/IUserRepository');
const bcrypt = require('bcrypt');

class PrismaUserRepository extends IUserRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
    console.log('🐘 Prisma UserRepository initialized');
  }

  async create(userData) {
    try {
      // Hash password if provided
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      const user = await this.prisma.user.create({
        data: userData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          createdAt: true,
          updatedAt: true
          // Exclude password
        }
      });

      return user;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          createdAt: true,
          updatedAt: true
        }
      });
    } catch (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async findByEmail(email) {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          createdAt: true,
          updatedAt: true
        }
      });
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

      return await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          createdAt: true,
          updatedAt: true
        }
      });
    } catch (error) {
      if (error.code === 'P2025') { // Record not found
        return null;
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      await this.prisma.user.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error.code === 'P2025') { // Record not found
        return false;
      }
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async list(options = {}) {
    try {
      const { filters = {}, sort = { createdAt: 'desc' }, skip = 0, limit = 10 } = options;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: filters,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            phone: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: sort,
          skip,
          take: limit
        }),
        this.prisma.user.count({ where: filters })
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
      const user = await this.prisma.user.findUnique({
        where: { email }
        // Include password for verification
      });

      if (!user) return null;

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return null;

      // Return without password
      delete user.password;
      return user;
    } catch (error) {
      throw new Error(`Failed to authenticate user: ${error.message}`);
    }
  }

  async findByRole(role, options = {}) {
    try {
      const { sort = { createdAt: 'desc' }, limit } = options;
      
      return await this.prisma.user.findMany({
        where: { role },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: sort,
        take: limit || undefined
      });
    } catch (error) {
      throw new Error(`Failed to find users by role: ${error.message}`);
    }
  }

  async count(filters = {}) {
    try {
      return await this.prisma.user.count({ where: filters });
    } catch (error) {
      throw new Error(`Failed to count users: ${error.message}`);
    }
  }
}

module.exports = PrismaUserRepository;