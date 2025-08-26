const ITenantProfileRepository = require('../interfaces/ITenantProfileRepository');

class PrismaTenantProfileRepository extends ITenantProfileRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
    console.log('🎯 Prisma TenantProfileRepository initialized');
  }

  async findByUserId(userId) {
    return await this.prisma.tenantProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
  }

  async create(data) {
    return await this.prisma.tenantProfile.create({
      data,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
  }

  async update(userId, data) {
    try {
      return await this.prisma.tenantProfile.update({
        where: { userId },
        data,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  async upsert(userId, data) {
    return await this.prisma.tenantProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
  }

  async delete(userId) {
    try {
      await this.prisma.tenantProfile.delete({
        where: { userId }
      });
      return true;
    } catch (error) {
      if (error.code === 'P2025') return false;
      throw error;
    }
  }
}

module.exports = PrismaTenantProfileRepository;