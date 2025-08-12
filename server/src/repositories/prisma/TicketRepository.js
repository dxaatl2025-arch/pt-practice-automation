// server/src/repositories/prisma/TicketRepository.js
class TicketRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
    console.log('🐘 Prisma TicketRepository initialized');
  }

  async create(ticketData) {
    try {
      const ticket = await this.prisma.maintenanceTicket.create({
        data: {
          propertyId: ticketData.propertyId,
          tenantId: ticketData.tenantId,
          title: ticketData.title,
          description: ticketData.description,
          priority: ticketData.priority || 'MEDIUM',
          status: ticketData.status || 'OPEN'
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
              email: true,
              phone: true
            }
          }
        }
      });
      return this._formatResponse(ticket);
    } catch (error) {
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const ticket = await this.prisma.maintenanceTicket.findUnique({
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
              email: true,
              phone: true
            }
          }
        }
      });
      return ticket ? this._formatResponse(ticket) : null;
    } catch (error) {
      throw new Error(`Failed to find ticket: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      const data = {};
      if (updateData.title) data.title = updateData.title;
      if (updateData.description) data.description = updateData.description;
      if (updateData.priority) data.priority = updateData.priority;
      if (updateData.status) data.status = updateData.status;

      const ticket = await this.prisma.maintenanceTicket.update({
        where: { id },
        data,
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
              email: true,
              phone: true
            }
          }
        }
      });
      return this._formatResponse(ticket);
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw new Error(`Failed to update ticket: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      await this.prisma.maintenanceTicket.delete({ where: { id } });
      return true;
    } catch (error) {
      if (error.code === 'P2025') return false;
      throw new Error(`Failed to delete ticket: ${error.message}`);
    }
  }

  async list({ filters = {}, skip = 0, limit = 10 }) {
    try {
      const where = this._buildWhere(filters);
      const [tickets, total] = await Promise.all([
        this.prisma.maintenanceTicket.findMany({
          where,
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
                email: true,
                phone: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.maintenanceTicket.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);
      const page = Math.floor(skip / limit) + 1;

      return {
        tickets: tickets.map(t => this._formatResponse(t)),
        pagination: { page, totalPages, total, limit }
      };
    } catch (error) {
      throw new Error(`Failed to list tickets: ${error.message}`);
    }
  }

  async findByPropertyId(propertyId, options = {}) {
    try {
      const { skip = 0, limit = 10, status } = options;
      const where = { propertyId };
      if (status) where.status = status;

      const [tickets, total] = await Promise.all([
        this.prisma.maintenanceTicket.findMany({
          where,
          include: {
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.maintenanceTicket.count({ where })
      ]);

      return {
        tickets: tickets.map(t => this._formatResponse(t)),
        total
      };
    } catch (error) {
      throw new Error(`Failed to find tickets by property: ${error.message}`);
    }
  }

  async findByTenantId(tenantId, options = {}) {
    try {
      const { skip = 0, limit = 10, status } = options;
      const where = { tenantId };
      if (status) where.status = status;

      const [tickets, total] = await Promise.all([
        this.prisma.maintenanceTicket.findMany({
          where,
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
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.maintenanceTicket.count({ where })
      ]);

      return {
        tickets: tickets.map(t => this._formatResponse(t)),
        total
      };
    } catch (error) {
      throw new Error(`Failed to find tickets by tenant: ${error.message}`);
    }
  }

  async findByStatus(status, options = {}) {
    try {
      const { skip = 0, limit = 10 } = options;
      const [tickets, total] = await Promise.all([
        this.prisma.maintenanceTicket.findMany({
          where: { status },
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
                email: true,
                phone: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.maintenanceTicket.count({ where: { status } })
      ]);

      return {
        tickets: tickets.map(t => this._formatResponse(t)),
        total
      };
    } catch (error) {
      throw new Error(`Failed to find tickets by status: ${error.message}`);
    }
  }

  async findByPriority(priority, options = {}) {
    try {
      const { skip = 0, limit = 10 } = options;
      const [tickets, total] = await Promise.all([
        this.prisma.maintenanceTicket.findMany({
          where: { priority },
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
                email: true,
                phone: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.maintenanceTicket.count({ where: { priority } })
      ]);

      return {
        tickets: tickets.map(t => this._formatResponse(t)),
        total
      };
    } catch (error) {
      throw new Error(`Failed to find tickets by priority: ${error.message}`);
    }
  }

  _buildWhere(filters) {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.propertyId) where.propertyId = filters.propertyId;
    if (filters.tenantId) where.tenantId = filters.tenantId;
    return where;
  }

  _formatResponse(ticket) {
    return {
      id: ticket.id,
      propertyId: ticket.propertyId,
      tenantId: ticket.tenantId,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      property: ticket.property ? {
        id: ticket.property.id,
        title: ticket.property.title,
        address: ticket.property.addressStreet,
        city: ticket.property.addressCity,
        state: ticket.property.addressState
      } : undefined,
      tenant: ticket.tenant ? {
        id: ticket.tenant.id,
        firstName: ticket.tenant.firstName,
        lastName: ticket.tenant.lastName,
        email: ticket.tenant.email,
        phone: ticket.tenant.phone
      } : undefined
    };
  }
}

module.exports = TicketRepository;