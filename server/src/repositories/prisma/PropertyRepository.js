// server/src/repositories/prisma/PropertyRepository.js
const IPropertyRepository = require('../interfaces/IPropertyRepository');

class PrismaPropertyRepository extends IPropertyRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
    console.log('🐘 Prisma PropertyRepository initialized');
  }

  async create(propertyData) {
    try {
      return await this.prisma.property.create({
        data: propertyData,
        include: {
          landlord: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to create property: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await this.prisma.property.findUnique({
        where: { id },
        include: {
          landlord: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to find property: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      return await this.prisma.property.update({
        where: { id },
        data: updateData,
        include: {
          landlord: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      if (error.code === 'P2025') { // Record not found
        return null;
      }
      throw new Error(`Failed to update property: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      await this.prisma.property.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error.code === 'P2025') { // Record not found
        return false;
      }
      throw new Error(`Failed to delete property: ${error.message}`);
    }
  }

  async list(options = {}) {
    try {
      const {
        filters = {},
        sort = { createdAt: 'desc' },
        skip = 0,
        limit = 10,
        populate = true
      } = options;

      const whereClause = this._buildWhereClause(filters);
      const includeClause = populate ? {
        landlord: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      } : undefined;

      const [properties, total] = await Promise.all([
        this.prisma.property.findMany({
          where: whereClause,
          include: includeClause,
          orderBy: sort,
          skip,
          take: limit
        }),
        this.prisma.property.count({
          where: whereClause
        })
      ]);

      return {
        properties,
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to list properties: ${error.message}`);
    }
  }

  async findByOwnerId(ownerId, options = {}) {
    try {
      const { sort = { createdAt: 'desc' }, limit } = options;
      
      return await this.prisma.property.findMany({
        where: { landlordId: ownerId },
        orderBy: sort,
        take: limit || undefined
      });
    } catch (error) {
      throw new Error(`Failed to find properties by owner: ${error.message}`);
    }
  }

  async searchByLocation(location, options = {}) {
    try {
      const { city, state, zipCode } = location;
      const filters = {};

      if (city) filters.addressCity = { contains: city, mode: 'insensitive' };
      if (state) filters.addressState = { contains: state, mode: 'insensitive' };
      if (zipCode) filters.addressZip = zipCode;

      return await this.list({ ...options, filters });
    } catch (error) {
      throw new Error(`Failed to search properties by location: ${error.message}`);
    }
  }

  async filterByCriteria(criteria, options = {}) {
    try {
      const { minRent, maxRent, bedrooms, bathrooms, status } = criteria;
      const filters = {};

      if (minRent !== undefined || maxRent !== undefined) {
        filters.rentAmount = {};
        if (minRent !== undefined) filters.rentAmount.gte = minRent;
        if (maxRent !== undefined) filters.rentAmount.lte = maxRent;
      }

      if (bedrooms !== undefined) filters.bedrooms = bedrooms;
      if (bathrooms !== undefined) filters.bathrooms = bathrooms;
      if (status) filters.status = status;

      return await this.list({ ...options, filters });
    } catch (error) {
      throw new Error(`Failed to filter properties: ${error.message}`);
    }
  }

  // Helper method to build Prisma where clause
  _buildWhereClause(filters) {
    const where = {};
    
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      
      if (value !== null && value !== undefined) {
        where[key] = value;
      }
    });

    return where;
  }
}

module.exports = PrismaPropertyRepository;