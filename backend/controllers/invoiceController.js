const Invoice = require("../models/invoice");

// @desc Create new invoice
// @route POST /api/invoices
// @access Private
exports.createInvoice = async (req, res) => {
  try {
    const user = req.user;

    let {
      invoiceNumber,
      invoiceDate,
      billFrom,
      billTo,
      items,
      notes,
      paymentMode = "Cash",
      status = "Paid", // ✅ Default to "Paid"
      directAmountReduction = 0,
      invoiceDiscount = 0,
    } = req.body;

    console.log("🟢 CREATE INVOICE - Status:", status);

    // Auto-migrate: If invoiceDiscount is provided but not directAmountReduction
    if (invoiceDiscount > 0 && directAmountReduction === 0) {
      directAmountReduction = invoiceDiscount;
    }

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "At least one item is required" 
      });
    }

    // Convert old "Pending" to "Unpaid" for consistency
    if (status === "Pending") {
      status = "Paid";
    }

    // Calculate subtotal and total pieces
    let subtotal = 0;
    let totalPieces = 0;
    items.forEach((item) => {
      const itemTotal = item.unitPrice * item.quantity;
      subtotal += itemTotal;
      totalPieces += item.quantity || 0;
    });

    // Apply direct amount reduction
    const discountTotal = parseFloat(directAmountReduction) || 0;
    const total = Math.max(0, subtotal - discountTotal);

    // Fixed billFrom information
    const fixedBillFrom = {
      businessName: "Cotton Stock Kid's Wear",
      address: "Shop no M-1832 (2P) ground floor gandhi bazaar, Chembur colony, chembur 400074",
      email: "cottonstockkidswear@gmail.com",
      phone: "8591116115"
    };

    // ✅ FIXED: Generate invoice number with proper sorting
    const generateInvoiceNumber = async () => {
      try {
        console.log("🔍 Generating invoice number...");
        
        // Find the highest invoice number by sorting invoiceNumber
        const latestInvoice = await Invoice.findOne()
          .sort({ invoiceNumber: -1 }); // ✅ Sort by invoiceNumber, not createdAt
        
        console.log("📊 Latest invoice found:", latestInvoice?.invoiceNumber);
        
        if (latestInvoice && latestInvoice.invoiceNumber) {
          // Extract number from "INV-1", "INV-2", etc.
          const match = latestInvoice.invoiceNumber.match(/INV-(\d+)/);
          if (match) {
            const lastNum = parseInt(match[1]);
            if (!isNaN(lastNum)) {
              const nextNum = lastNum + 1;
              console.log(`✅ Next invoice number: INV-${nextNum}`);
              return `INV-${nextNum}`;
            }
          }
        }
        
        console.log("📝 No invoices found, starting from INV-1");
        return "INV-1";
        
      } catch (error) {
        console.error("❌ Error generating invoice number:", error);
        return `INV-${Date.now()}`;
      }
    };

    const finalInvoiceNumber = invoiceNumber || await generateInvoiceNumber();
    console.log("🎯 Final invoice number:", finalInvoiceNumber);

    // Prepare items for database
    const formattedItems = items.map(item => ({
      name: item.name || item.description || "Item",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: (item.quantity || 0) * (item.unitPrice || 0)
    }));

    const invoice = new Invoice({
      user: user._id || user.id,
      invoiceNumber: finalInvoiceNumber,
      invoiceDate: invoiceDate || new Date(),
      billFrom: fixedBillFrom,
      billTo: {
        clientName: billTo?.clientName || "",
        phone: billTo?.phone || ""
      },
      items: formattedItems,
      notes,
      paymentMode: paymentMode || "Cash",
      status: status || "Paid", // ✅ Default to "Paid" (not "Unpaid")
      directAmountReduction: directAmountReduction || 0,
      invoiceDiscount: invoiceDiscount || 0,
      subtotal,
      discountTotal,
      total,
      totalPieces,
    });

    console.log("💾 Saving invoice to database...");
    await invoice.save();
    console.log("✅ Invoice saved successfully:", finalInvoiceNumber);

    const invoiceResponse = invoice.toObject();
    invoiceResponse.totalPieces = totalPieces;

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoiceResponse,
    });
  } catch (error) {
    console.error("❌ Create invoice error:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
    
    if (error.code === 11000) {
      console.error("❌ Duplicate invoice number detected!");
      return res.status(400).json({ 
        success: false,
        message: "Invoice number already exists. Please try again." 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error creating invoice", 
      error: error.message 
    });
  }
};

// @desc Get all invoices of logged-in user
// @route GET /api/invoices
// @access Private
exports.getInvoices = async (req, res) => {
  try {
    console.log("🔍 Fetching invoices for user:", req.user.id);
    
    const invoices = await Invoice.find({ user: req.user.id })
      .sort({ invoiceDate: -1, createdAt: -1 });

    console.log(`✅ Found ${invoices.length} invoices for user ${req.user.id}`);

    // Process invoices for backward compatibility
    const processedInvoices = invoices.map(invoice => {
      const invoiceObj = invoice.toObject();
      
      // ✅ FIXED: Convert old "Pending" to "Unpaid" (not "Paid")
      if (invoiceObj.status === "Pending") {
        invoiceObj.status = "Unpaid";
      }
      
      // Migrate old discount field
      if (invoiceObj.invoiceDiscount > 0 && invoiceObj.directAmountReduction === 0) {
        invoiceObj.directAmountReduction = invoiceObj.invoiceDiscount;
      }
      
      // Calculate total pieces if not already calculated
      if (!invoiceObj.totalPieces) {
        invoiceObj.totalPieces = invoiceObj.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      }
      
      return invoiceObj;
    });

    res.json({
      success: true,
      count: invoices.length,
      data: processedInvoices,
    });
  } catch (error) {
    console.error("❌ Get invoices error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching invoices", 
      error: error.message 
    });
  }
};

// @desc Get single invoice by ID
// @route GET /api/invoices/:id
// @access Private
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ 
        success: false,
        message: "Invoice not found" 
      });
    }

    // Check if invoice belongs to the user
    if (invoice.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to access this invoice" 
      });
    }

    // Process for backward compatibility
    const invoiceObj = invoice.toObject();
    
    // Convert old "Pending" to "Unpaid"
    if (invoiceObj.status === "Pending") {
      invoiceObj.status = "Unpaid";
    }
    
    // Migrate old discount field
    if (invoiceObj.invoiceDiscount > 0 && invoiceObj.directAmountReduction === 0) {
      invoiceObj.directAmountReduction = invoiceObj.invoiceDiscount;
    }
    
    // Calculate total pieces if not already calculated
    if (!invoiceObj.totalPieces) {
      invoiceObj.totalPieces = invoiceObj.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }

    res.json({
      success: true,
      data: invoiceObj,
    });
  } catch (error) {
    console.error("❌ Get invoice by ID error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching invoice", 
      error: error.message 
    });
  }
};

// @desc Update invoice
// @route PUT /api/invoices/:id
// @access Private
exports.updateInvoice = async (req, res) => {
  try {
    let {
      invoiceNumber,
      invoiceDate,
      billFrom,
      billTo,
      items,
      notes,
      paymentMode,
      status,
      directAmountReduction = 0,
      invoiceDiscount = 0,
    } = req.body;

    // Convert "Pending" to "Unpaid" if provided
    if (status === "Pending") {
      status = "Unpaid";
    }

    // Auto-migrate: If invoiceDiscount is provided but not directAmountReduction
    if (invoiceDiscount > 0 && directAmountReduction === 0) {
      directAmountReduction = invoiceDiscount;
    }

    // Check if invoice exists and belongs to user
    const existingInvoice = await Invoice.findById(req.params.id);
    if (!existingInvoice) {
      return res.status(404).json({ 
        success: false,
        message: "Invoice not found" 
      });
    }

    if (existingInvoice.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to update this invoice" 
      });
    }

    // Recalculate totals and pieces
    let subtotal = 0;
    let discountTotal = 0;
    let totalPieces = 0;

    if (items && items.length > 0) {
      items.forEach((item) => {
        const itemTotal = item.unitPrice * item.quantity;
        subtotal += itemTotal;
        totalPieces += item.quantity || 0;
      });
      discountTotal = parseFloat(directAmountReduction) || 0;
    } else {
      // Use existing values if items not provided
      subtotal = existingInvoice.subtotal;
      discountTotal = existingInvoice.discountTotal || 0;
      totalPieces = existingInvoice.totalPieces || 0;
    }

    const total = Math.max(0, subtotal - discountTotal);

    // Fixed billFrom information
    const fixedBillFrom = {
      businessName: "Cotton Stock Kid's Wear",
      address: "Shop no M-1832 (2P) ground floor gandhi bazaar, Chembur colony, chembur 400074",
      email: "cottonstockkidswear@gmail.com",
      phone: "8591116115"
    };

    // Prepare items for database
    const formattedItems = items ? items.map(item => ({
      name: item.name || item.description || "Item",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: (item.quantity || 0) * (item.unitPrice || 0)
    })) : existingInvoice.items;

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        invoiceNumber: invoiceNumber || existingInvoice.invoiceNumber,
        invoiceDate: invoiceDate || existingInvoice.invoiceDate,
        billFrom: fixedBillFrom,
        billTo: {
          clientName: billTo?.clientName || existingInvoice.billTo?.clientName || "",
          phone: billTo?.phone || existingInvoice.billTo?.phone || ""
        },
        items: formattedItems,
        notes: notes !== undefined ? notes : existingInvoice.notes,
        paymentMode: paymentMode || existingInvoice.paymentMode || "Cash",
        status: status || existingInvoice.status || "Paid", // ✅ FIXED: Default to "Paid" (not "Unpaid")
        directAmountReduction: directAmountReduction || existingInvoice.directAmountReduction || 0,
        invoiceDiscount: invoiceDiscount || existingInvoice.invoiceDiscount || 0,
        subtotal,
        discountTotal,
        total,
        totalPieces: totalPieces || existingInvoice.totalPieces || 0,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Invoice updated successfully",
      data: updatedInvoice,
    });
  } catch (error) {
    console.error("❌ Update invoice error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating invoice", 
      error: error.message 
    });
  }
};

// @desc Delete invoice
// @route DELETE /api/invoices/:id
// @access Private
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ 
        success: false,
        message: "Invoice not found" 
      });
    }

    // Check if invoice belongs to the user
    if (invoice.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to delete this invoice" 
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete invoice error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting invoice", 
      error: error.message 
    });
  }
};

// @desc Get dashboard statistics
// @route GET /api/invoices/dashboard/stats
// @access Private
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all invoices for the user
    const allInvoices = await Invoice.find({ user: userId });
    
    // Calculate all-time statistics
    let totalInvoices = allInvoices.length;
    let totalAmount = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
    let totalPieces = 0;
    
    allInvoices.forEach(invoice => {
      const invoiceStatus = invoice.status === "Pending" ? "Unpaid" : invoice.status;
      const invoiceAmount = invoice.total || 0;
      
      totalAmount += invoiceAmount;
      
      // Calculate total pieces from items
      const invoicePieces = invoice.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      totalPieces += invoicePieces;
      
      if (invoiceStatus === "Paid") {
        totalPaid++;
        paidAmount += invoiceAmount;
      } else {
        totalUnpaid++;
        unpaidAmount += invoiceAmount;
      }
    });
    
    // Calculate today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayInvoices = allInvoices.filter(invoice => {
      const invoiceDate = new Date(invoice.invoiceDate);
      return invoiceDate >= today && invoiceDate < tomorrow;
    });
    
    let todayInvoicesCount = todayInvoices.length;
    let todayAmount = 0;
    let todayPaid = 0;
    let todayPaidAmount = 0;
    let todayPieces = 0;
    
    todayInvoices.forEach(invoice => {
      const invoiceStatus = invoice.status === "Pending" ? "Unpaid" : invoice.status;
      const invoiceAmount = invoice.total || 0;
      
      todayAmount += invoiceAmount;
      
      // Calculate today's pieces from items
      const invoicePieces = invoice.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      todayPieces += invoicePieces;
      
      if (invoiceStatus === "Paid") {
        todayPaid++;
        todayPaidAmount += invoiceAmount;
      }
    });
    
    // Get recent invoices (last 5)
    const recentInvoices = allInvoices
      .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
      .slice(0, 5)
      .map(invoice => {
        const invoiceObj = invoice.toObject();
        // Convert "Pending" to "Unpaid" for consistency
        if (invoiceObj.status === "Pending") {
          invoiceObj.status = "Unpaid";
        }
        return invoiceObj;
      });
    
    res.json({
      success: true,
      data: {
        stats: {
          totalInvoices,
          totalPaid,
          totalUnpaid,
          totalAmount,
          paidAmount,
          unpaidAmount,
          totalPieces
        },
        todayStats: {
          todayInvoices: todayInvoicesCount,
          todayPaid,
          todayAmount,
          todayPaidAmount,
          todayPieces
        },
        recentInvoices
      }
    });
    
  } catch (error) {
    console.error("❌ Get dashboard stats error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching dashboard statistics", 
      error: error.message 
    });
  }
};

// @desc Get filtered invoices for dashboard
// @route GET /api/invoices/dashboard/filter
// @access Private
exports.getFilteredDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter = 'all', startDate, endDate } = req.query;
    
    let query = { user: userId };
    
    // Apply date filters
    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query.invoiceDate = {
        $gte: today,
        $lt: tomorrow
      };
    } else if (filter === 'week') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      query.invoiceDate = {
        $gte: weekStart
      };
    } else if (filter === 'month') {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      query.invoiceDate = {
        $gte: monthStart
      };
    } else if (filter === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.invoiceDate = {
        $gte: start,
        $lte: end
      };
    }
    
    const filteredInvoices = await Invoice.find(query);
    
    // Calculate filtered statistics
    let totalInvoices = filteredInvoices.length;
    let totalAmount = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
    let totalPieces = 0;
    
    filteredInvoices.forEach(invoice => {
      const invoiceStatus = invoice.status === "Pending" ? "Unpaid" : invoice.status;
      const invoiceAmount = invoice.total || 0;
      
      totalAmount += invoiceAmount;
      
      // Calculate pieces from items
      const invoicePieces = invoice.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      totalPieces += invoicePieces;
      
      if (invoiceStatus === "Paid") {
        totalPaid++;
        paidAmount += invoiceAmount;
      } else {
        totalUnpaid++;
        unpaidAmount += invoiceAmount;
      }
    });
    
    // Get recent filtered invoices (last 5)
    const recentFilteredInvoices = filteredInvoices
      .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
      .slice(0, 5)
      .map(invoice => {
        const invoiceObj = invoice.toObject();
        // Convert "Pending" to "Unpaid" for consistency
        if (invoiceObj.status === "Pending") {
          invoiceObj.status = "Unpaid";
        }
        return invoiceObj;
      });
    
    res.json({
      success: true,
      data: {
        filteredStats: {
          totalInvoices,
          totalPaid,
          totalUnpaid,
          totalAmount,
          paidAmount,
          unpaidAmount,
          totalPieces
        },
        recentInvoices: recentFilteredInvoices
      }
    });
    
  } catch (error) {
    console.error("❌ Get filtered dashboard data error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching filtered dashboard data", 
      error: error.message 
    });
  }
};