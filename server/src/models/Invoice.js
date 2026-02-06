const mongoose = require('mongoose');

const otherTaxSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    percent: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },

    // GST per line (or invoice-level fallback if not set)
    gstPercent: { type: Number, required: true, min: 0 },
    gstAmount: { type: Number, required: true, min: 0 },

    // Extensible list of other taxes per line
    otherTaxes: {
      type: [otherTaxSchema],
      default: [],
    },

    subtotal: { type: Number, required: true, min: 0 }, // before any tax
    lineOtherTaxTotal: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const customerDetailsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },

    // System invoice sequence (per business)
    invoiceNumber: {
      type: Number,
      required: true,
    },

    // User-facing reference that can follow business rules
    documentNumber: {
      type: String,
    },

    customerDetails: {
      type: customerDetailsSchema,
      required: true,
    },

    invoiceDate: {
      type: Date,
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
    },

    items: {
      type: [invoiceItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one line item is required',
      },
    },

    // Totals (derived only from items and taxes)
    subtotal: { type: Number, required: true, min: 0 },
    gstTotal: { type: Number, required: true, min: 0 },
    otherTaxTotal: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },

    // Customer credit position at the time of invoice (from ledger)
    openingBalance: { type: Number, required: true, min: 0 },

    // Immediate payment applied on this invoice
    paidAmount: { type: Number, required: true, min: 0 },

    // If true, invoice consumes customer's available credit balance
    useAvailableBalance: { type: Boolean, default: false },

    // Remaining customer credit after this invoice
    remainingBalance: { type: Number, required: true, min: 0 },

    // Net amount still payable after payment + balance adjustment
    finalPayableAmount: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE'],
      default: 'DRAFT',
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique invoice number per business
invoiceSchema.index({ businessId: 1, invoiceNumber: 1 }, { unique: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;

