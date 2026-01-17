const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 }, // Changed from taxPercent to discountPercent
  total: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    invoiceDate: {
      type: Date,
      default: Date.now,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    billFrom: {
      businessName: String,
      email: String,
      address: String,
      phone: String,
    },
    
    billTo: {
      clientName: String,
      email: String,
      address: String,
      phone: String,
    },
    
    items: [itemSchema],

    notes: {
      type: String,
    },

    paymentTerms: {
      type: String,
      default: "Net 15",
    },

    status: {
      type: String,
      enum: ["Paid", "Pending", "Unpaid", "Overdue"],
      default: "Pending",
    },

    // Updated fields for discount
    subtotal: Number,
    discountTotal: Number, // Changed from taxTotal to discountTotal
    invoiceDiscount: { type: Number, default: 0 }, // New: invoice-level discount percentage
    total: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);