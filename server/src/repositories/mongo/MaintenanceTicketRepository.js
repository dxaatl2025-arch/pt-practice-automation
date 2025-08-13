// server/src/repositories/mongo/MaintenanceTicketRepository.js 
class MaintenanceTicketRepository { 
  constructor(MaintenanceTicketModel) { this.MaintenanceTicket = MaintenanceTicketModel; } 
  async list(options = {}) { 
    const { filters = {}, skip = 0, limit = 10 } = options; 
    const tickets = await this.MaintenanceTicket.find(filters).skip(skip).limit(limit).lean(); 
    const total = await this.MaintenanceTicket.countDocuments(filters); 
    return { tickets: tickets.map(t => ({ id: t._id.toString(), ...t })), pagination: { page: Math.floor(skip / limit) + 1, totalPages: Math.ceil(total / limit), total, limit } }; 
  } 
} 
module.exports = MaintenanceTicketRepository; 
