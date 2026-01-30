import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { 
  Loader2, Trash2, Edit, Search, FileText, Plus, 
  AlertCircle, Sparkles, Mail, Filter, Calendar, 
  Download, RefreshCw, ChevronDown, ChevronUp 
} from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import Button from "../../component/ui/Button";
import CreateWithAIModal from "../../component/Invoices/CreateWithAIModal";
import ReminderModal from "../../component/Invoices/ReminderModal";

const AllInvoices = () => {
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, amount_desc, amount_asc
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const navigate = useNavigate();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      console.log("Fetching invoices from:", API_PATHS.INVOICE.GET_ALL_INVOICES);
      const response = await axiosInstance.get(API_PATHS.INVOICE.GET_ALL_INVOICES);
      
      let invoicesData = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          invoicesData = response.data;
        } else if (response.data.invoices && Array.isArray(response.data.invoices)) {
          invoicesData = response.data.invoices;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          invoicesData = response.data.data;
        } else if (typeof response.data === 'object') {
          const arrayKeys = Object.keys(response.data).filter(key => Array.isArray(response.data[key]));
          if (arrayKeys.length > 0) {
            invoicesData = response.data[arrayKeys[0]];
          }
        }
      }
      
      if (invoicesData.length > 0) {
        const sortedInvoices = invoicesData.sort(
          (a, b) => new Date(b.invoiceDate || b.createdAt || 0) - new Date(a.invoiceDate || a.createdAt || 0)
        );
        setInvoices(sortedInvoices);
      } else {
        setInvoices([]);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to fetch invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Daily reset at 12 AM IST (midnight)
  useEffect(() => {
    const checkForDailyReset = () => {
      const now = new Date();
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
      
      // Check if it's midnight (00:00:00 to 00:01:00)
      if (istTime.getHours() === 0 && istTime.getMinutes() === 0) {
        console.log("Daily reset triggered at midnight IST:", istTime);
        fetchInvoices();
      }
    };

    // Check every minute
    const interval = setInterval(checkForDailyReset, 60000);
    
    // Initial check
    checkForDailyReset();
    
    return () => clearInterval(interval);
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
      const newstatus = invoice.status === 'Paid' ? 'Unpaid' : 'Paid'; // CHANGED: "Pending" to "Unpaid"
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
    setSelectedInvoiceId(invoiceId);
    setIsReminderModalOpen(true);
  };

  const handleCreateWithAI = () => {
    setIsModelOpen(true);
  };

  // Apply date filter
  const filterByDate = (invoice) => {
    if (dateFilter === 'all') return true;
    if (!invoice.invoiceDate) return false;
    
    const invoiceDate = moment(invoice.invoiceDate);
    
    if (dateFilter === 'today') {
      return invoiceDate.isSame(moment(), 'day');
    } else if (dateFilter === 'week') {
      return invoiceDate.isSameOrAfter(moment().startOf('week'));
    } else if (dateFilter === 'month') {
      return invoiceDate.isSameOrAfter(moment().startOf('month'));
    } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
      const start = moment(customStartDate).startOf('day');
      const end = moment(customEndDate).endOf('day');
      return invoiceDate.isBetween(start, end, null, '[]');
    }
    
    return true;
  };

  // Apply sorting
  const sortInvoices = (a, b) => {
    switch (sortBy) {
      case 'date_desc':
        return new Date(b.invoiceDate || 0) - new Date(a.invoiceDate || 0);
      case 'date_asc':
        return new Date(a.invoiceDate || 0) - new Date(b.invoiceDate || 0);
      case 'amount_desc':
        return (b.total || 0) - (a.total || 0);
      case 'amount_asc':
        return (a.total || 0) - (b.total || 0);
      default:
        return new Date(b.invoiceDate || 0) - new Date(a.invoiceDate || 0);
    }
  };

  const filteredInvoices = useMemo(() => {
    let result = invoices
      .filter(invoice => {
        if (statusFilter === 'All') return true;
        // Convert old "Pending" to "Unpaid" for filtering
        const invoiceStatus = invoice.status === 'Pending' ? 'Unpaid' : invoice.status;
        return invoiceStatus === statusFilter;
      })
      .filter(invoice => {
        const invoiceNumber = invoice.invoiceNumber || '';
        const clientName = invoice.billTo?.clientName || '';
        const clientPhone = invoice.billTo?.phone || '';
        
        return (
          invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clientPhone.includes(searchTerm)
        );
      })
      .filter(filterByDate)
      .sort(sortInvoices);

    return result;
  }, [invoices, searchTerm, statusFilter, dateFilter, customStartDate, customEndDate, sortBy]);

  // Calculate statistics for filtered invoices
  const calculateStats = () => {
    const total = filteredInvoices.length;
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paidCount = filteredInvoices.filter(inv => inv.status === 'Paid').length;
    const paidAmount = filteredInvoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    return { total, totalAmount, paidCount, paidAmount };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">All Invoices</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-slate-600">
              Last updated: {moment(lastUpdated).format("DD MMM YYYY, hh:mm A")}
            </p>
            <button 
              onClick={fetchInvoices}
              className="p-1 hover:bg-slate-100 rounded"
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3 text-slate-500" />
            </button>
          </div>
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

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-500">Total Invoices</div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1">
            {dateFilter !== 'all' ? 'Filtered' : 'All time'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-500">Total Amount</div>
          <div className="text-2xl font-bold text-slate-900">₹{stats.totalAmount.toFixed(2)}</div>
          <div className="text-xs text-slate-400 mt-1">₹{stats.paidAmount.toFixed(2)} paid</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-500">Paid Invoices</div>
          <div className="text-2xl font-bold text-emerald-600">{stats.paidCount}</div>
          <div className="text-xs text-slate-400 mt-1">
            {stats.total > 0 ? `${Math.round((stats.paidCount / stats.total) * 100)}% paid` : 'No invoices'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-500">Date Range</div>
          <div className="text-sm font-medium text-slate-900">
            {dateFilter === 'all' ? 'All Time' : 
             dateFilter === 'today' ? 'Today' :
             dateFilter === 'week' ? 'This Week' :
             dateFilter === 'month' ? 'This Month' : 'Custom Range'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {filteredInvoices.length} invoices shown
          </div>
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

      {/* Filters Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex flex-col gap-4">
            {/* Top Row: Search and Toggle */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by invoice #, client name, or phone..."
                  className="w-full h-10 pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowFilters(!showFilters)}
                  icon={showFilters ? ChevronUp : ChevronDown}
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>
            </div>

            {/* Advanced Filters (Collapsible) */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    className="w-full h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Unpaid">Unpaid</option> {/* CHANGED: "Pending" to "Unpaid" */}
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date Range</label>
                  <select
                    className="w-full h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Custom Date Range */}
                {dateFilter === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
                      <input
                        type="date"
                        className="w-full h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                      <input
                        type="date"
                        className="w-full h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sort By</label>
                  <select
                    className="w-full h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="date_desc">Date (Newest First)</option>
                    <option value="date_asc">Date (Oldest First)</option>
                    <option value="amount_desc">Amount (High to Low)</option>
                    <option value="amount_asc">Amount (Low to High)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoices Table */}
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No invoices found</h3>
            <p className="text-slate-500 mb-6 max-w-md">
              {invoices.length === 0 
                ? "You haven't created any invoices yet." 
                : "Your search or filter criteria did not match any invoices. Please try adjusting your filters."}
            </p>
            {invoices.length === 0 && (
              <Button onClick={() => navigate('/invoices/new')} icon={Plus}>
                Create First Invoice
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Payment Mode
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
                      {invoice.invoiceNumber ? 
                        invoice.invoiceNumber.replace(/^INV-/, '') : 
                        `INV-${(invoice._id || invoice.id).slice(-6)}`}
                    </td>
                    <td
                      onClick={() => navigate(`/invoices/${invoice._id || invoice.id}`)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 cursor-pointer"
                    >
                      <div>{invoice.billTo?.clientName || invoice.clientName || "No Client"}</div>
                      <div className="text-xs text-slate-400">{invoice.billTo?.phone || ''}</div>
                    </td>
                    <td
                      onClick={() => navigate(`/invoices/${invoice._id || invoice.id}`)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 cursor-pointer"
                    >
                      <div>{invoice.invoiceDate ? moment(invoice.invoiceDate).format('DD/MM/YYYY') : 'N/A'}</div>
                      {invoice.dueDate && (
                        <div className="text-xs text-slate-400">
                          Due: {moment(invoice.dueDate).format('DD/MM')}
                        </div>
                      )}
                    </td>
                    <td
                      onClick={() => navigate(`/invoices/${invoice._id || invoice.id}`)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 cursor-pointer"
                    >
                      ₹{(invoice.total || invoice.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800' // CHANGED: Only "Unpaid" shows amber now
                        }`}
                      >
                        {invoice.status === 'Pending' ? 'Unpaid' : invoice.status} {/* CHANGED: Show "Unpaid" for old "Pending" invoices */}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {invoice.paymentMode || 'Cash'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => handleStatusChange(invoice)}
                          isLoading={statusChangeLoading === (invoice._id || invoice.id)}
                        >
                          {invoice.status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'} {/* CHANGED: "Pending" to "Unpaid" */}
                        </Button>
                        <Button
                          size="small"
                          variant="ghost"
                          onClick={() => navigate(`/invoices/${invoice._id || invoice.id}`)}
                          title="View/Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="small"
                          variant="ghost"
                          onClick={() => handleDelete(invoice._id || invoice.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                        {invoice.status !== 'Paid' && (
                          <Button
                            size="small"
                            variant="ghost"
                            onClick={() => handleOpenReminderModal(invoice._id || invoice.id)}
                            title="Send Reminder"
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
      
      {/* Reminder Modal */}
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