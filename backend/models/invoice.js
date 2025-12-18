const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxPercent: { type: Number, default: 0 },
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
      unique: true, // Add unique constraint
    },

    invoiceDate: {
      type: Date,
      default: Date.now,
    },

    dueDate: {
      type: Date,
      required: true, // Make required
    },

    billFrom: {
      businessName: String,
      email: String,
      address: String,
      phone: String,
    },
    
    billTo: {
      clientName: String, // FIXED: Changed from "clientname" to "clientName"
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
      enum: ["Paid", "Pending", "Unpaid", "Overdue"], // Added "Pending"
      default: "Pending", // Changed from "Unpaid" to "Pending"
    },

    subtotal: Number,
    taxTotal: Number,
    total: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);