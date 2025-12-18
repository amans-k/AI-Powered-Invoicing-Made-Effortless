import React, { useState, useEffect } from 'react';
import { Loader2, Mail, Copy, Check, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import TextareaField from '../ui/TextareaField';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';

const ReminderModal = ({ isopen, onClose, invoiceId }) => {
  const [reminderText, setReminderText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    if (isopen && invoiceId) {
      fetchInvoiceAndGenerateReminder();
    }
  }, [isopen, invoiceId]);

  const fetchInvoiceAndGenerateReminder = async () => {
    setIsLoading(true);
    setApiError(false);
    
    try {
      console.log('Fetching invoice details for ID:', invoiceId);
      
      // 1. First, try to get the invoice details
      const invoiceResponse = await axiosInstance.get(
        API_PATHS.INVOICE.GET_INVOICE_BY_ID(invoiceId)
      );
      
      const invoice = invoiceResponse.data;
      setInvoiceData(invoice);
      console.log('Invoice fetched successfully:', invoice);
      
      // 2. Generate reminder text locally (since AI endpoint might not work)
      const generatedReminder = generateReminderText(invoice);
      setReminderText(generatedReminder);
      
      // 3. OPTIONAL: Try AI endpoint if you want (but it's giving 500)
      // try {
      //   const aiResponse = await axiosInstance.post(
      //     API_PATHS.AI.GENERATE_REMINDER, 
      //     { invoiceId }
      //   );
      //   if (aiResponse.data?.reminderText) {
      //     setReminderText(aiResponse.data.reminderText);
      //   }
      // } catch (aiError) {
      //   console.log('AI endpoint failed, using local generation');
      // }
      
    } catch (error) {
      console.error('Error fetching invoice:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      setApiError(true);
      
      // Generate a basic reminder even without invoice data
      const fallbackReminder = `Dear Client,

This is a reminder regarding your outstanding invoice.

Invoice Reference: ${invoiceId}

Please review your account and arrange for payment at your earliest convenience.

If you have already made this payment, please disregard this message.

For any questions, please contact our billing department.

Best regards,
Your Billing Team`;
      
      setReminderText(fallbackReminder);
      toast.error('Could not fetch invoice details. Using template reminder.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateReminderText = (invoice) => {
    if (!invoice) return '';
    
    const clientName = invoice.billTo?.clientName || 'Valued Client';
    const businessName = invoice.billFrom?.businessName || 'Your Company';
    const invoiceNumber = invoice.invoiceNumber || `INV-${invoice._id?.slice(-6) || '0000'}`;
    const amount = invoice.total ? `$${parseFloat(invoice.total).toFixed(2)}` : '$0.00';
    
    // Format due date
    let dueDateText = 'the due date';
    if (invoice.dueDate) {
      try {
        const dueDate = new Date(invoice.dueDate);
        dueDateText = dueDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {
        dueDateText = invoice.dueDate;
      }
    }
    
    // Calculate if overdue
    let overdueText = '';
    if (invoice.dueDate) {
      const due = new Date(invoice.dueDate);
      const today = new Date();
      if (today > due) {
        const diffTime = today - due;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        overdueText = `\n\nNote: This invoice is ${diffDays} day${diffDays !== 1 ? 's' : ''} overdue.`;
      }
    }
    
    return `Dear ${clientName},

FRIENDLY PAYMENT REMINDER

This is regarding your invoice ${invoiceNumber} for the amount of ${amount}.

Invoice Details:
• Invoice Number: ${invoiceNumber}
• Amount Due: ${amount}
• Due Date: ${dueDateText}
${invoice.items?.length > 0 ? `• Services: ${invoice.items.map(item => item.name).join(', ')}` : ''}

The payment was due on ${dueDateText}. Please process the payment at your earliest convenience to avoid any late fees or service interruptions.

Payment Options Available:
1. Bank Transfer
2. Credit/Debit Card
3. Online Payment Portal

If payment has already been made, please disregard this reminder and accept our thanks for your prompt attention.${overdueText}

Should you require any assistance or have questions about this invoice, please don't hesitate to contact us.

We appreciate your business and look forward to serving you again.

Sincerely,

${businessName}
${invoice.billFrom?.email || 'billing@example.com'}
${invoice.billFrom?.phone ? `Phone: ${invoice.billFrom.phone}` : ''}`;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(reminderText);
    setHasCopied(true);
    toast.success('Reminder copied to clipboard!');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleRetry = () => {
    if (invoiceId) {
      fetchInvoiceAndGenerateReminder();
    }
  };

  if (!isopen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        <div
          className="fixed inset-0 bg-black/10 bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative text-left transform transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-900" />
                Invoice Payment Reminder
              </h3>
              {invoiceData && (
                <p className="text-sm text-slate-600 mt-1">
                  For Invoice: <span className="font-medium">{invoiceData.invoiceNumber}</span>
                  {invoiceData.billTo?.clientName && (
                    <> • Client: <span className="font-medium">{invoiceData.billTo.clientName}</span></>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl"
            >
              &times;
            </button>
          </div>

          {apiError && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 font-medium mb-1">
                    Note: Could not fetch detailed invoice information
                  </p>
                  <p className="text-xs text-amber-700">
                    Using template reminder. You can edit the text below.
                  </p>
                  <button
                    onClick={handleRetry}
                    className="mt-2 text-xs text-amber-800 hover:text-amber-900 font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-48">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
              <p className="text-slate-600">Loading invoice details...</p>
              <p className="text-sm text-slate-500 mt-1">Generating reminder message</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-600">
                  Edit the reminder message below before sending to your client:
                </p>
                {invoiceData && (
                  <Button 
                    size="small" 
                    variant="outline" 
                    onClick={() => {
                      const newReminder = generateReminderText(invoiceData);
                      setReminderText(newReminder);
                      toast.success('Reminder regenerated!');
                    }}
                  >
                    Regenerate
                  </Button>
                )}
              </div>
              
              <TextareaField
                name="reminderText"
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
                rows={12}
                className="font-sans text-sm"
                placeholder="Reminder message will appear here..."
              />
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div>
                  {reminderText && (
                    <span>
                      {reminderText.length} characters • {reminderText.split(/\s+/).length} words
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                    Edit text as needed
                  </span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Copy to email
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6 pt-5 border-t border-slate-200">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCopyToClipboard} 
              icon={hasCopied ? Check : Copy} 
              disabled={isLoading || !reminderText}
              variant="primary"
            >
              {hasCopied ? 'Copied!' : 'Copy Reminder'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;