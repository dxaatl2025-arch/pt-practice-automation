const IFeedbackRepository = require('../interfaces/IFeedbackRepository');

class PrismaFeedbackRepository extends IFeedbackRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
    console.log('👍 Prisma FeedbackRepository initialized');
  }

  async create(data) {
    return await this.prisma.feedback.create({
      data,
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true }
        },
        toUser: {
          select: { id: true, firstName: true, lastName: true }
        },
        lease: {
          select: { id: true, startDate: true, endDate: true }
        }
      }
    });
  }

  async findById(id) {
    return await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true }
        },
        toUser: {
          select: { id: true, firstName: true, lastName: true }
        },
        lease: {
          select: { id: true, startDate: true, endDate: true }
        }
      }
    });
  }

  async findByUserId(userId, options = {}) {
    const { skip = 0, limit = 10 } = options;
    
    const [feedback, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where: { toUserId: userId },
        include: {
          fromUser: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      this.prisma.feedback.count({ where: { toUserId: userId } })
    ]);

    return {
      feedback,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    };
  }

  async list(options = {}) {
    const { filters = {}, skip = 0, limit = 10 } = options;
    
    const where = {};
    if (filters.fromUserId) where.fromUserId = filters.fromUserId;
    if (filters.toUserId) where.toUserId = filters.toUserId;
    if (filters.leaseId) where.leaseId = filters.leaseId;
    if (filters.thumbsUp !== undefined) where.thumbsUp = filters.thumbsUp;

    const [feedback, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        include: {
          fromUser: {
            select: { id: true, firstName: true, lastName: true }
          },
          toUser: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      this.prisma.feedback.count({ where })
    ]);

    return {
      feedback,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    };
  }

  async update(id, data) {
    try {
      return await this.prisma.feedback.update({
        where: { id },
        data,
        include: {
          fromUser: {
            select: { id: true, firstName: true, lastName: true }
          },
          toUser: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  async delete(id) {
    try {
      await this.prisma.feedback.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error.code === 'P2025') return false;
      throw error;
    }
  }
}

module.exports = PrismaFeedbackRepository;