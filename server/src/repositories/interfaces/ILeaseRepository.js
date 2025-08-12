// server/src/repositories/interfaces/ILeaseRepository.js
class ILeaseRepository {
  async create(leaseData) { throw new Error('Method not implemented'); }
  async findById(id) { throw new Error('Method not implemented'); }
  async update(id, updateData) { throw new Error('Method not implemented'); }
  async delete(id) { throw new Error('Method not implemented'); }
  async list(options = {}) { throw new Error('Method not implemented'); }
  async findByPropertyId(propertyId, options = {}) { throw new Error('Method not implemented'); }
  async findByTenantId(tenantId, options = {}) { throw new Error('Method not implemented'); }
  async findActiveLeases() { throw new Error('Method not implemented'); }
  async findExpiringLeases(days = 30) { throw new Error('Method not implemented'); }
}

module.exports = ILeaseRepository;