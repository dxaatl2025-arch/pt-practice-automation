// server/src/repositories/mongo/PaymentRepository.js 
class PaymentRepository { 
  constructor(PaymentModel) { this.Payment = PaymentModel; } 
  async list(options = {}) { 
    const { filters = {}, skip = 0, limit = 10 } = options; 
    const payments = await this.Payment.find(filters).skip(skip).limit(limit).lean(); 
    const total = await this.Payment.countDocuments(filters); 
    return { payments: payments.map(p => ({ id: p._id.toString(), ...p })), pagination: { page: Math.floor(skip / limit) + 1, totalPages: Math.ceil(total / limit), total, limit } }; 
  } 
} 
module.exports = PaymentRepository; 
