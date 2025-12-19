require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// Middleware to handle CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Connect Database
connectDB();

// Middleware
app.use(express.json());

// ========== ADD THESE ROUTES HERE ==========

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Invoice Generator API",
    status: "Running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    documentation: "API endpoints are available at /api/*",
    endpoints: {
      auth: "/api/auth",
      invoices: "/api/invoices", 
      ai: "/api/ai"
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    database: "connected",
    serverTime: new Date().toISOString()
  });
});

// Test endpoint
app.get("/ping", (req, res) => {
  res.json({ message: "pong", timestamp: new Date().toISOString() });
});

// ========== END OF ADDED ROUTES ==========

// Routes Here
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/ai", aiRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on Port ${PORT}`));