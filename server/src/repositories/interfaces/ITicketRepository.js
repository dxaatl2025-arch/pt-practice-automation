// server/src/repositories/interfaces/ITicketRepository.js
class ITicketRepository {
  async create(ticketData) { throw new Error('Method not implemented'); }
  async findById(id) { throw new Error('Method not implemented'); }
  async update(id, updateData) { throw new Error('Method not implemented'); }
  async delete(id) { throw new Error('Method not implemented'); }
  async list(options = {}) { throw new Error('Method not implemented'); }
  async findByPropertyId(propertyId, options = {}) { throw new Error('Method not implemented'); }
  async findByTenantId(tenantId, options = {}) { throw new Error('Method not implemented'); }
  async findByStatus(status, options = {}) { throw new Error('Method not implemented'); }
  async findByPriority(priority, options = {}) { throw new Error('Method not implemented'); }
}

module.exports = ITicketRepository;