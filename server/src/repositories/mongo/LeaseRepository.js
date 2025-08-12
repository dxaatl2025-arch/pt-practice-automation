// server/src/repositories/mongo/LeaseRepository.js
const ILeaseRepository = require('../interfaces/ILeaseRepository');

class MongoLeaseRepository extends ILeaseRepository {
  constructor(LeaseModel) {
    super();
    this.Lease = LeaseModel;
    console.log('🍃 MongoDB LeaseRepository initialized');
  }

  async create(leaseData) {
    try {
      const lease = new this.Lease(leaseData);
      await lease.save();
      
      // Populate property and tenant details
      await lease.populate([
        { path: 'property', select: 'title address' },
        { path: 'tenant', select: 'firstName lastName email' }
      ]);
      
      return lease.toObject();
    } catch (error) {
      throw new Error(`Failed to create lease: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const lease = await this.Lease.findById(id)
        .populate('property', 'title address')
        .populate('tenant', 'firstName lastName email')
        .lean();
      
      return lease;
    } catch (error) {
      throw new Error(`Failed to find lease: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      const lease = await this.Lease.findByIdAndUpdate(id, updateData, { 
        new: true, 
        runValidators: true 
      })
        .populate('property', 'title address')
        .populate('tenant', 'firstName lastName email')
        .lean();
      
      return lease;
    } catch (error) {
      throw new Error(`Failed to update lease: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const result = await this.Lease.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Failed to delete lease: ${error.message}`);
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

      const query = this.Lease.find(filters);
      
      if (populate) {
        query
          .populate('property', 'title address')
          .populate('tenant', 'firstName lastName email');
      }

      const [leases, total] = await Promise.all([
        query
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        this.Lease.countDocuments(filters)
      ]);

      return {
        leases,
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to list leases: ${error.message}`);
    }
  }

  async findByPropertyId(propertyId, options = {}) {
    try {
      const { sort = { createdAt: -1 }, limit } = options;
      
      return await this.Lease.find({ property: propertyId })
        .populate('tenant', 'firstName lastName email')
        .sort(sort)
        .limit(limit || undefined)
        .lean();
    } catch (error) {
      throw new Error(`Failed to find leases by property: ${error.message}`);
    }
  }

  async findByTenantId(tenantId, options = {}) {
    try {
      const { sort = { createdAt: -1 }, limit } = options;
      
      return await this.Lease.find({ tenant: tenantId })
        .populate('property', 'title address')
        .sort(sort)
        .limit(limit || undefined)
        .lean();
    } catch (error) {
      throw new Error(`Failed to find leases by tenant: ${error.message}`);
    }
  }

  async findActiveLeases() {
    try {
      const now = new Date();
      return await this.Lease.find({
        startDate: { $lte: now },
        endDate: { $gte: now },
        status: 'active'
      })
        .populate('property', 'title address')
        .populate('tenant', 'firstName lastName email')
        .lean();
    } catch (error) {
      throw new Error(`Failed to find active leases: ${error.message}`);
    }
  }

  async findExpiringLeases(days = 30) {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);

      return await this.Lease.find({
        endDate: { 
          $gte: now,
          $lte: futureDate 
        },
        status: 'active'
      })
        .populate('property', 'title address')
        .populate('tenant', 'firstName lastName email')
        .sort({ endDate: 1 })
        .lean();
    } catch (error) {
      throw new Error(`Failed to find expiring leases: ${error.message}`);
    }
  }
}

module.exports = MongoLeaseRepository;