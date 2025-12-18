# AI-Powered-Invoicing-Made-Effortless
# AI-Powered Invoicing Made Effortless

## 🚀 Overview
A modern, intelligent invoicing platform that leverages AI to simplify invoice creation, management, and tracking. Automate your billing process with smart features and intuitive design.

## ✨ Features

### 🤖 AI-Powered
- **Smart Invoice Generation** - Create invoices from plain text using AI
- **Automated Data Extraction** - Extract client details from documents
- **Intelligent Reminders** - AI-generated payment reminder emails
- **Dashboard Insights** - AI-powered analytics and summaries

### 📊 Invoice Management
- **Create & Edit** - Beautiful form-based invoice creation
- **Multi-Item Support** - Add unlimited items with tax calculation
- **PDF Export** - Professional print-ready invoices
- **Status Tracking** - Track pending, paid, and overdue invoices

### 👤 User Experience
- **User Profiles** - Manage business information
- **Secure Authentication** - JWT-based login system
- **Responsive Design** - Works on all devices
- **Dark/Light Mode** - Coming soon

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Tailwind CSS** - Styling framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Moment.js** - Date handling

### AI Integration
- **OpenAI API** - GPT-powered features
- **Natural Language Processing** - Text parsing
- **Smart Suggestions** - Context-aware help

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- MongoDB
- OpenAI API key

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Add your MONGO_URI and OPENAI_API_KEY
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure
```
ai-invoicing/
├── backend/
│   ├── controllers/    # Business logic
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints
│   └── middleware/     # Auth & validation
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI
│   │   ├── pages/      # Main views
│   │   ├── context/    # Auth state
│   │   └── utils/      # Helpers & config
└── README.md
```

## 🔑 Environment Variables

### Backend (.env)
```env
PORT=8000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### AI Features
- `POST /api/ai/parse-text` - Parse invoice from text
- `POST /api/ai/generate-reminder` - Generate reminder email
- `GET /api/ai/dashboard-summary` - Get AI insights

## 🖼️ Screenshots

1. **Dashboard** - Overview of all invoices
2. **Invoice Creation** - Smart form with AI suggestions
3. **Invoice Preview** - Professional invoice template
4. **Profile Management** - Business information

## 🚧 Development

### Running Locally
```bash
# Install dependencies
npm install

# Run backend
cd backend && npm run dev

# Run frontend (new terminal)
cd frontend && npm run dev
```

### Building for Production
```bash
cd frontend
npm run build
```

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments
- OpenAI for GPT integration
- Tailwind CSS for amazing styling utilities
- React community for awesome components

## 📞 Support
For support, email aman@example.com or open an issue in the GitHub repository.

---

**Made with ❤️ by [Waliullah Shaikh]**