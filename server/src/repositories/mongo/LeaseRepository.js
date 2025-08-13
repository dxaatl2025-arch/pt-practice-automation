// server/src/repositories/mongo/LeaseRepository.js 
class LeaseRepository { 
  constructor(LeaseModel) { 
    this.Lease = LeaseModel; 
  } 
 
  async list(options = {}) { 
    const { filters = {}, skip = 0, limit = 10 } = options; 
    const leases = await this.Lease.find(filters).skip(skip).limit(limit).lean(); 
    const total = await this.Lease.countDocuments(filters); 
    return { 
      leases: leases.map(l => ({ id: l._id.toString(), ...l })), 
      pagination: { page: Math.floor(skip / limit) + 1, totalPages: Math.ceil(total / limit), total, limit } 
    }; 
  } 
} 
 
module.exports = LeaseRepository; 
