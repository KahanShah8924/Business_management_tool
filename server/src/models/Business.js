const mongoose = require('mongoose');

// Represents a legal business entity. One user -> one business.
const addressSchema = new mongoose.Schema(
  {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // businessName
    email: { type: String, required: true, unique: true }, // businessEmail
    phone: { type: String, required: true },

    gstNumber: { type: String, required: true },
    businessType: { type: String, required: true },
    industry: { type: String, required: true },
    registrationDate: { type: String, required: true },

    panNumber: { type: String, required: true },

    address: { type: addressSchema, required: true },
  },
  {
    timestamps: true,
  }
);

businessSchema.index({ name: 1 }, { unique: true });
businessSchema.index({ email: 1 }, { unique: true });

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;

