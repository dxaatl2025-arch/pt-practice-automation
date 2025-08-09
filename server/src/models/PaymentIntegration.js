// server/src/models/PaymentIntegration.js
const mongoose = require('mongoose');

const PaymentIntegrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    enum: ['landlord', 'tenant'],
    required: true
  },
  // Stripe Integration
  stripe: {
    customerId: {
      type: String,
      default: null
    },
    accountId: {
      type: String,
      default: null
    },
    defaultPaymentMethodId: {
      type: String,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  // Plaid Integration
  plaid: {
    accessToken: {
      type: String,
      default: null
    },
    itemId: {
      type: String,
      default: null
    },
    linkedAccounts: [{
      accountId: String,
      accountName: String,
      accountType: String,
      accountSubtype: String,
      mask: String,
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    linkToken: {
      type: String,
      default: null
    },
    linkTokenExpiry: {
      type: Date,
      default: null
    }
  },
  preferences: {
    preferredPaymentMethod: {
      type: String,
      enum: ['bank_account', 'card'],
      default: 'bank_account'
    },
    autoPayEnabled: {
      type: Boolean,
      default: false
    },
    paymentReminders: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

PaymentIntegrationSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('PaymentIntegration', PaymentIntegrationSchema);