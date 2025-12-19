// For Production (Render)
export const BASE_URL = "https://invoice-backend-ca4g.onrender.com";

// For Local Development
// export const BASE_URL = "http://localhost:8000";

export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    GET_PROFILE: "/api/auth/me",
    UPDATE_PROFILE: "/api/auth/me",
  },

  INVOICE: {
    CREATE: "/api/invoices/",
    GET_ALL_INVOICES: "/api/invoices/",
    GET_INVOICE_BY_ID: (id) => `/api/invoices/${id}`,
    UPDATE_INVOICE: (id) => `/api/invoices/${id}`,
    DELETE_INVOICE: (id) => `/api/invoices/${id}`,
  },

  AI: {
    PARSE_INVOICE_TEXT: "/api/ai/parse-text",
    GENERATE_REMINDER: "/api/ai/generate-reminder",
    GET_DASHBOARD_SUMMARY: "/api/ai/dashboard-summary",
  },
};

// Optional: Auto-detect environment
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Check if we're on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return "http://localhost:8000";
    }
  }
  return "https://invoice-backend-ca4g.onrender.com";
};

// Use like this: `${getBaseUrl()}${API_PATHS.AUTH.LOGIN}`