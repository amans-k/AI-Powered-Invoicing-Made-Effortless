const express = require("express");
const {
  parseInvoiceFromText,
  generateReminderEmail,
  generateDashboardSummary
} = require("../controllers/aiController.js");
const { protect } = require("../middlewares/authMiddleware.js");

const router = express.Router();

router.post("/parse-text", protect, parseInvoiceFromText);
router.post("/generate-reminder", protect, generateReminderEmail);
router.get("/dashboard-summary", protect, generateDashboardSummary);

module.exports = router;
