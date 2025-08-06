 const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
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
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'US' }
  },
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'condo', 'townhouse', 'studio', 'other'],
    required: true
  },
  bedrooms: {
    type: Number,
    required: true,
    min: 0
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 0
  },
  squareFeet: {
    type: Number,
    min: 0
  },
  rent: {
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    period: { type: String, enum: ['monthly', 'weekly', 'daily'], default: 'monthly' }
  },
  deposit: {
    type: Number,
    default: 0,
    min: 0
  },
  amenities: [{
    type: String
  }],
  images: [{
    url: String,
    caption: String,
    isPrimary: { type: Boolean, default: false }
  }],
  availability: {
    isAvailable: { type: Boolean, default: true },
    availableFrom: Date,
    availableTo: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'rented', 'maintenance'],
    default: 'active'
  },
  utilities: {
    included: [String],
    excluded: [String]
  },
  petPolicy: {
    allowed: { type: Boolean, default: false },
    deposit: { type: Number, default: 0 },
    restrictions: [String]
  },
  coordinates: {
    lat: Number,
    lng: Number
  }
}, {
  timestamps: true
});

propertySchema.index({ landlord: 1 });
propertySchema.index({ 'address.city': 1, 'address.state': 1 });
propertySchema.index({ status: 1, 'availability.isAvailable': 1 });

module.exports = mongoose.model('Property', propertySchema);
