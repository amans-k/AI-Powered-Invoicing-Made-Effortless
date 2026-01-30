import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { Loader2, Edit, Printer, AlertCircle, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import CreateInvoice from './CreateInvoices';
import Button from '../../component/ui/Button';
import ReminderModal from '../../component/Invoices/ReminderModal';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const invoiceRef = useRef();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        console.log("🔍 Fetching invoice ID:", id);
        const response = await axiosInstance.get(API_PATHS.INVOICE.GET_INVOICE_BY_ID(id));
        
        console.log("✅ Invoice fetched:", response.data);
        setInvoice(response.data.data);
        
      } catch (error) {
        console.error("❌ Failed to fetch invoice:", error);
        console.error("Error details:", error.response?.data);
        toast.error('Failed to load invoice.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      console.log("📤 Updating invoice ID:", id);
      console.log("📝 Update data:", formData);
      
      const response = await axiosInstance.put(
        API_PATHS.INVOICE.UPDATE_INVOICE(id), 
        formData
      );
      
      console.log("✅ Update response:", response.data);
      toast.success('Invoice updated successfully!');
      setIsEditing(false);
      
      setInvoice(response.data.data);
      
    } catch (error) {
      console.error("❌ Failed to update invoice:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update invoice.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEditClick = () => {
    console.log("📝 Editing invoice:", invoice);
    console.log("🛒 Invoice items:", invoice?.items);
    setIsEditing(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-lg">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">Invoice Not Found</h3>
        <p className="text-slate-500 mb-6 max-w-md">The invoice you are looking for does not exist or could not be loaded.</p>
        <Button onClick={() => navigate('/invoices')}>Back to All Invoices</Button>
      </div>
    );
  }

  if (isEditing) {
    return <CreateInvoice existingInvoice={invoice} onSave={handleUpdate} />;
  }

  return (
    <>
      <ReminderModal 
        isopen={isReminderModalOpen} 
        onClose={() => setIsReminderModalOpen(false)} 
        invoiceId={id} 
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 print:hidden">
        <h1 className="text-2xl font-semibold text-slate-900 mb-4 sm:mb-0">
          Invoice <span className="font-mono text-slate-500">
            {invoice.invoiceNumber ? invoice.invoiceNumber.replace(/^INV-/, '') : invoice.invoiceNumber}
          </span>
        </h1>
        <div className="flex items-center gap-2 print:hidden">
          <Button 
            variant="secondary" 
            onClick={() => setIsReminderModalOpen(true)} 
            icon={Mail}
          >
            Generate Reminder
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleEditClick} 
            icon={Edit}
          >
            Edit
          </Button>
          <Button 
            variant="primary" 
            onClick={handlePrint} 
            icon={Printer}
          >
            Print or Download
          </Button>
        </div>
      </div>

      <div id="invoice-content-wrapper">
        <div
          ref={invoiceRef}
          id="invoice-preview"
          className="bg-white p-6 sm:p-8 md:p-12 rounded-lg shadow-md border border-slate-200 print:shadow-none print:border-0"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start pb-8 border-b border-slate-200">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">INVOICE</h2>
              <p className="text-sm text-slate-500 mt-2">
                #{invoice.invoiceNumber ? invoice.invoiceNumber.replace(/^INV-/, '') : invoice.invoiceNumber}
              </p>
            </div>
            <div className="text-left sm:text-right mt-4 sm:mt-0 print:text-left">
              <p className="text-sm text-slate-500">Status</p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  invoice.status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800' // CHANGED: Only "Unpaid" shows amber now
                }`}
              >
                {invoice.status === 'Pending' ? 'Unpaid' : invoice.status} {/* CHANGED: Show "Unpaid" for old "Pending" invoices */}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Bill From</h3>
              <p className="font-semibold text-slate-800">Cotton Stock Kid's Wear</p>
              <p className="text-slate-600">Shop no M-1832 (2P) ground floor gandhi bazaar</p>
              <p className="text-slate-600">Chembur colony, chembur 400074</p>
              <p className="text-slate-600">cottonstockkidswear@gmail.com</p>
              <p className="text-slate-600">8591116115</p> {/* Updated phone number */}
            </div>
            <div className="sm:text-right">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Bill To</h3>
              <p className="font-semibold text-slate-800">{invoice.billTo?.clientName}</p>
              <p className="text-slate-600">{invoice.billTo?.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Invoice Date</h3>
              <p className="font-medium text-slate-800">
                {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment Mode</h3>
              <p className="font-medium text-slate-800">{invoice.paymentMode || 'Cash'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Status</h3>
              <p className="font-medium text-slate-800">
                {invoice.status === 'Pending' ? 'Unpaid' : invoice.status} {/* CHANGED: Show "Unpaid" for old "Pending" invoices */}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {invoice.items?.map((item, index) => {
                  return (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-900">{item.name || 'Item'}</td>
                      <td className="px-4 sm:px-6 py-4 text-center text-sm font-medium text-slate-600">{item.quantity || 0}</td>
                      <td className="px-4 sm:px-6 py-4 text-right text-sm font-medium text-slate-600">
                        ₹{item.unitPrice ? parseFloat(item.unitPrice).toFixed(2) : '0.00'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right text-sm font-medium text-slate-900">
                        ₹{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-8">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{invoice.subtotal ? parseFloat(invoice.subtotal).toFixed(2) : '0.00'}</span>
              </div>
              
              {/* Direct Amount Reduction */}
              {(invoice.discountTotal || invoice.directAmountReduction) > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Direct Reduction</span>
                  <span>-₹{(invoice.discountTotal || invoice.directAmountReduction || 0).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-semibold text-lg text-slate-900 border-t border-slate-200 pt-3 mt-3">
                <span>Total</span>
                <span>₹{invoice.total ? parseFloat(invoice.total).toFixed(2) : '0.00'}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-slate-600">{invoice.notes}</p>
            </div>
          )}

          {/* Payment Details Section */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Payment Mode:</p>
                <p className="text-slate-600">{invoice.paymentMode || 'Cash'}</p>
              </div>
              {invoice.paymentReference && (
                <div>
                  <p className="text-sm font-medium text-slate-700">Reference/Transaction ID:</p>
                  <p className="text-slate-600">{invoice.paymentReference}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200 print:hidden text-center text-xs text-slate-400">
            <p>Generated by Invoice Management System</p>
          </div>
        </div>
      </div>
      
      <style>
        {`
          @page {
            margin: 0.5cm;
            padding: 0;
          }

          @media print {
            body * {
              visibility: hidden;
            }
            
            #invoice-content-wrapper, #invoice-content-wrapper * {
              visibility: visible;
            }
            
            #invoice-content-wrapper {
              position: absolute;
              left: 0;
              top: 0;
              right: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            
            #invoice-preview {
              box-shadow: none;
              border: none;
              border-radius: 0;
              padding: 0;
              margin: 0;
            }
            
            .print\\:hidden {
              display: none !important;
            }
            
            .print\\:text-left {
              text-align: left !important;
            }
            
            .bg-slate-50 {
              background-color: transparent !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default InvoiceDetail;