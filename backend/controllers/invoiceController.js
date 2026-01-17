const Invoice = require("../models/invoice");

// @desc Create new invoice
// @route POST /api/invoices
// @access Private
exports.createInvoice = async (req, res) => {
  try {
    const user = req.user;

    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      billFrom,
      billTo,
      items,
      notes,
      paymentTerms,
      paymentMode = "Cash", // New: default payment mode
      status = "Pending",
      invoiceDiscount = 0,
    } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    // Calculate totals with discount
    let subtotal = 0;
    let itemDiscountTotal = 0;
    let discountTotal = 0;

    items.forEach((item) => {
      const itemTotal = item.unitPrice * item.quantity;
      subtotal += itemTotal;
      
      // Calculate item-level discount
      const itemDiscount = itemTotal * ((item.discountPercent || 0) / 100);
      itemDiscountTotal += itemDiscount;
    });

    // Calculate invoice-level discount (on subtotal after item discounts)
    const discountedSubtotal = subtotal - itemDiscountTotal;
    const invoiceDiscountAmount = discountedSubtotal * ((invoiceDiscount || 0) / 100);
    discountTotal = itemDiscountTotal + invoiceDiscountAmount;
    
    const total = subtotal - discountTotal;

    const invoice = new Invoice({
      user: user._id || user.id,
      invoiceNumber,
      invoiceDate: invoiceDate || new Date(),
      dueDate,
      billFrom,
      billTo,
      items: items.map(item => ({
        ...item,
        taxPercent: item.discountPercent || 0, // For backward compatibility
        discountPercent: item.discountPercent || 0
      })),
      notes,
      paymentTerms: paymentTerms || "Net 15",
      paymentMode: paymentMode || "Cash", // Include payment mode
      status: status || "Pending",
      invoiceDiscount: invoiceDiscount || 0,
      subtotal,
      discountTotal,
      total,
    });

    await invoice.save();

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Create invoice error:", error);
    
    // Handle duplicate invoice number
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: "Invoice number already exists" 
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
    console.log("Fetching invoices for user:", req.user.id);
    
    const invoices = await Invoice.find({ user: req.user.id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    console.log(`Found ${invoices.length} invoices for user ${req.user.id}`);

    res.json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error("Get invoices error:", error);
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
    const invoice = await Invoice.findById(req.params.id)
      .populate("user", "name email");
    
    if (!invoice) {
      return res.status(404).json({ 
        success: false,
        message: "Invoice not found" 
      });
    }

    // Check if invoice belongs to the user
    if (invoice.user._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to access this invoice" 
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Get invoice by ID error:", error);
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
    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      billFrom,
      billTo,
      items,
      notes,
      paymentTerms,
      paymentMode,
      status,
      invoiceDiscount = 0,
    } = req.body;

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

    // Recalculate totals with discount
    let subtotal = 0;
    let itemDiscountTotal = 0;
    let discountTotal = 0;

    if (items && items.length > 0) {
      items.forEach((item) => {
        const itemTotal = item.unitPrice * item.quantity;
        subtotal += itemTotal;
        
        // Calculate item-level discount
        const itemDiscount = itemTotal * ((item.discountPercent || 0) / 100);
        itemDiscountTotal += itemDiscount;
      });
      
      // Calculate invoice-level discount
      const discountedSubtotal = subtotal - itemDiscountTotal;
      const invoiceDiscountAmount = discountedSubtotal * ((invoiceDiscount || 0) / 100);
      discountTotal = itemDiscountTotal + invoiceDiscountAmount;
    } else {
      // Use existing values if items not provided
      subtotal = existingInvoice.subtotal;
      discountTotal = existingInvoice.discountTotal || 0;
    }

    const total = subtotal - discountTotal;

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        invoiceNumber: invoiceNumber || existingInvoice.invoiceNumber,
        invoiceDate: invoiceDate || existingInvoice.invoiceDate,
        dueDate: dueDate || existingInvoice.dueDate,
        billFrom: billFrom || existingInvoice.billFrom,
        billTo: billTo || existingInvoice.billTo,
        items: items ? items.map(item => ({
          ...item,
          taxPercent: item.discountPercent || 0, // For backward compatibility
          discountPercent: item.discountPercent || 0
        })) : existingInvoice.items,
        notes: notes !== undefined ? notes : existingInvoice.notes,
        paymentTerms: paymentTerms || existingInvoice.paymentTerms,
        paymentMode: paymentMode || existingInvoice.paymentMode || "Cash", // Include payment mode
        status: status || existingInvoice.status,
        invoiceDiscount: invoiceDiscount || existingInvoice.invoiceDiscount || 0,
        subtotal,
        discountTotal,
        total,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Invoice updated successfully",
      data: updatedInvoice,
    });
  } catch (error) {
    console.error("Update invoice error:", error);
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
    console.error("Delete invoice error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting invoice", 
      error: error.message 
    });
  }
};