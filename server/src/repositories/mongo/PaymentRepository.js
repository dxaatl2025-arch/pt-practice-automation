// server/src/repositories/mongo/PaymentRepository.js
const IPaymentRepository = require('../interfaces/IPaymentRepository');

class MongoPaymentRepository extends IPaymentRepository {
  constructor(PaymentModel) {
    super();
    this.Payment = PaymentModel;
    console.log('🍃 MongoDB PaymentRepository initialized');
  }

  async create(paymentData) {
    try {
      const payment = new this.Payment(paymentData);
      await payment.save();
      
      // Populate lease, tenant, and landlord details (matching your schema)
      await payment.populate([
        { 
          path: 'lease', 
          select: 'startDate endDate monthlyRent',
          populate: { path: 'property', select: 'title address' }
        },
        { path: 'tenant', select: 'firstName lastName email' },
        { path: 'landlord', select: 'firstName lastName email' }
      ]);
      
      return payment.toObject();
    } catch (error) {
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const payment = await this.Payment.findById(id)
        .populate({
          path: 'lease',
          select: 'startDate endDate monthlyRent',
          populate: { path: 'property', select: 'title address' }
        })
        .populate('tenant', 'firstName lastName email')
        .populate('landlord', 'firstName lastName email')
        .lean();
      
      return payment;
    } catch (error) {
      throw new Error(`Failed to find payment: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      const payment = await this.Payment.findByIdAndUpdate(id, updateData, { 
        new: true, 
        runValidators: true 
      })
        .populate({
          path: 'lease',
          select: 'startDate endDate monthlyRent',
          populate: { path: 'property', select: 'title address' }
        })
        .populate('tenant', 'firstName lastName email')
        .lean();
      
      return payment;
    } catch (error) {
      throw new Error(`Failed to update payment: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const result = await this.Payment.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Failed to delete payment: ${error.message}`);
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

      const query = this.Payment.find(filters);
      
      if (populate) {
        query
          .populate({
            path: 'lease',
            select: 'startDate endDate monthlyRent',
            populate: { path: 'property', select: 'title address' }
          })
          .populate('tenant', 'firstName lastName email');
      }

      const [payments, total] = await Promise.all([
        query
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        this.Payment.countDocuments(filters)
      ]);

      return {
        payments,
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to list payments: ${error.message}`);
    }
  }

  async findByLeaseId(leaseId, options = {}) {
    try {
      const { sort = { dueDate: 1 }, limit } = options;
      
      return await this.Payment.find({ lease: leaseId })
        .populate('tenant', 'firstName lastName email')
        .sort(sort)
        .limit(limit || undefined)
        .lean();
    } catch (error) {
      throw new Error(`Failed to find payments by lease: ${error.message}`);
    }
  }

  async findByTenantId(tenantId, options = {}) {
    try {
      const { sort = { dueDate: -1 }, limit } = options;
      
      return await this.Payment.find({ tenant: tenantId })
        .populate({
          path: 'lease',
          select: 'startDate endDate monthlyRent',
          populate: { path: 'property', select: 'title address' }
        })
        .sort(sort)
        .limit(limit || undefined)
        .lean();
    } catch (error) {
      throw new Error(`Failed to find payments by tenant: ${error.message}`);
    }
  }

  async findOverduePayments() {
    try {
      const now = new Date();
      return await this.Payment.find({
        dueDate: { $lt: now },
        status: { $in: ['pending', 'overdue'] }
      })
        .populate({
          path: 'lease',
          select: 'startDate endDate monthlyRent',
          populate: { path: 'property', select: 'title address' }
        })
        .populate('tenant', 'firstName lastName email')
        .sort({ dueDate: 1 })
        .lean();
    } catch (error) {
      throw new Error(`Failed to find overdue payments: ${error.message}`);
    }
  }

  async findUpcomingPayments(days = 7) {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);

      return await this.Payment.find({
        dueDate: { 
          $gte: now,
          $lte: futureDate 
        },
        status: 'pending'
      })
        .populate({
          path: 'lease',
          select: 'startDate endDate monthlyRent',
          populate: { path: 'property', select: 'title address' }
        })
        .populate('tenant', 'firstName lastName email')
        .sort({ dueDate: 1 })
        .lean();
    } catch (error) {
      throw new Error(`Failed to find upcoming payments: ${error.message}`);
    }
  }
}

module.exports = MongoPaymentRepository;