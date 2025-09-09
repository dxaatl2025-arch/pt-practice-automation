const prisma = require('../../../config/prisma');

class PaymentsRepository {
  async create(paymentData) {
    return await prisma.payment.create({
      data: paymentData,
      include: {
        lease: {
          include: {
            property: {
              select: { title: true, addressStreet: true }
            }
          }
        },
        tenant: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    });
  }

  async findById(id) {
    return await prisma.payment.findUnique({
      where: { id },
      include: {
        lease: {
          include: {
            property: {
              select: { title: true, addressStreet: true }
            }
          }
        },
        tenant: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    });
  }

  async findByProviderIntentId(providerIntentId) {
    return await prisma.payment.findUnique({
      where: { providerIntentId },
      include: {
        lease: {
          include: {
            property: {
              select: { title: true, addressStreet: true }
            }
          }
        },
        tenant: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    });
  }

  async updateStatus(id, status, paidDate = null) {
    return await prisma.payment.update({
      where: { id },
      data: {
        status,
        ...(paidDate && { paidDate })
      },
      include: {
        lease: {
          include: {
            property: {
              select: { title: true, addressStreet: true }
            }
          }
        },
        tenant: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    });
  }

  async findByLeaseId(leaseId) {
    return await prisma.payment.findMany({
      where: { leaseId },
      include: {
        tenant: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      },
      orderBy: { dueDate: 'desc' }
    });
  }
}

module.exports = PaymentsRepository;