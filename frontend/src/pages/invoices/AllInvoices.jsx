import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { Loader2, Trash2, Edit, Search, FileText, Plus, AlertCircle, Sparkles, Mail } from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import Button from "../../component/ui/Button";
import CreateWithAIModal from "../../component/Invoices/CreateWithAIModal";
import ReminderModal from "../../component/Invoices/ReminderModal"; // ADDED IMPORT

const AllInvoices = () => {
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false); // ADDED STATE
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null); // ADDED STATE
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        console.log("Fetching invoices from:", API_PATHS.INVOICE.GET_ALL_INVOICES);
        const response = await axiosInstance.get(API_PATHS.INVOICE.GET_ALL_INVOICES);
        
        // Debug: Log the entire response to see structure
        console.log("Full API Response:", response);
        console.log("Response data:", response.data);
        console.log("Type of response.data:", typeof response.data);
        console.log("Is array?", Array.isArray(response.data));
        
        // Handle different response structures
        let invoicesData = [];
        
        if (response.data) {
          // Case 1: Direct array
          if (Array.isArray(response.data)) {
            invoicesData = response.data;
          }
          // Case 2: Array inside a property (like data.invoices)
          else if (response.data.invoices && Array.isArray(response.data.invoices)) {
            invoicesData = response.data.invoices;
          }
          // Case 3: Array inside data property (like data.data)
          else if (response.data.data && Array.isArray(response.data.data)) {
            invoicesData = response.data.data;
          }
          // Case 4: Object with values that might be array
          else if (typeof response.data === 'object') {
            // Try to find any array property
            const arrayKeys = Object.keys(response.data).filter(key => Array.isArray(response.data[key]));
            if (arrayKeys.length > 0) {
              invoicesData = response.data[arrayKeys[0]];
              console.log(`Found array in property: ${arrayKeys[0]}`);
            }
          }
        }
        
        console.log("Extracted invoices data:", invoicesData);
        
        if (invoicesData.length > 0) {
          const sortedInvoices = invoicesData.sort(
            (a, b) => new Date(b.invoiceDate || b.createdAt || 0) - new Date(a.invoiceDate || a.createdAt || 0)
          );
          setInvoices(sortedInvoices);
        } else {
          console.warn('No invoices data found in response:', response.data);
          setInvoices([]);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setError('Failed to fetch invoices. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await axiosInstance.delete(API_PATHS.INVOICE.DELETE_INVOICE(id));
        setInvoices(invoices.filter(invoice => invoice._id !== id));
      } catch (err) {
        setError('Failed to delete invoice.');
        console.error(err);
      }
    }
  };

  const handleStatusChange = async (invoice) => {
    try {
      setStatusChangeLoading(invoice._id);
      const newstatus = invoice.status === 'Paid' ? 'Unpaid' : 'Paid';
      const updatedInvoice = { ...invoice, status: newstatus };
      const response = await axiosInstance.put(API_PATHS.INVOICE.UPDATE_INVOICE(invoice._id), updatedInvoice);
      setInvoices(invoices.map(inv => inv._id === invoice._id ? response.data : inv));
    } catch (error) {
      setError('Failed to update invoice status.');
      console.error(error);
    } finally {
      setStatusChangeLoading(null);
    }
  };

  const handleOpenReminderModal = (invoiceId) => {
    setSelectedInvoiceId(invoiceId); // SET SELECTED INVOICE ID
    setIsReminderModalOpen(true); // OPEN REMINDER MODAL
  };

  const handleCreateWithAI = () => {
    setIsModelOpen(true);
  };

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(invoice => statusFilter === 'All' || invoice.status === statusFilter)
      .filter(invoice => {
        const invoiceNumber = invoice.invoiceNumber || '';
        const clientName = invoice.billTo?.clientName || '';
        
        return (
          invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clientName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
  }, [invoices, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">All Invoices</h1>
          <p className="text-sm text-slate-600 mt-1">Manage all your invoices in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleCreateWithAI} icon={Sparkles}>
            Create with AI
          </Button>
          <Button onClick={() => navigate('/invoices/new')} icon={Plus}>
            Create Invoice
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by invoice # or client..."
                className="w-full h-10 pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="shrink-0">
              <select
                className="w-full sm:w-auto h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No invoices found</h3>
            <p className="text-slate-500 mb-6 max-w-md">
              {invoices.length === 0 
                ? "You haven't created any invoices yet." 
                : "Your search or filter criteria did not match any invoices. Please try adjusting your search."}
            </p>
            {invoices.length === 0 && (
              <Button onClick={() => navigate('/invoices/new')} icon={Plus}>
                Create First Invoice
              </Button>
            )}
          </div>
        ) : (
          <div className="w-[90vw] md:w-auto overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice._id || invoice.id} className="hover:bg-slate-50">
                    <td
                      onClick={() => navigate(`/invoices/${invoice._id || invoice.id}`)}
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 cursor-pointer"
                    >
                      {invoice.invoiceNumber || `INV-${(invoice._id || invoice.id).slice(-6)}`}
                    </td>
                    <td
                      onClick={() => navigate(`/invoices/${invoice._id || invoice.id}`)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 cursor-pointer"
                    >
                      {invoice.billTo?.clientName || invoice.clientName || "No Client"}
                    </td>
                    <td
                      onClick={() => navigate(`/invoices/${invoice._id || invoice.id}`)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 cursor-pointer"
                    >
                      ₹{(invoice.total || invoice.amount || 0).toFixed(2)}
                    </td>
                    <td
                      onClick={() => navigate(`/invoices/${invoice._id || invoice.id}`)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 cursor-pointer"
                    >
                      {invoice.dueDate ? moment(invoice.dueDate).format('MM/DD/YYYY') : 'No due date'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : invoice.status === 'Unpaid'
                            ? 'bg-rose-100 text-rose-800'
                            : invoice.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {invoice.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => handleStatusChange(invoice)}
                          isLoading={statusChangeLoading === (invoice._id || invoice.id)}
                        >
                          {invoice.status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                        </Button>
                        <Button
                          size="small"
                          variant="ghost"
                          onClick={() => navigate(`/invoices/${invoice._id || invoice.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="small"
                          variant="ghost"
                          onClick={() => handleDelete(invoice._id || invoice.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                        {invoice.status !== 'Paid' && (
                          <Button
                            size="small"
                            variant="ghost"
                            onClick={() => handleOpenReminderModal(invoice._id || invoice.id)}
                            title="Generate Reminder"
                          >
                            <Mail className="w-4 h-4 text-blue-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* AI Invoice Creation Modal */}
      <CreateWithAIModal
        isopen={isModelOpen}
        onClose={() => setIsModelOpen(false)}
      />
      
      {/* ADDED: Reminder Modal */}
      <ReminderModal
        isopen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setSelectedInvoiceId(null);
        }}
        invoiceId={selectedInvoiceId}
      />
    </div>
  );
};

export default AllInvoices;