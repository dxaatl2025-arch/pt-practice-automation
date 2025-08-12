// server/src/repositories/mongo/PropertyRepository.js
const IPropertyRepository = require('../interfaces/IPropertyRepository');

class MongoPropertyRepository extends IPropertyRepository {
  constructor(PropertyModel) {
    super();
    this.Property = PropertyModel;
    console.log('🍃 MongoDB PropertyRepository initialized');
  }

  async create(propertyData) {
    try {
      const property = new this.Property(propertyData);
      const savedProperty = await property.save();
      
      // Populate landlord information
      await savedProperty.populate('landlord', 'firstName lastName email');
      
      return savedProperty.toObject();
    } catch (error) {
      throw new Error(`Failed to create property: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const property = await this.Property.findById(id)
        .populate('landlord', 'firstName lastName email');
      
      return property ? property.toObject() : null;
    } catch (error) {
      throw new Error(`Failed to find property: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      const property = await this.Property.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      ).populate('landlord', 'firstName lastName email');
      
      return property ? property.toObject() : null;
    } catch (error) {
      throw new Error(`Failed to update property: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const result = await this.Property.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Failed to delete property: ${error.message}`);
    }
  }

  async list(options = {}) {
    try {
      const {
        filters = {},
        sort = { createdAt: -1 },
        skip = 0,
        limit = 10,
        populate = true
      } = options;

      const query = this.Property.find(filters);
      
      if (populate) {
        query.populate('landlord', 'firstName lastName email');
      }

      const [properties, total] = await Promise.all([
        query.sort(sort).skip(skip).limit(limit).lean().exec(),
        this.Property.countDocuments(filters)
      ]);

      return {
        properties,
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to list properties: ${error.message}`);
    }
  }

  async findByOwnerId(ownerId, options = {}) {
    try {
      const { sort = { createdAt: -1 }, limit } = options;
      const query = this.Property.find({ landlord: ownerId }).sort(sort).lean();
      
      if (limit) {
        query.limit(limit);
      }

      return await query.exec();
    } catch (error) {
      throw new Error(`Failed to find properties by owner: ${error.message}`);
    }
  }

  async searchByLocation(location, options = {}) {
    try {
      const { city, state, zipCode } = location;
      const filters = {};

      if (city) filters['address.city'] = new RegExp(city, 'i');
      if (state) filters['address.state'] = new RegExp(state, 'i');
      if (zipCode) filters['address.zipCode'] = zipCode;

      return await this.list({ ...options, filters });
    } catch (error) {
      throw new Error(`Failed to search properties by location: ${error.message}`);
    }
  }

  async filterByCriteria(criteria, options = {}) {
    try {
      const { minRent, maxRent, bedrooms, bathrooms, status } = criteria;
      const filters = {};

      if (minRent !== undefined || maxRent !== undefined) {
        filters['rent.amount'] = {};
        if (minRent !== undefined) filters['rent.amount'].$gte = minRent;
        if (maxRent !== undefined) filters['rent.amount'].$lte = maxRent;
      }

      if (bedrooms !== undefined) filters.bedrooms = bedrooms;
      if (bathrooms !== undefined) filters.bathrooms = bathrooms;
      if (status) filters.status = status;

      return await this.list({ ...options, filters });
    } catch (error) {
      throw new Error(`Failed to filter properties: ${error.message}`);
    }
  }
}

module.exports = MongoPropertyRepository;