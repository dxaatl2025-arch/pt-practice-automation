const IPropertyMatchProfileRepository = require('../interfaces/IPropertyMatchProfileRepository');

class PrismaPropertyMatchProfileRepository extends IPropertyMatchProfileRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
    console.log('🏠 Prisma PropertyMatchProfileRepository initialized');
  }

  async findByPropertyId(propertyId) {
    return await this.prisma.propertyMatchProfile.findUnique({
      where: { propertyId },
      include: {
        property: {
          select: { 
            id: true, title: true, addressCity: true, addressState: true,
            landlordId: true
          }
        }
      }
    });
  }

  async upsert(propertyId, data) {
    return await this.prisma.propertyMatchProfile.upsert({
      where: { propertyId },
      create: { propertyId, ...data },
      update: data,
      include: {
        property: {
          select: { 
            id: true, title: true, addressCity: true, addressState: true,
            landlordId: true
          }
        }
      }
    });
  }

  async delete(propertyId) {
    try {
      await this.prisma.propertyMatchProfile.delete({
        where: { propertyId }
      });
      return true;
    } catch (error) {
      if (error.code === 'P2025') return false;
      throw error;
    }
  }
}

module.exports = PrismaPropertyMatchProfileRepository;