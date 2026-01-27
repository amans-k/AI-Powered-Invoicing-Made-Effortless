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
      status = "Pending",
      directAmountReduction = 0,
      invoiceDiscount = 0, // Keep for backward compatibility
    } = req.body;

    // Auto-migrate: If invoiceDiscount is provided but not directAmountReduction
    if (invoiceDiscount > 0 && directAmountReduction === 0) {
      directAmountReduction = invoiceDiscount;
    }

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    // Calculate subtotal
    let subtotal = 0;
    items.forEach((item) => {
      const itemTotal = item.unitPrice * item.quantity;
      subtotal += itemTotal;
    });

    // Apply direct amount reduction (not percentage)
    const discountTotal = parseFloat(directAmountReduction) || 0;
    const total = Math.max(0, subtotal - discountTotal);

    // Fixed billFrom information with updated phone
    const fixedBillFrom = {
      businessName: "Cotton Stock Kids Wear",
      address: "Shop no M-1832 (2P) ground floor gandhi bazaar, Chembur colony, chembur 400074",
      email: "cottonstockkidswear@gmail.com",
      phone: "8591116115" // Updated phone number
    };

    // Generate invoice number with midnight reset
    const generateInvoiceNumber = async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      // Find today's last invoice (after midnight)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0); // Reset at midnight
      
      // Find latest invoice from today
      const latestInvoice = await Invoice.findOne({
        createdAt: { $gte: todayStart },
        invoiceNumber: { $regex: `^INV-${year}${month}${day}-` }
      }).sort({ invoiceNumber: -1 });

      if (latestInvoice) {
        const lastNum = parseInt(latestInvoice.invoiceNumber.split('-').pop());
        return `INV-${year}${month}${day}-${String(lastNum + 1).padStart(3, '0')}`;
      }
      return `INV-${year}${month}${day}-001`;
    };

    const finalInvoiceNumber = invoiceNumber || await generateInvoiceNumber();

    // Prepare items for database (with total calculation)
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
      billFrom: fixedBillFrom, // Use fixed billFrom
      billTo: {
        clientName: billTo?.clientName || "",
        phone: billTo?.phone || ""
      },
      items: formattedItems,
      notes,
      paymentMode: paymentMode || "Cash",
      status: status || "Pending",
      directAmountReduction: directAmountReduction || 0,
      invoiceDiscount: invoiceDiscount || 0, // Keep for backward compatibility
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

    // For backward compatibility: If directAmountReduction is 0 but invoiceDiscount exists, use it
    const processedInvoices = invoices.map(invoice => {
      const invoiceObj = invoice.toObject();
      
      // If old invoice has invoiceDiscount but not directAmountReduction
      if (invoiceObj.invoiceDiscount > 0 && invoiceObj.directAmountReduction === 0) {
        invoiceObj.directAmountReduction = invoiceObj.invoiceDiscount;
      }
      
      return invoiceObj;
    });

    res.json({
      success: true,
      count: invoices.length,
      data: processedInvoices,
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

    // For backward compatibility
    const invoiceObj = invoice.toObject();
    if (invoiceObj.invoiceDiscount > 0 && invoiceObj.directAmountReduction === 0) {
      invoiceObj.directAmountReduction = invoiceObj.invoiceDiscount;
    }

    res.json({
      success: true,
      data: invoiceObj,
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
      invoiceDiscount = 0, // Keep for backward compatibility
    } = req.body;

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

    // Recalculate totals
    let subtotal = 0;
    let discountTotal = 0;

    if (items && items.length > 0) {
      items.forEach((item) => {
        const itemTotal = item.unitPrice * item.quantity;
        subtotal += itemTotal;
      });
      discountTotal = parseFloat(directAmountReduction) || 0;
    } else {
      // Use existing values if items not provided
      subtotal = existingInvoice.subtotal;
      discountTotal = existingInvoice.discountTotal || 0;
    }

    const total = Math.max(0, subtotal - discountTotal);

    // Fixed billFrom information with updated phone
    const fixedBillFrom = {
      businessName: "Cotton Stock Kids Wear",
      address: "Shop no M-1832 (2P) ground floor gandhi bazaar, Chembur colony, chembur 400074",
      email: "cottonstockkidswear@gmail.com",
      phone: "8591116115" // Updated phone number
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
        billFrom: fixedBillFrom, // Always use fixed billFrom
        billTo: {
          clientName: billTo?.clientName || existingInvoice.billTo?.clientName || "",
          phone: billTo?.phone || existingInvoice.billTo?.phone || ""
        },
        items: formattedItems,
        notes: notes !== undefined ? notes : existingInvoice.notes,
        paymentMode: paymentMode || existingInvoice.paymentMode || "Cash",
        status: status || existingInvoice.status,
        directAmountReduction: directAmountReduction || existingInvoice.directAmountReduction || 0,
        invoiceDiscount: invoiceDiscount || existingInvoice.invoiceDiscount || 0, // Keep
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