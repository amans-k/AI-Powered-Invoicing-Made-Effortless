const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
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

    // Due date optional karo (required hataya)
    dueDate: {
      type: Date,
    },

    billFrom: {
      businessName: String,
      email: String,
      address: String,
      phone: String,
    },
    
    // BillTo simplify karo (sirf clientName aur phone)
    billTo: {
      clientName: String,
      phone: String,
    },
    
    items: [itemSchema],

    notes: {
      type: String,
    },

    // Payment terms optional karo
    paymentTerms: {
      type: String,
    },

    paymentMode: {
      type: String,
      enum: ["Cash", "Online", "Cheque", "Card", "UPI", "Bank Transfer"],
      default: "Cash",
    },

    status: {
      type: String,
      enum: ["Pending", "Paid", "Overdue", "Cancelled"],
      default: "Pending",
    },

    subtotal: Number,
    discountTotal: Number,
    invoiceDiscount: { type: Number, default: 0 },
    total: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);