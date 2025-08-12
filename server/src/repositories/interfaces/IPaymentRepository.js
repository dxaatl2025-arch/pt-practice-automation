// server/src/repositories/interfaces/IPaymentRepository.js
class IPaymentRepository {
  async create(paymentData) { throw new Error('Method not implemented'); }
  async findById(id) { throw new Error('Method not implemented'); }
  async update(id, updateData) { throw new Error('Method not implemented'); }
  async delete(id) { throw new Error('Method not implemented'); }
  async list(options = {}) { throw new Error('Method not implemented'); }
  async findByLeaseId(leaseId, options = {}) { throw new Error('Method not implemented'); }
  async findByTenantId(tenantId, options = {}) { throw new Error('Method not implemented'); }
  async findOverduePayments() { throw new Error('Method not implemented'); }
  async findUpcomingPayments(days = 7) { throw new Error('Method not implemented'); }
}

module.exports = IPaymentRepository;