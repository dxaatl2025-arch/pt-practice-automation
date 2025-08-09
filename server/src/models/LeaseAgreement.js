 // src/models/LeaseAgreement.js
const mongoose = require('mongoose');

const leaseAgreementSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  monthlyRent: {
    type: Number,
    required: true,
    min: 0
  },
  securityDeposit: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDueDate: {
    type: Number,
    min: 1,
    max: 31,
    default: 1
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'expired', 'terminated', 'pending_approval'],
    default: 'draft'
  },
  terms: {
    type: String,
    required: true
  },
  specialConditions: [String],
  signatures: {
    tenant: {
      signed: { type: Boolean, default: false },
      signedAt: Date,
      ipAddress: String
    },
    landlord: {
      signed: { type: Boolean, default: false },
      signedAt: Date,
      ipAddress: String
    }
  },
  renewalOptions: {
    autoRenew: { type: Boolean, default: false },
    renewalPeriod: { type: Number, default: 12 }, // months
    rentIncrease: { type: Number, default: 0 } // percentage
  },
  earlyTermination: {
    allowed: { type: Boolean, default: false },
    noticePeriod: { type: Number, default: 30 }, // days
    penalty: { type: Number, default: 0 }
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Prevent multiple active leases for same property
leaseAgreementSchema.index({ 
  property: 1, 
  status: 1 
}, { 
  unique: true, 
  partialFilterExpression: { status: 'active' } 
});

// Index for queries
leaseAgreementSchema.index({ landlord: 1, status: 1 });
leaseAgreementSchema.index({ tenant: 1, status: 1 });

// Auto-update property status when lease becomes active
leaseAgreementSchema.post('save', async function() {
  if (this.status === 'active') {
    await mongoose.model('Property').findByIdAndUpdate(
      this.property,
      { 
        status: 'rented',
        'availability.isAvailable': false 
      }
    );
  } else if (['expired', 'terminated'].includes(this.status)) {
    await mongoose.model('Property').findByIdAndUpdate(
      this.property,
      { 
        status: 'active',
        'availability.isAvailable': true 
      }
    );
  }
});

module.exports = mongoose.model('LeaseAgreement', leaseAgreementSchema);
