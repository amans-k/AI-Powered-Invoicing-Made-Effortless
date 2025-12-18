import { BarChart2, FileText, Mail, Sparkles, LayoutDashboard, Plus, Users } from "lucide-react";

export const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Invoice Creation",
    description:
      "Paste any text, email, or receipt, and let our AI instantly generate a complete, professional invoice for you.",
  },
  {
    icon: BarChart2,
    title: "AI-Powered Dashboard",
    description:
      "Get smart, actionable insights about your business finances, generated automatically by our AI analyst.",
  },
  {
    icon: Mail,
    title: "Smart Reminders",
    description:
      "Automatically generate polite and effective payment reminder emails for overdue invoices with a single click.",
  },
  {
    icon: FileText,
    title: "Easy Invoice Management",
    description:
      "Easily manage all your invoices, track payments, and send reminders for overdue payments.",
  },
];

export const TESTIMONIALS = [
  {
    quote: "This app saved me hours of work. I can now create and send invoices in minutes!",
    author: "Jane Doe",
    title: "Freelance Designer",
    avatar: "https://placehold.co/100x100/000000/ffffff?text=JD",
  },
  {
    quote: "The best invoicing app I have ever used. Simple, intuitive, and powerful.",
    author: "John Smith",
    title: "Small Business Owner",
    avatar: "https://placehold.co/100x100/000000/ffffff?text=JS",
  },
  {
    quote: "I love the dashboard and reporting features. It helps me keep track of my finances.",
    author: "Peter Jones",
    title: "Consultant",
    avatar: "https://placehold.co/100x100/000000/ffffff?text=PJ",
  },
];

export const FAQS = [
  {
    question: "How does the AI invoice creation work?",
    answer:
      "Simply paste any text that contains invoice details—like an email, a list of services, or a receipt—and our AI will automatically extract the information and generate a professional invoice for you.",
  },
  {
    question: "Is there a free trial available?",
    answer:
      "Yes, you can try our platform for free for 14 days. During the trial, you get full access to all features so you can explore everything before upgrading.",
  },
  {
    question: "Can I change my plan later?",
    answer:
      "Of course. Our pricing scales with your company's needs. You can upgrade or downgrade your plan at any time by contacting our friendly support team.",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "We understand that things change. You can cancel your plan at any time, and you will not be charged for the next billing cycle.",
  },
  {
    question: "Can other info be added to an invoice?",
    answer:
      "Yes, you can add notes, payment terms, tax details, discounts, and even attach files to your invoices for better clarity.",
  },
  {
    question: "How does billing work?",
    answer:
      "Plans are billed per workspace, not per account. This allows you to manage and upgrade individual workspaces based on your business needs.",
  },
  {
    question: "How do I change my account email?",
    answer:
      "You can change your account email directly from your profile settings page. Simply update the email address and save your changes.",
  },
];

// Navigation items configuration
export const NAVIGATION_MENU = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
  { id: "invoices", name: "Invoices", icon: FileText },
  { id: "invoices/new", name: "Create Invoice", icon: Plus },
  { id: "profile", name: "Profile", icon: Users },
];