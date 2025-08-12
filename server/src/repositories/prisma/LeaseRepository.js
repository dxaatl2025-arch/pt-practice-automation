// server/src/repositories/prisma/LeaseRepository.js
const ILeaseRepository = require('../interfaces/ILeaseRepository');

class PrismaLeaseRepository extends ILeaseRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
    console.log('🐘 Prisma LeaseRepository initialized');
  }

  async create(leaseData) {
    try {
      return await this.prisma.lease.create({
        data: leaseData,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              addressStreet: true,
              addressCity: true,
              addressState: true
            }
          },
          tenant: {
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
      throw new Error(`Failed to create lease: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await this.prisma.lease.findUnique({
        where: { id },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              addressStreet: true,
              addressCity: true,
              addressState: true
            }
          },
          tenant: {
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
      throw new Error(`Failed to find lease: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      return await this.prisma.lease.update({
        where: { id },
        data: updateData,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              addressStreet: true,
              addressCity: true,
              addressState: true
            }
          },
          tenant: {
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
      if (error.code === 'P2025') {
        return null;
      }
      throw new Error(`Failed to update lease: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      await this.prisma.lease.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        return false;
      }
      throw new Error(`Failed to delete lease: ${error.message}`);
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
        property: {
          select: {
            id: true,
            title: true,
            addressStreet: true,
            addressCity: true,
            addressState: true
          }
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      } : undefined;

      const [leases, total] = await Promise.all([
        this.prisma.lease.findMany({
          where: whereClause,
          include: includeClause,
          orderBy: sort,
          skip,
          take: limit
        }),
        this.prisma.lease.count({
          where: whereClause
        })
      ]);

      return {
        leases,
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to list leases: ${error.message}`);
    }
  }

  async findByPropertyId(propertyId, options = {}) {
    try {
      const { sort = { createdAt: 'desc' }, limit } = options;
      
      return await this.prisma.lease.findMany({
        where: { propertyId },
        include: {
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: sort,
        take: limit || undefined
      });
    } catch (error) {
      throw new Error(`Failed to find leases by property: ${error.message}`);
    }
  }

  async findByTenantId(tenantId, options = {}) {
    try {
      const { sort = { createdAt: 'desc' }, limit } = options;
      
      return await this.prisma.lease.findMany({
        where: { tenantId },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              addressStreet: true,
              addressCity: true,
              addressState: true
            }
          }
        },
        orderBy: sort,
        take: limit || undefined
      });
    } catch (error) {
      throw new Error(`Failed to find leases by tenant: ${error.message}`);
    }
  }

  async findActiveLeases() {
    try {
      const now = new Date();
      return await this.prisma.lease.findMany({
        where: {
          startDate: { lte: now },
          endDate: { gte: now },
          status: 'ACTIVE'
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              addressStreet: true,
              addressCity: true,
              addressState: true
            }
          },
          tenant: {
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
      throw new Error(`Failed to find active leases: ${error.message}`);
    }
  }

  async findExpiringLeases(days = 30) {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);

      return await this.prisma.lease.findMany({
        where: {
          endDate: {
            gte: now,
            lte: futureDate
          },
          status: 'ACTIVE'
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              addressStreet: true,
              addressCity: true,
              addressState: true
            }
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          endDate: 'asc'
        }
      });
    } catch (error) {
      throw new Error(`Failed to find expiring leases: ${error.message}`);
    }
  }

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

module.exports = PrismaLeaseRepository;