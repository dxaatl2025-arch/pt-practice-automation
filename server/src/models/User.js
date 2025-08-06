 const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['landlord', 'tenant', 'admin'],
    default: 'tenant'
  },
  phone: {
    type: String,
    sparse: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'US' }
  },
  profileImage: String,
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' }
  }
}, {
  timestamps: true
});

userSchema.index({ firebaseUid: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
