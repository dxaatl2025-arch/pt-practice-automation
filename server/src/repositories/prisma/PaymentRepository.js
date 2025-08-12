// server/src/repositories/prisma/PaymentRepository.js
const IPaymentRepository = require('../interfaces/IPaymentRepository');

class PrismaPaymentRepository extends IPaymentRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
    console.log('🐘 Prisma PaymentRepository initialized');
  }

  async create(paymentData) {
    try {
      return await this.prisma.payment.create({
        data: paymentData,
        include: {
          lease: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              monthlyRent: true,
              property: {
                select: {
                  id: true,
                  title: true,
                  addressStreet: true,
                  addressCity: true,
                  addressState: true
                }
              }
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
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await this.prisma.payment.findUnique({
        where: { id },
        include: {
          lease: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              monthlyRent: true,
              property: {
                select: {
                  id: true,
                  title: true,
                  addressStreet: true,
                  addressCity: true,
                  addressState: true
                }
              }
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
      throw new Error(`Failed to find payment: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      return await this.prisma.payment.update({
        where: { id },
        data: updateData,
        include: {
          lease: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              monthlyRent: true,
              property: {
                select: {
                  id: true,
                  title: true,
                  addressStreet: true,
                  addressCity: true,
                  addressState: true
                }
              }
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
      throw new Error(`Failed to update payment: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      await this.prisma.payment.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        return false;
      }
      throw new Error(`Failed to delete payment: ${error.message}`);
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
        lease: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
            property: {
              select: {
                id: true,
                title: true,
                addressStreet: true,
                addressCity: true,
                addressState: true
              }
            }
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

      const [payments, total] = await Promise.all([
        this.prisma.payment.findMany({
          where: whereClause,
          include: includeClause,
          orderBy: sort,
          skip,
          take: limit
        }),
        this.prisma.payment.count({
          where: whereClause
        })
      ]);

      return {
        payments,
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to list payments: ${error.message}`);
    }
  }

  async findByLeaseId(leaseId, options = {}) {
    try {
      const { sort = { dueDate: 'asc' }, limit } = options;
      
      return await this.prisma.payment.findMany({
        where: { leaseId },
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
      throw new Error(`Failed to find payments by lease: ${error.message}`);
    }
  }

  async findByTenantId(tenantId, options = {}) {
    try {
      const { sort = { dueDate: 'desc' }, limit } = options;
      
      return await this.prisma.payment.findMany({
        where: { tenantId },
        include: {
          lease: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              monthlyRent: true,
              property: {
                select: {
                  id: true,
                  title: true,
                  addressStreet: true,
                  addressCity: true,
                  addressState: true
                }
              }
            }
          }
        },
        orderBy: sort,
        take: limit || undefined
      });
    } catch (error) {
      throw new Error(`Failed to find payments by tenant: ${error.message}`);
    }
  }

  async findOverduePayments() {
    try {
      const now = new Date();
      return await this.prisma.payment.findMany({
        where: {
          dueDate: { lt: now },
          status: { in: ['PENDING', 'OVERDUE'] }
        },
        include: {
          lease: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              monthlyRent: true,
              property: {
                select: {
                  id: true,
                  title: true,
                  addressStreet: true,
                  addressCity: true,
                  addressState: true
                }
              }
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
          dueDate: 'asc'
        }
      });
    } catch (error) {
      throw new Error(`Failed to find overdue payments: ${error.message}`);
    }
  }

  async findUpcomingPayments(days = 7) {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);

      return await this.prisma.payment.findMany({
        where: {
          dueDate: {
            gte: now,
            lte: futureDate
          },
          status: 'PENDING'
        },
        include: {
          lease: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              monthlyRent: true,
              property: {
                select: {
                  id: true,
                  title: true,
                  addressStreet: true,
                  addressCity: true,
                  addressState: true
                }
              }
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
          dueDate: 'asc'
        }
      });
    } catch (error) {
      throw new Error(`Failed to find upcoming payments: ${error.message}`);
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

module.exports = PrismaPaymentRepository;