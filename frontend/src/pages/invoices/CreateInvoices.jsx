/* eslint-disable */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { Plus, Trash2, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";
import { useAuth } from "../../context/AuthContext";

import InputField from "../../component/ui/inputField";
import TextareaField from "../../component/ui/TextareaField";
import SelectField from "../../component/ui/SelectField";
import Button from "../../component/ui/Button";

const CreateInvoice = ({ existingInvoice, onSave }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Fixed business information with updated phone
  const fixedBusinessInfo = {
    businessName: "Cotton Stock Kids Wear",
    email: "cottonstockkidswear@gmail.com",
    phone: "8591116115", // Updated phone number
    address: "Shop no M-1832 (2P) ground floor gandhi bazaar Chembur colony , chembur 400074"
  };

  // Predefined items for dropdown
  const predefinedItems = [
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
  ];

  // Initial form state with current date
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceDate: moment().format("YYYY-MM-DD"), // Default current date
    dueDate: "", // Removed due date requirement
    billFrom: {
      businessName: fixedBusinessInfo.businessName,
      email: fixedBusinessInfo.email,
      address: fixedBusinessInfo.address,
      phone: fixedBusinessInfo.phone,
    },
    billTo: {
      clientName: "", // Only client name
      phone: "", // Only client phone
    },
    items: [{ name: "Boys T-shirt", quantity: 1, unitPrice: 0 }],
    notes: "",
    paymentMode: "Cash",
    status: "Pending",
    directAmountReduction: 0, // Changed from invoiceDiscount
  });

  const [loading, setLoading] = useState(false);
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  const [isManualDate, setIsManualDate] = useState(false); // Track if user manually changed date

  // Auto-update date only if user hasn't manually changed it
  useEffect(() => {
    if (!existingInvoice && !isManualDate) {
      const currentDate = moment().format("YYYY-MM-DD");
      if (formData.invoiceDate !== currentDate) {
        console.log("Auto-updating invoice date to:", currentDate);
        setFormData(prev => ({
          ...prev,
          invoiceDate: currentDate
        }));
      }
    }
  }, [existingInvoice, isManualDate]);

  // Check date change every minute (only if not manual)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!existingInvoice && !isManualDate) {
        const currentDate = moment().format("YYYY-MM-DD");
        if (formData.invoiceDate !== currentDate) {
          console.log("Midnight auto-update detected:", currentDate);
          setFormData(prev => ({
            ...prev,
            invoiceDate: currentDate
          }));
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [formData.invoiceDate, existingInvoice, isManualDate]);

  useEffect(() => {
    const generateInvoiceNumber = async () => {
      setIsGeneratingNumber(true);
      try {
        const response = await axiosInstance.get(API_PATHS.INVOICE.GET_ALL_INVOICES);
        
        const invoices = response.data?.data || [];
        let maxNum = 0;

        invoices.forEach((inv) => {
          // Extract number from INV-1, INV-2, etc.
          const match = inv.invoiceNumber?.match(/INV-(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        });

        const newInvoiceNumber = `INV-${maxNum + 1}`;
        
        setFormData((prev) => ({
          ...prev,
          invoiceNumber: newInvoiceNumber,
        }));
      } catch (error) {
        console.error("Error generating invoice number:", error);
        setFormData((prev) => ({
          ...prev,
          invoiceNumber: "INV-1",
        }));
      } finally {
        setIsGeneratingNumber(false);
      }
    };

    if (existingInvoice) {
      const formattedItems = existingInvoice.items && Array.isArray(existingInvoice.items) 
        ? existingInvoice.items.map(item => ({
            name: item.name || "Boys T-shirt",
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
          }))
        : [{ name: "Boys T-shirt", quantity: 1, unitPrice: 0 }];

      setFormData({
        ...existingInvoice,
        invoiceNumber: existingInvoice.invoiceNumber || "",
        invoiceDate: existingInvoice.invoiceDate 
          ? moment(existingInvoice.invoiceDate).format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD"),
        dueDate: "",
        billFrom: {
          businessName: fixedBusinessInfo.businessName,
          email: fixedBusinessInfo.email,
          address: fixedBusinessInfo.address,
          phone: fixedBusinessInfo.phone,
        },
        billTo: {
          clientName: existingInvoice.billTo?.clientName || "",
          phone: existingInvoice.billTo?.phone || "",
        },
        items: formattedItems,
        directAmountReduction: existingInvoice.directAmountReduction || 0,
        paymentMode: existingInvoice.paymentMode || "Cash",
        notes: existingInvoice.notes || "",
        status: existingInvoice.status || "Pending",
      });
      setIsManualDate(true); // Existing invoices have fixed dates
    } else {
      // Generate sequential invoice number
      generateInvoiceNumber();
    }
  }, [existingInvoice, user]);

  useEffect(() => {
    const aiData = location.state?.aiData;
    if (aiData) {
      setFormData((prev) => ({
        ...prev,
        billTo: {
          clientName: aiData.clientName || "",
          phone: aiData.phone || "",
        },
        items: aiData.items && Array.isArray(aiData.items) 
          ? aiData.items.map(item => ({
              name: item.name || "Boys T-shirt",
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
            }))
          : prev.items,
      }));
    }
  }, [location.state]);

  const handleInputChange = (e, section, index) => {
    const { name, value } = e.target;
    
    // All billFrom fields are read-only now
    if (section === "billFrom") {
      return;
    }
    
    if (section) {
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [name]: value }
      }));
    } else if (index !== undefined) {
      const newItems = [...(formData.items || [])];
      newItems[index] = { ...newItems[index], [name]: value };
      setFormData((prev) => ({ ...prev, items: newItems }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      
      // If user manually changes date, mark it as manual
      if (name === "invoiceDate") {
        setIsManualDate(true);
        console.log("User manually changed date to:", value);
      }
    }
  };

  // Reset to current date button handler
  const handleResetToCurrentDate = () => {
    const currentDate = moment().format("YYYY-MM-DD");
    setFormData(prev => ({
      ...prev,
      invoiceDate: currentDate
    }));
    setIsManualDate(false); // Reset to auto-update mode
    toast.success(`Date reset to today: ${moment().format("DD MMM YYYY")}`);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...(formData.items || []),
        { name: "Boys T-shirt", quantity: 1, unitPrice: 0 },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = (formData.items || []).filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  // Calculate totals with direct amount reduction
  const calculateTotals = () => {
    let subtotal = 0;

    if (formData.items && Array.isArray(formData.items)) {
      formData.items.forEach((item) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        subtotal += itemTotal;
      });
    }

    const directReduction = parseFloat(formData.directAmountReduction) || 0;
    const finalTotal = Math.max(0, subtotal - directReduction);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      directAmountReduction: Number(directReduction.toFixed(2)),
      finalTotal: Number(finalTotal.toFixed(2))
    };
  };

  const totals = calculateTotals();

  const handleItemChange = (e, index) => {
    const { name, value } = e.target;
    const newItems = [...(formData.items || [])];
    
    const processedValue = ['quantity', 'unitPrice'].includes(name)
      ? parseFloat(value) || 0
      : value;

    newItems[index] = {
      ...newItems[index],
      [name]: processedValue
    };
    
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validItems = (formData.items || []).filter(item => 
        item.name && item.name.trim() !== ""
      );
      
      if (validItems.length === 0) {
        toast.error("Please add at least one item");
        setLoading(false);
        return;
      }

      const itemsForSubmission = validItems.map(item => {
        return {
          name: item.name || "Boys T-shirt",
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
        };
      });

      const finalTotals = calculateTotals();

      const finalFormData = {
        invoiceNumber: formData.invoiceNumber || "",
        invoiceDate: formData.invoiceDate || moment().format("YYYY-MM-DD"), // Send selected date to backend
        dueDate: formData.dueDate || "",
        billFrom: {
          businessName: fixedBusinessInfo.businessName,
          email: fixedBusinessInfo.email,
          address: fixedBusinessInfo.address,
          phone: fixedBusinessInfo.phone,
        },
        billTo: {
          clientName: formData.billTo?.clientName || "",
          phone: formData.billTo?.phone || ""
        },
        items: itemsForSubmission,
        directAmountReduction: Number(formData.directAmountReduction) || 0,
        paymentMode: formData.paymentMode || "Cash",
        notes: formData.notes || "",
        status: formData.status || "Pending",
        subtotal: finalTotals.subtotal,
        discountTotal: finalTotals.directAmountReduction,
        total: finalTotals.finalTotal
      };

      if (onSave) {
        await onSave(finalFormData);
      } else {
        const response = await axiosInstance.post(API_PATHS.INVOICE.CREATE, finalFormData);
        toast.success("Invoice created successfully");
        navigate("/invoices");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to save invoice";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-[100vh]">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900">
          {existingInvoice ? "Edit Invoice" : "Create Invoice"}
        </h2>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            Today: {moment().format("DD MMM YYYY")}
          </span>
          <Button type="submit" isLoading={loading || isGeneratingNumber}>
            {existingInvoice ? "Save Changes" : "Save Invoice"}
          </Button>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-white p-6 rounded-lg shadow-sm shadow-gray-100 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Invoice Number"
            name="invoiceNumber"
            readOnly
            value={formData.invoiceNumber || ""}
            placeholder={isGeneratingNumber ? "Generating..." : ""}
            disabled
          />

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Invoice Date
              </label>
              {isManualDate && (
                <button
                  type="button"
                  onClick={handleResetToCurrentDate}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Calendar className="w-3 h-3" />
                  Reset to Today
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                name="invoiceDate"
                value={formData.invoiceDate || ""}
                onChange={(e) => handleInputChange(e)}
                className="w-full h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                max={moment().format("YYYY-MM-DD")} // Can't select future dates
              />
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-slate-500 mt-1">
                {isManualDate ? 
                  `Manual date selected (${moment(formData.invoiceDate).format("DD MMM YYYY")})` : 
                  "Auto-updates daily at 12AM"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Max: {moment().format("DD MMM YYYY")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bill From & Bill To */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm shadow-gray-100 border border-slate-200 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Bill From</h3>

          <InputField
            label="Business Name"
            name="businessName"
            value={fixedBusinessInfo.businessName}
            readOnly
            disabled
            className="bg-slate-50 cursor-not-allowed"
          />

          <InputField
            label="Address"
            name="address"
            value={fixedBusinessInfo.address}
            readOnly
            disabled
            className="bg-slate-50 cursor-not-allowed"
          />

          <InputField
            label="Email"
            name="email"
            type="email"
            value={fixedBusinessInfo.email}
            readOnly
            disabled
            className="bg-slate-50 cursor-not-allowed"
          />

          <InputField
            label="Phone"
            name="phone"
            value={fixedBusinessInfo.phone}
            readOnly
            disabled
            className="bg-slate-50 cursor-not-allowed"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm shadow-gray-100 border border-slate-200 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Bill To</h3>

          <InputField
            label="Client Name"
            name="clientName"
            value={formData.billTo?.clientName || ""}
            onChange={(e) => handleInputChange(e, "billTo")}
            placeholder="Enter client name"
            required
          />

          <InputField
            label="Client Phone"
            name="phone"
            value={formData.billTo?.phone || ""}
            onChange={(e) => handleInputChange(e, "billTo")}
            placeholder="Enter client phone number"
            required
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm shadow-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-900">Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-2 sm:px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {(formData.items || []).map((item, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-2 sm:px-6 py-4">
                    <select
                      name="name"
                      value={item.name || "Boys T-shirt"}
                      onChange={(e) => handleItemChange(e, index)}
                      className="w-full h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {predefinedItems.map((itemName) => (
                        <option key={itemName} value={itemName}>
                          {itemName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 sm:px-6 py-4">
                    <input 
                      type="number" 
                      name="quantity" 
                      value={item.quantity || ""} 
                      onChange={(e) => handleItemChange(e, index)} 
                      className="w-full h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="1" 
                      min="1"
                      step="1"
                      required
                    />
                  </td>
                  <td className="px-2 sm:px-6 py-4">
                    <input 
                      type="number" 
                      name="unitPrice" 
                      value={item.unitPrice || ""} 
                      onChange={(e) => handleItemChange(e, index)} 
                      className="w-full h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="0.00" 
                      min="0"
                      step="0.01"
                      required
                    />
                  </td>
                  <td className="px-2 sm:px-6 py-4 text-sm text-slate-500 font-medium">
                    ₹{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                  </td>
                  <td className="px-2 sm:px-6 py-4">
                    {formData.items.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 sm:p-6 border-t border-slate-200">
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 text-slate-700 hover:text-slate-900"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Notes & Totals & Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm shadow-gray-100 border border-slate-200 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Notes & Payment</h3>
          <TextareaField
            name="notes"
            label="Notes"
            value={formData.notes || ""}
            onChange={handleInputChange}
            rows={3}
            placeholder="Add any additional notes here..."
          />
          
          {/* Direct Amount Reduction */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Direct Amount Reduction (₹)
            </label>
            <input
              type="number"
              name="directAmountReduction"
              value={formData.directAmountReduction || ""}
              onChange={handleInputChange}
              className="w-full h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-slate-500 mt-1">Enter amount to subtract directly from subtotal</p>
          </div>

          <SelectField
            label="Payment Mode"
            name="paymentMode"
            value={formData.paymentMode || "Cash"}
            onChange={handleInputChange}
            options={["Cash", "Online", "Cheque", "Card", "UPI", "Bank Transfer"]}
            required
          />

          <SelectField
            label="Status"
            name="status"
            value={formData.status || ""}
            onChange={handleInputChange}
            options={["Pending", "Paid", "Overdue", "Cancelled"]}
            required
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm shadow-gray-100 border border-slate-200 flex flex-col justify-center">
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-slate-600">
              <p>Subtotal:</p>
              <p className="font-medium">₹{totals.subtotal.toFixed(2)}</p>
            </div>
            
            {formData.directAmountReduction > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <p>Direct Reduction:</p>
                <p className="font-medium">-₹{totals.directAmountReduction.toFixed(2)}</p>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-semibold text-slate-800 border-t border-slate-200 pt-3 mt-2">
              <p>Final Total:</p>
              <p>₹{totals.finalTotal.toFixed(2)}</p>
            </div>

            {/* Date Info */}
            <div className="pt-4 mt-4 border-t border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Invoice Date:</span>
                <span className="text-sm font-semibold text-slate-900">
                  {moment(formData.invoiceDate).format("DD MMM YYYY")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Payment Mode:</span>
                <span className="text-sm font-semibold text-slate-900">{formData.paymentMode || "Cash"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreateInvoice;