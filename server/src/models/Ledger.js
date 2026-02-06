const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ['DEBIT', 'CREDIT'],
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    partyName: {
      type: String,
      index: true,
    },

    referenceType: {
      type: String,
      enum: ['INVOICE', 'MANUAL', 'EXPENSE'],
      required: true,
      index: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      // For INVOICE referenceType, this points to an invoice document
      ref: 'Invoice',
      default: null,
    },

    description: {
      type: String,
    },

    // Optional stored running balance. Ledger API will also compute balance on the fly.
    balanceAfterTransaction: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

ledgerSchema.index({ businessId: 1, date: 1, createdAt: 1 });

const Ledger = mongoose.model('Ledger', ledgerSchema);

module.exports = Ledger;

