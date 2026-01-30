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

    // dueDate removed as per frontend requirement (not needed)
    
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
        default: "8591116115" // Updated phone number
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

    // CHANGED: Status enum updated to match frontend
    status: {
      type: String,
      enum: ["Unpaid", "Paid"], // Only Unpaid and Paid (removed Pending, Overdue, Cancelled)
      default: "Unpaid", // Default to Unpaid instead of Pending
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
    
    // NEW: Direct amount reduction field
    directAmountReduction: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    
    // Keep for backward compatibility with old data
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
    
    // NEW: Total pieces sold in this invoice
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

// ✅ Index for date-based queries (for dashboard filters)
invoiceSchema.index({ user: 1, invoiceDate: -1 });
invoiceSchema.index({ user: 1, status: 1 });
invoiceSchema.index({ user: 1, paymentMode: 1 });

// ✅ Pre-save middleware to calculate totals and totalPieces
invoiceSchema.pre('save', function(next) {
  // Calculate subtotal and total pieces from items
  this.subtotal = this.items.reduce((sum, item) => {
    // Calculate item total
    const itemTotal = item.quantity * item.unitPrice;
    item.total = itemTotal;
    return sum + itemTotal;
  }, 0);
  
  // Calculate total pieces
  this.totalPieces = this.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Auto-migrate: If invoiceDiscount exists but directAmountReduction is 0
  if (this.invoiceDiscount > 0 && this.directAmountReduction === 0) {
    this.directAmountReduction = this.invoiceDiscount;
  }
  
  // Set discountTotal equal to directAmountReduction
  this.discountTotal = this.directAmountReduction || 0;
  
  // Calculate final total (subtotal minus direct reduction)
  this.total = Math.max(0, this.subtotal - this.directAmountReduction);
  
  // Auto-convert old "Pending" status to "Unpaid"
  if (this.status === "Pending") {
    this.status = "Unpaid";
  }
  
  // If billFrom is empty or partial, set defaults
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

// ✅ Pre-update middleware for findOneAndUpdate operations
invoiceSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  
  // If items are being updated, recalculate totals
  if (update.items || update.$set?.items) {
    const items = update.items || update.$set?.items || [];
    if (items.length > 0) {
      const subtotal = items.reduce((sum, item) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        return sum + itemTotal;
      }, 0);
      
      const totalPieces = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      
      // Set subtotal and totalPieces in update
      if (update.$set) {
        update.$set.subtotal = subtotal;
        update.$set.totalPieces = totalPieces;
      } else {
        update.subtotal = subtotal;
        update.totalPieces = totalPieces;
      }
      
      // Calculate discount total
      const directAmountReduction = update.directAmountReduction || update.$set?.directAmountReduction || 0;
      const discountTotal = directAmountReduction;
      
      if (update.$set) {
        update.$set.discountTotal = discountTotal;
        update.$set.total = Math.max(0, subtotal - discountTotal);
      } else {
        update.discountTotal = discountTotal;
        update.total = Math.max(0, subtotal - discountTotal);
      }
    }
  }
  
  // Auto-convert "Pending" to "Unpaid" if status is being updated
  if (update.status === "Pending" || update.$set?.status === "Pending") {
    if (update.$set) {
      update.$set.status = "Unpaid";
    } else {
      update.status = "Unpaid";
    }
  }
  
  // Auto-migrate old invoiceDiscount to directAmountReduction
  if ((update.invoiceDiscount > 0 && update.directAmountReduction === 0) || 
      (update.$set?.invoiceDiscount > 0 && update.$set?.directAmountReduction === 0)) {
    if (update.$set) {
      update.$set.directAmountReduction = update.$set.invoiceDiscount || update.invoiceDiscount;
    } else {
      update.directAmountReduction = update.invoiceDiscount;
    }
  }
  
  next();
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