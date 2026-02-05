const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    businessName: { type: String, required: true },
    gstNumber: { type: String, required: true },
    businessType: { type: String, required: true },
    industry: { type: String, required: true },
    registrationDate: { type: String, required: true },

    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },

    businessEmail: { type: String, required: true },
    businessPhone: { type: String, required: true },
    panNumber: { type: String, required: true },
    agreedToTerms: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;

