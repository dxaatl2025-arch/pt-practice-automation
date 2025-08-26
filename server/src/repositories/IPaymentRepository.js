class IPaymentRepository {
  async create(data) { throw new Error("Method 'create' must be implemented"); }
  async findById(id) { throw new Error("Method 'findById' must be implemented"); }
  async list(options = {}) { throw new Error("Method 'list' must be implemented"); }
  async update(id, data) { throw new Error("Method 'update' must be implemented"); }
  async delete(id) { throw new Error("Method 'delete' must be implemented"); }
  async findByLeaseId(leaseId, options = {}) { throw new Error("Method 'findByLeaseId' must be implemented"); }
}

