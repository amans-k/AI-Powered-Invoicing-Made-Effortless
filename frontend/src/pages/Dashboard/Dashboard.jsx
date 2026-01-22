import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { 
  Loader2, FileText, IndianRupee, Plus, Calendar, Filter, 
  Download, TrendingUp, TrendingDown, Clock, RefreshCw 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import Button from "../../component/ui/Button";
import AIInsightsCard from "../../component/ui/AIInsightsCard";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
  });

  const [filteredStats, setFilteredStats] = useState({
    totalInvoices: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
  });

  const [recentInvoices, setRecentInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const navigate = useNavigate();

  // Fetch all invoices
  const fetchDashboardData = async () => {
    try {
      console.log("Fetching invoices from dashboard...");
      const response = await axiosInstance.get(
        API_PATHS.INVOICE.GET_ALL_INVOICES
      );

      console.log("Full API response:", response.data);
      
      let invoices = [];
      
      if (Array.isArray(response.data)) {
        invoices = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        invoices = response.data.data;
      } else if (response.data && response.data.invoices && Array.isArray(response.data.invoices)) {
        invoices = response.data.invoices;
      } else if (response.data && response.data.success) {
        invoices = response.data.data || [];
      }
      
      console.log("Processed invoices array:", invoices);
      
      // Sort by date descending
      const sortedInvoices = invoices.sort(
        (a, b) => new Date(b.invoiceDate || 0) - new Date(a.invoiceDate || 0)
      );

      setAllInvoices(sortedInvoices);
      updateStatistics(sortedInvoices);
      setRecentInvoices(sortedInvoices.slice(0, 5));
      setLastUpdated(new Date());

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error status:", error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const updateStatistics = (invoices) => {
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
    
    const paidInvoices = invoices.filter(inv => (inv.status || "Pending") === "Paid");
    const paidAmount = paidInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
    
    const unpaidInvoices = invoices.filter(inv => (inv.status || "Pending") !== "Paid");
    const unpaidAmount = unpaidInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);

    setStats({
      totalInvoices,
      totalPaid: paidInvoices.length,
      totalUnpaid: unpaidInvoices.length,
      totalAmount,
      paidAmount,
      unpaidAmount,
    });
  };

  // Apply date filter
  const applyDateFilter = () => {
    let filtered = [...allInvoices];
    
    if (dateFilter === "today") {
      const today = moment().startOf('day');
      filtered = filtered.filter(inv => 
        moment(inv.invoiceDate).isSame(today, 'day')
      );
    } else if (dateFilter === "week") {
      const weekStart = moment().startOf('week');
      filtered = filtered.filter(inv => 
        moment(inv.invoiceDate).isSameOrAfter(weekStart)
      );
    } else if (dateFilter === "month") {
      const monthStart = moment().startOf('month');
      filtered = filtered.filter(inv => 
        moment(inv.invoiceDate).isSameOrAfter(monthStart)
      );
    } else if (dateFilter === "custom" && customStartDate && customEndDate) {
      const start = moment(customStartDate).startOf('day');
      const end = moment(customEndDate).endOf('day');
      filtered = filtered.filter(inv => 
        moment(inv.invoiceDate).isBetween(start, end, null, '[]')
      );
    }

    // Calculate filtered statistics
    const totalInvoices = filtered.length;
    const totalAmount = filtered.reduce((acc, inv) => acc + (inv.total || 0), 0);
    
    const paidInvoices = filtered.filter(inv => (inv.status || "Pending") === "Paid");
    const paidAmount = paidInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
    
    const unpaidInvoices = filtered.filter(inv => (inv.status || "Pending") !== "Paid");
    const unpaidAmount = unpaidInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);

    setFilteredStats({
      totalInvoices,
      totalPaid: paidInvoices.length,
      totalUnpaid: unpaidInvoices.length,
      totalAmount,
      paidAmount,
      unpaidAmount,
    });

    setRecentInvoices(filtered.slice(0, 5));
  };

  // Daily reset at 12 AM IST
  useEffect(() => {
    const checkForDailyReset = () => {
      const now = moment();
      const istTime = now.utcOffset(330); // IST is UTC+5:30
      
      // Check if it's past midnight IST
      if (istTime.hour() === 0 && istTime.minute() === 0) {
        console.log("Daily reset triggered at midnight IST");
        fetchDashboardData();
      }
    };

    // Check every minute
    const interval = setInterval(checkForDailyReset, 60000);
    
    // Initial check
    checkForDailyReset();
    
    return () => clearInterval(interval);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Apply filter when date filter changes
  useEffect(() => {
    applyDateFilter();
  }, [dateFilter, customStartDate, customEndDate, allInvoices]);

  const statsData = [
    {
      icon: FileText,
      label: "Total Invoices",
      value: dateFilter === "all" ? stats.totalInvoices : filteredStats.totalInvoices,
      color: "blue",
      subLabel: dateFilter === "all" ? "All time" : "Filtered",
    },
    {
      icon: IndianRupee,
      label: "Total Amount",
      value: `₹${(dateFilter === "all" ? stats.totalAmount : filteredStats.totalAmount).toFixed(2)}`,
      color: "emerald",
      subLabel: `₹${(dateFilter === "all" ? stats.paidAmount : filteredStats.paidAmount).toFixed(2)} paid`,
    },
    {
      icon: TrendingUp,
      label: "Paid",
      value: dateFilter === "all" ? stats.totalPaid : filteredStats.totalPaid,
      color: "green",
      subLabel: `₹${(dateFilter === "all" ? stats.paidAmount : filteredStats.paidAmount).toFixed(2)}`,
    },
    {
      icon: TrendingDown,
      label: "Unpaid",
      value: dateFilter === "all" ? stats.totalUnpaid : filteredStats.totalUnpaid,
      color: "red",
      subLabel: `₹${(dateFilter === "all" ? stats.unpaidAmount : filteredStats.unpaidAmount).toFixed(2)}`,
    },
  ];

  const colorClasses = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
    green: { bg: "bg-green-100", text: "text-green-600" },
    red: { bg: "bg-red-100", text: "text-red-600" },
    orange: { bg: "bg-orange-100", text: "text-orange-600" },
    purple: { bg: "bg-purple-100", text: "text-purple-600" },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-slate-600">
              Last updated: {moment(lastUpdated).format("DD MMM YYYY, hh:mm A")}
            </p>
            <button 
              onClick={fetchDashboardData}
              className="p-1 hover:bg-slate-100 rounded"
              title="Refresh data"
            >
              <RefreshCw className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="bg-transparent text-sm text-slate-700 focus:outline-none"
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

          {dateFilter === "custom" && (
            <div className="flex gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-sm border-r border-slate-200 pr-2 focus:outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-sm pl-2 focus:outline-none"
              />
            </div>
          )}

          <Button
            variant="secondary"
            onClick={() => navigate("/invoices")}
            icon={FileText}
          >
            View All Invoices
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500 mb-1">
                  {stat.label}
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </div>
                {stat.subLabel && (
                  <div className="text-xs text-slate-400 mt-1">
                    {stat.subLabel}
                  </div>
                )}
              </div>
              <div
                className={`shrink-0 w-10 h-10 ${
                  colorClasses[stat.color].bg
                } rounded-lg flex items-center justify-center`}
              >
                <stat.icon
                  className={`w-5 h-5 ${
                    colorClasses[stat.color].text
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <AIInsightsCard/>

      {/* Recent Invoices with Date Info */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Recent Invoices
            </h3>
            {dateFilter !== "all" && (
              <p className="text-sm text-slate-500 mt-1">
                Showing {filteredStats.totalInvoices} invoices for selected period
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/invoices/new")}
              icon={Plus}
            >
              Create New
            </Button>
          </div>
        </div>

        {recentInvoices.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[600px] divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Invoice & Client
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
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-slate-200">
                {recentInvoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/invoices/${invoice._id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        #{invoice.invoiceNumber}
                      </div>
                      <div className="text-sm text-slate-500">
                        {invoice.billTo?.clientName || "No Client"}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {moment(invoice.invoiceDate).format("DD MMM YYYY")}
                      </div>
                      {invoice.dueDate && (
                        <div className="text-xs text-slate-400">
                          Due: {moment(invoice.dueDate).format("DD MMM")}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      ₹{(invoice.total || 0).toFixed(2)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : invoice.status === "Pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {invoice.status || "Pending"}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {invoice.paymentMode || "Cash"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No invoices found
            </h3>
            <p className="text-slate-500 mb-6 max-w-md">
              {dateFilter === "all" 
                ? "You haven't created any invoices yet."
                : "No invoices found for the selected date range."}
            </p>
            <Button
              onClick={() => navigate("/invoices/new")}
              icon={Plus}
            >
              Create Invoice
            </Button>
          </div>
        )}
      </div>

      {/* Date Range Summary */}
      {dateFilter !== "all" && filteredStats.totalInvoices > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Period Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="text-sm text-slate-500">Date Range</div>
              <div className="font-medium text-slate-900">
                {dateFilter === "today" 
                  ? moment().format("DD MMM YYYY")
                  : dateFilter === "week"
                  ? `${moment().startOf('week').format("DD MMM")} - ${moment().endOf('week').format("DD MMM YYYY")}`
                  : dateFilter === "month"
                  ? moment().format("MMMM YYYY")
                  : `${moment(customStartDate).format("DD MMM YYYY")} - ${moment(customEndDate).format("DD MMM YYYY")}`
                }
              </div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg">
              <div className="text-sm text-emerald-600">Collected Amount</div>
              <div className="font-medium text-emerald-900">
                ₹{filteredStats.paidAmount.toFixed(2)}
              </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="text-sm text-amber-600">Pending Collection</div>
              <div className="font-medium text-amber-900">
                ₹{filteredStats.unpaidAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;