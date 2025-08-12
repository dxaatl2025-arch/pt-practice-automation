// server/src/repositories/interfaces/IPropertyRepository.js
class IPropertyRepository {
  /**
   * Create a new property
   * @param {Object} propertyData - Property data
   * @returns {Promise<Object>} Created property
   */
  async create(propertyData) {
    throw new Error('Method not implemented');
  }

  /**
   * Find property by ID
   * @param {string} id - Property ID
   * @returns {Promise<Object|null>} Property or null
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Update property by ID
   * @param {string} id - Property ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated property or null
   */
  async update(id, updateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete property by ID
   * @param {string} id - Property ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }

  /**
   * List properties with filters and pagination
   * @param {Object} options - { filters, sort, skip, limit, populate }
   * @returns {Promise<Object>} { properties, total, page, totalPages }
   */
  async list(options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Find properties by owner ID
   * @param {string} ownerId - Owner ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Properties
   */
  async findByOwnerId(ownerId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Search properties by location
   * @param {Object} location - { city, state, zipCode }
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Properties
   */
  async searchByLocation(location, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Filter properties by criteria
   * @param {Object} criteria - { minRent, maxRent, bedrooms, bathrooms, status }
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Properties
   */
  async filterByCriteria(criteria, options = {}) {
    throw new Error('Method not implemented');
  }
}

module.exports = IPropertyRepository;