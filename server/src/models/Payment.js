// server/src/models/Payment.js - COMPLETE MODEL WITH STRIPE/PLAID INTEGRATION
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  lease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaseAgreement',
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
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentType: {
    type: String,
    enum: ['rent', 'security_deposit', 'late_fee', 'maintenance', 'utilities', 'other'],
    default: 'rent'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: Date,
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'failed', 'refunded', 'cancelled', 'processing'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'check', 'cash', 'online', 'ach', 'bank_account', 'card']
  },
  transactionDetails: {
    transactionId: String,
    processorId: String, // Stripe, PayPal, etc.
    last4: String, // Last 4 digits of card
    receiptUrl: String,
    
    // STRIPE/PLAID INTEGRATION FIELDS
    stripePaymentIntentId: String,
    stripeChargeId: String,
    stripeCustomerId: String,
    plaidAccountId: String,
    plaidTransactionId: String,
    platformFeeAmount: { type: Number, default: 0 },
    netAmount: Number
  },
  fees: {
    processingFee: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 },
    otherFees: [{ 
      name: String, 
      amount: Number 
    }]
  },
  notes: String,
  recurringPayment: {
    isRecurring: { type: Boolean, default: false },
    frequency: { type: String, enum: ['monthly', 'weekly', 'quarterly'] },
    nextDueDate: Date
  },
  refund: {
    refunded: { type: Boolean, default: false },
    refundAmount: Number,
    refundDate: Date,
    refundReason: String
  }
}, {
  timestamps: true
});

// Auto-update overdue payments and calculate net amounts
paymentSchema.pre('save', function(next) {
  // Existing overdue logic
  if (this.status === 'pending' && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
  
  // Calculate net amount after platform fees
  if (this.transactionDetails && this.transactionDetails.platformFeeAmount > 0) {
    this.transactionDetails.netAmount = this.amount - this.transactionDetails.platformFeeAmount;
  } else if (this.transactionDetails) {
    this.transactionDetails.netAmount = this.amount;
  }
  
  next();
});

// Calculate total amount including fees
paymentSchema.virtual('totalAmount').get(function() {
  let total = this.amount + this.fees.processingFee + this.fees.lateFee;
  this.fees.otherFees.forEach(fee => total += fee.amount);
  return total;
});

// NEW: Calculate landlord payout amount (amount minus platform fees)
paymentSchema.virtual('landlordPayout').get(function() {
  if (this.transactionDetails && this.transactionDetails.netAmount) {
    return this.transactionDetails.netAmount;
  }
  return this.amount - this.fees.processingFee;
});

// NEW: Check if payment was processed via Stripe/Plaid
paymentSchema.virtual('isDigitalPayment').get(function() {
  return !!(this.transactionDetails && 
    (this.transactionDetails.stripePaymentIntentId || this.transactionDetails.plaidTransactionId));
});

// Indexes for performance
paymentSchema.index({ tenant: 1, status: 1 });
paymentSchema.index({ landlord: 1, dueDate: 1 });
paymentSchema.index({ lease: 1, paymentType: 1 });
paymentSchema.index({ status: 1, dueDate: 1 });

// NEW: Indexes for Stripe/Plaid integration
paymentSchema.index({ 'transactionDetails.stripePaymentIntentId': 1 });
paymentSchema.index({ 'transactionDetails.stripeCustomerId': 1 });
paymentSchema.index({ 'transactionDetails.plaidAccountId': 1 });

// Ensure virtual fields are serialized
paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);