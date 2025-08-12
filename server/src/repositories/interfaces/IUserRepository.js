// server/src/repositories/interfaces/IUserRepository.js
class IUserRepository {
  async create(userData) { throw new Error('Method not implemented'); }
  async findById(id) { throw new Error('Method not implemented'); }
  async findByEmail(email) { throw new Error('Method not implemented'); }
  async update(id, updateData) { throw new Error('Method not implemented'); }
  async delete(id) { throw new Error('Method not implemented'); }
  async list(options = {}) { throw new Error('Method not implemented'); }
  async authenticate(email, password) { throw new Error('Method not implemented'); }
  async findByRole(role, options = {}) { throw new Error('Method not implemented'); }
}

module.exports = IUserRepository;