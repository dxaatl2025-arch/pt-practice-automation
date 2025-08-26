class IPropertyMatchProfileRepository {
  async findByPropertyId(propertyId) {
    throw new Error('Method not implemented');
  }

  async upsert(propertyId, data) {
    throw new Error('Method not implemented');
  }

  async delete(propertyId) {
    throw new Error('Method not implemented');
  }
}

module.exports = IPropertyMatchProfileRepository;