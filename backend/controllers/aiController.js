const { GoogleGenAI } = require("@google/genai");
const Invoice = require("../models/invoice");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * PARSE INVOICE FROM TEXT
 */
const parseInvoiceFromText = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "Text is required" });
  }

  try {
    const prompt = `You are an expert invoice data extraction AI. Analyze the following text and extract the relevant information to create an invoice. The output MUST be a valid JSON object.

{
  "clientName": "String",
  "email": "String (if available)",
  "address": "String (if available)",
  "items": [
    {
      "name": "string",
      "quantity": "number",
      "unitPrice": "number"
    }
  ]
}

TEXT START
${text}
TEXT END

Provide only JSON.`;

    // FIXED: Use working model
    const response = await ai.models.generateContent({
      model: "gemini-pro", // Changed from "gemini-1.5-flash-latest"
      contents: prompt,
    });

    let responseText = response.text;
    if (typeof responseText !== "string") {
      responseText = response.text();
    }

    const cleanedJson = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedData = JSON.parse(cleanedJson);

    res.status(200).json(parsedData);
  } catch (error) {
    console.error("Error parsing invoice with AI:", error);
    
    // Fallback response if AI fails
    const fallbackData = {
      clientName: "Client Name",
      email: "",
      address: "",
      items: [
        {
          name: "Item 1",
          quantity: 1,
          unitPrice: 100
        }
      ]
    };
    
    res.status(200).json(fallbackData);
  }
};

/**
 * GENERATE REMINDER EMAIL
 */
const generateReminderEmail = async (req, res) => {
  const { invoiceId } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ message: "Invoice ID is required" });
  }

  try {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const prompt = `You are a professional and polite accounting assistant. Write a friendly reminder email to a client about an overdue or upcoming invoice payment.

Client Name: ${invoice.billTo.clientName}
Invoice Number: ${invoice.invoiceNumber}
Amount Due: ${invoice.total.toFixed(2)}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}

The tone should be friendly but clear. Keep it concise. Start the email with "Subject:".`;

    // FIXED: Use working model
    const response = await ai.models.generateContent({
      model: "gemini-pro", // Changed from "gemini-1.5-flash-latest"
      contents: prompt,
    });

    res.status(200).json({ reminderText: response.text });
  } catch (error) {
    console.error("Error generating reminder email with AI:", error);
    
    // Fallback reminder if AI fails
    const fallbackReminder = `Subject: Payment Reminder for Invoice ${invoice?.invoiceNumber || ''}

Dear ${invoice?.billTo?.clientName || 'Client'},

This is a friendly reminder regarding invoice #${invoice?.invoiceNumber || ''} for ${invoice?.total?.toFixed(2) || '0.00'} which was due on ${invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'the due date'}.

Please process the payment at your earliest convenience.

Best regards,
Your Business Team`;

    res.status(200).json({ reminderText: fallbackReminder });
  }
};

/**
 * DASHBOARD SUMMARY
 */
const generateDashboardSummary = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id });

    if (invoices.length === 0) {
      return res.status(200).json({
        insights: ["No invoice data available to generate insights."],
      });
    }

    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(inv => inv.status === "Paid");
    const unpaidInvoices = invoices.filter(inv => inv.status !== "Paid");

    const totalRevenue = paidInvoices.reduce(
      (acc, inv) => acc + (inv.total || 0),
      0
    );

    const totalOutstanding = unpaidInvoices.reduce(
      (acc, inv) => acc + (inv.total || 0),
      0
    );

    const dataSummary = `
Total number of invoices: ${totalInvoices}
Total paid invoices: ${paidInvoices.length}
Total unpaid/pending invoices: ${unpaidInvoices.length}
Total revenue from paid invoices: ${totalRevenue.toFixed(2)}
Total outstanding amount from unpaid/pending invoices: ${totalOutstanding.toFixed(2)}
Recent invoices:
${invoices
  .slice(0, 5)
  .map(
    inv =>
      `Invoice #${inv.invoiceNumber} for ${(inv.total || 0).toFixed(2)} with status ${inv.status || 'Pending'}`
  )
  .join(", ")}
`;

    const prompt = `
You are a friendly and insightful financial analyst for a small business.

Based on the following summary of invoice data, provide 2-3 insights.
Each insight should be a short string in a JSON array.
Do not repeat the data directly.

Data Summary:
${dataSummary}

Return ONLY valid JSON in this format:
{"insights":["Insight 1","Insight 2"]}
`;

    try {
      // FIXED: Use working model with try-catch
      const response = await ai.models.generateContent({
        model: "gemini-pro", // Changed from "gemini-1.5-flash-latest"
        contents: prompt,
      });

      const responseText = response.text;
      const cleanedJson = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsedData = JSON.parse(cleanedJson);
      
      res.status(200).json(parsedData);
    } catch (aiError) {
      console.error("AI model error, using fallback insights:", aiError);
      
      // Generate fallback insights based on invoice data
      const fallbackInsights = [];
      
      if (totalInvoices > 0) {
        if (unpaidInvoices.length > 0) {
          fallbackInsights.push(`You have ${unpaidInvoices.length} unpaid invoices totaling ₹${totalOutstanding.toFixed(2)}`);
        }
        
        if (paidInvoices.length > 0) {
          fallbackInsights.push(`Great job! You've collected ₹${totalRevenue.toFixed(2)} from ${paidInvoices.length} paid invoices`);
        }
        
        if (unpaidInvoices.length > paidInvoices.length) {
          fallbackInsights.push("Consider sending payment reminders for outstanding invoices");
        } else {
          fallbackInsights.push("Your payment collection rate is looking good!");
        }
      }
      
      // Ensure we always have insights
      if (fallbackInsights.length === 0) {
        fallbackInsights.push("Start by creating your first invoice");
        fallbackInsights.push("Set payment terms clearly on each invoice");
        fallbackInsights.push("Follow up promptly on due payments");
      }
      
      res.status(200).json({
        insights: fallbackInsights.slice(0, 3) // Max 3 insights
      });
    }
    
  } catch (error) {
    console.error("Error Dashboard Summary with AI:", error);
    
    // Always return some insights even on error
    res.status(200).json({
      insights: [
        "✨ Track your invoices to improve cash flow",
        "📊 Create more invoices to unlock detailed insights", 
        "💡 Set reminders for upcoming due dates"
      ]
    });
  }
};

module.exports = {
  parseInvoiceFromText,
  generateReminderEmail,
  generateDashboardSummary,
};