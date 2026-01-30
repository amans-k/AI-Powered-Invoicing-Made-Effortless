const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    enum: [
      "Boys T-shirt",
      "Boys Shorts",
      "Boys Denim Shorts",
      "Boys IMP",
      "Boys Jeans",
      "Boys Shirt",
      "Girls Jeans",
      "Girls Shirt",
      "Girls IMP",
      "Girls Top",
      "Girls Leggings",
      "Girls Shorts",
      "Doreme",
      "Girls Fancy Tshirt",
      "Girls Denim Shorts",
      "Others"
    ],
    default: "Boys T-shirt"
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1,
    default: 1
  },
  unitPrice: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  total: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
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
      index: true,
    },

    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    
    billFrom: {
      businessName: {
        type: String,
        default: "Cotton Stock Kid's Wear"
      },
      email: {
        type: String,
        default: "cottonstockkidswear@gmail.com"
      },
      address: {
        type: String,
        default: "Shop no M-1832 (2P) ground floor gandhi bazaar, Chembur colony, chembur 400074"
      },
      phone: {
        type: String,
        default: "8591116115"
      },
    },
    
    billTo: {
      clientName: {
        type: String,
        required: [true, "Client name is required"],
        trim: true
      },
      phone: {
        type: String,
        required: [true, "Client phone is required"],
        trim: true
      },
    },
    
    items: {
      type: [itemSchema],
      required: true,
      validate: {
        validator: function(v) {
          return v.length > 0;
        },
        message: "At least one item is required"
      }
    },

    notes: {
      type: String,
      default: "",
      trim: true
    },

    paymentMode: {
      type: String,
      enum: ["Cash", "Online", "Card"],
      default: "Cash",
      required: true
    },

    // ✅ FIXED: Default to "Paid" as per your requirement
    status: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Paid", // ✅ Changed from "Unpaid" to "Paid"
      required: true
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    
    discountTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    
    directAmountReduction: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    
    invoiceDiscount: {
      type: Number,
      min: 0,
      default: 0
    },
    
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    
    totalPieces: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ✅ Compound index
invoiceSchema.index({ user: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ user: 1, invoiceDate: -1 });
invoiceSchema.index({ user: 1, status: 1 });
invoiceSchema.index({ user: 1, paymentMode: 1 });

// ✅ Pre-save middleware
invoiceSchema.pre('save', function(next) {
  // Calculate subtotal and total pieces from items
  this.subtotal = this.items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    item.total = itemTotal;
    return sum + itemTotal;
  }, 0);
  
  // Calculate total pieces
  this.totalPieces = this.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Auto-migrate old discount
  if (this.invoiceDiscount > 0 && this.directAmountReduction === 0) {
    this.directAmountReduction = this.invoiceDiscount;
  }
  
  // Set discountTotal
  this.discountTotal = this.directAmountReduction || 0;
  
  // Calculate final total
  this.total = Math.max(0, this.subtotal - this.directAmountReduction);
  
  // ✅ FIXED: Auto-convert old "Pending" status to "Paid"
  if (this.status === "Pending") {
    this.status = "Paid"; // ✅ Changed from "Unpaid" to "Paid"
  }
  
  // Set default billFrom if empty
  if (!this.billFrom || !this.billFrom.businessName) {
    this.billFrom = {
      businessName: "Cotton Stock Kid's Wear",
      email: "cottonstockkidswear@gmail.com",
      address: "Shop no M-1832 (2P) ground floor gandhi bazaar, Chembur colony, chembur 400074",
      phone: "8591116115"
    };
  }
  
  next();
});

// ✅ FIXED: Pre-update middleware - REMOVED async
invoiceSchema.pre('findOneAndUpdate', function(next) { // ❌ REMOVED async
  const update = this.getUpdate();
  
  // ✅ FIXED: Auto-convert "Pending" to "Paid" if status is being updated
  if (update && (update.status === "Pending" || update.$set?.status === "Pending")) {
    if (update.$set) {
      update.$set.status = "Paid"; // ✅ Changed from "Unpaid" to "Paid"
    } else {
      update.status = "Paid"; // ✅ Changed from "Unpaid" to "Paid"
    }
  }
  
  // Auto-migrate old invoiceDiscount to directAmountReduction
  if (update && ((update.invoiceDiscount > 0 && update.directAmountReduction === 0) || 
      (update.$set?.invoiceDiscount > 0 && update.$set?.directAmountReduction === 0))) {
    if (update.$set) {
      update.$set.directAmountReduction = update.$set.invoiceDiscount || update.invoiceDiscount;
    } else {
      update.directAmountReduction = update.invoiceDiscount;
    }
  }
  
  next(); // ✅ Now this will work!
});

// ✅ Virtual for formatted invoice date
invoiceSchema.virtual('formattedInvoiceDate').get(function() {
  return this.invoiceDate ? this.invoiceDate.toISOString().split('T')[0] : '';
});

// ✅ Virtual for isToday check
invoiceSchema.virtual('isToday').get(function() {
  const today = new Date();
  const invoiceDate = new Date(this.invoiceDate);
  return today.toDateString() === invoiceDate.toDateString();
});

// ✅ Instance method to mark as paid
invoiceSchema.methods.markAsPaid = function() {
  this.status = 'Paid';
  return this.save();
};

// ✅ Instance method to mark as unpaid
invoiceSchema.methods.markAsUnpaid = function() {
  this.status = 'Unpaid';
  return this.save();
};

// ✅ Static method to get today's invoices
invoiceSchema.statics.getTodayInvoices = function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    user: userId,
    invoiceDate: {
      $gte: today,
      $lt: tomorrow
    }
  });
};

// ✅ Static method to get dashboard statistics
invoiceSchema.statics.getDashboardStats = function(userId, startDate, endDate) {
  const matchQuery = { user: userId };
  
  if (startDate && endDate) {
    matchQuery.invoiceDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: "$total" },
        paidAmount: {
          $sum: {
            $cond: [{ $eq: ["$status", "Paid"] }, "$total", 0]
          }
        },
        unpaidAmount: {
          $sum: {
            $cond: [{ $eq: ["$status", "Unpaid"] }, "$total", 0]
          }
        },
        totalPaid: {
          $sum: {
            $cond: [{ $eq: ["$status", "Paid"] }, 1, 0]
          }
        },
        totalUnpaid: {
          $sum: {
            $cond: [{ $eq: ["$status", "Unpaid"] }, 1, 0]
          }
        },
        totalPieces: { $sum: "$totalPieces" }
      }
    }
  ]);
};

module.exports = mongoose.model("Invoice", invoiceSchema);