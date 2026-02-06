const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },

    // Kept for backward compatibility with earlier signup payloads.
    // Source of truth for business metadata is `Business` collection.
    businessName: { type: String },
    gstNumber: { type: String },
    businessType: { type: String },
    industry: { type: String },
    registrationDate: { type: String },

    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    pincode: { type: String },
    state: { type: String },
    country: { type: String },

    businessEmail: { type: String },
    businessPhone: { type: String },
    panNumber: { type: String },
    agreedToTerms: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ businessId: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User;

