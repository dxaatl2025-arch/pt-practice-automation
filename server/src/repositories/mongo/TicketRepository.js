// server/src/repositories/mongo/TicketRepository.js
class TicketRepository {
  constructor(model) {
    this.model = model;
    console.log('🍃 MongoDB TicketRepository initialized');
  }

  async create(ticketData) {
    try {
      const ticket = new this.model(ticketData);
      const savedTicket = await ticket.save();
      
      const populatedTicket = await this.model
        .findById(savedTicket._id)
        .populate('property', 'title address city state')
        .populate('tenant', 'firstName lastName email phone')
        .lean();

      return this._formatResponse(populatedTicket);
    } catch (error) {
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const ticket = await this.model
        .findById(id)
        .populate('property', 'title address city state')
        .populate('tenant', 'firstName lastName email phone')
        .lean();

      return ticket ? this._formatResponse(ticket) : null;
    } catch (error) {
      throw new Error(`Failed to find ticket: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      const ticket = await this.model
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('property', 'title address city state')
        .populate('tenant', 'firstName lastName email phone')
        .lean();

      return ticket ? this._formatResponse(ticket) : null;
    } catch (error) {
      throw new Error(`Failed to update ticket: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const result = await this.model.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Failed to delete ticket: ${error.message}`);
    }
  }

  async list({ filters = {}, skip = 0, limit = 10, sort = { createdAt: -1 } }) {
    try {
      const query = this._buildQuery(filters);
      
      const tickets = await this.model
        .find(query)
        .populate('property', 'title address city state')
        .populate('tenant', 'firstName lastName email phone')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await this.model.countDocuments(query);
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
      let query = { property: propertyId };
      if (status) query.status = status;

      const tickets = await this.model
        .find(query)
        .populate('tenant', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await this.model.countDocuments(query);

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
      let query = { tenant: tenantId };
      if (status) query.status = status;

      const tickets = await this.model
        .find(query)
        .populate('property', 'title address city state')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await this.model.countDocuments(query);

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
      
      const tickets = await this.model
        .find({ status })
        .populate('property', 'title address city state')
        .populate('tenant', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await this.model.countDocuments({ status });

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
      
      const tickets = await this.model
        .find({ priority })
        .populate('property', 'title address city state')
        .populate('tenant', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await this.model.countDocuments({ priority });

      return {
        tickets: tickets.map(t => this._formatResponse(t)),
        total
      };
    } catch (error) {
      throw new Error(`Failed to find tickets by priority: ${error.message}`);
    }
  }

  _buildQuery(filters) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.propertyId) query.property = filters.propertyId;
    if (filters.tenantId) query.tenant = filters.tenantId;
    return query;
  }

  _formatResponse(ticket) {
    return {
      id: ticket._id.toString(),
      propertyId: ticket.property?._id?.toString() || ticket.property,
      tenantId: ticket.tenant?._id?.toString() || ticket.tenant,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      property: ticket.property?._id ? {
        id: ticket.property._id.toString(),
        title: ticket.property.title,
        address: ticket.property.address,
        city: ticket.property.city,
        state: ticket.property.state
      } : undefined,
      tenant: ticket.tenant?._id ? {
        id: ticket.tenant._id.toString(),
        firstName: ticket.tenant.firstName,
        lastName: ticket.tenant.lastName,
        email: ticket.tenant.email,
        phone: ticket.tenant.phone
      } : undefined
    };
  }
}

module.exports = TicketRepository;