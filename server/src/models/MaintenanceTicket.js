 // src/models/MaintenanceTicket.js
const mongoose = require('mongoose');

const maintenanceTicketSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest_control', 'locks_security', 'general_maintenance', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent', 'emergency'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'acknowledged', 'in_progress', 'waiting_parts', 'completed', 'cancelled', 'on_hold'],
    default: 'open'
  },
  location: {
    type: String,
    required: true // e.g., "Kitchen", "Bathroom 1", "Living Room"
  },
  images: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  assignment: {
    assignedTo: String, // Contractor name or company
    assignedAt: Date,
    contactInfo: {
      phone: String,
      email: String
    },
    estimatedCost: Number,
    actualCost: Number,
    estimatedCompletion: Date
  },
  schedule: {
    scheduledDate: Date,
    timeSlot: String, // e.g., "9:00 AM - 12:00 PM"
    completedDate: Date,
    tenantAvailable: { type: Boolean, default: true }
  },
  communication: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['note', 'status_update', 'cost_estimate', 'completion_notice'] }
  }],
  warranty: {
    warrantyPeriod: Number, // days
    warrantyExpires: Date,
    warrantyProvider: String
  },
  followUp: {
    followUpRequired: { type: Boolean, default: false },
    followUpDate: Date,
    followUpCompleted: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Auto-set landlord from property
maintenanceTicketSchema.pre('save', async function(next) {
  if (this.isNew && !this.landlord) {
    const Property = mongoose.model('Property');
    const property = await Property.findById(this.property);
    if (property) {
      this.landlord = property.landlord;
    }
  }
  
  // Auto-set completion date when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.schedule.completedDate) {
    this.schedule.completedDate = new Date();
  }
  
  next();
});

// Calculate response time
maintenanceTicketSchema.virtual('responseTime').get(function() {
  if (this.status === 'open') return null;
  
  const firstResponse = this.communication.find(comm => 
    comm.type === 'status_update' && 
    comm.timestamp > this.createdAt
  );
  
  if (firstResponse) {
    return Math.round((firstResponse.timestamp - this.createdAt) / (1000 * 60 * 60)); // hours
  }
  return null;
});

// Indexes for performance
maintenanceTicketSchema.index({ property: 1, status: 1 });
maintenanceTicketSchema.index({ tenant: 1, status: 1 });
maintenanceTicketSchema.index({ landlord: 1, priority: 1, status: 1 });
maintenanceTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });

module.exports = mongoose.model('MaintenanceTicket', maintenanceTicketSchema);
