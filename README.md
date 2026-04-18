# 💰 FinanceIQ — Personal Finance Dashboard

> A full-stack personal finance web application to track spending, manage budgets, set financial goals, and get smart insights.

🌐 **Live Demo:** [financeiq-seven.vercel.app](https://financeiq-seven.vercel.app)

---

## ✨ Features

- 🔐 **Authentication** — Secure JWT-based login and registration
- 📊 **Dashboard** — Real-time stats, spending trends, and category breakdown charts
- 💸 **Transaction Management** — Add, filter, search and delete income/expense records
- 💳 **Budget Tracker** — Set monthly limits per category with visual progress bars
- 🎯 **Financial Goals** — Track savings goals with progress indicators
- 🔄 **Recurring Transactions** — Auto-generate repeating bills like Netflix, Rent, EMIs
- 👥 **Split Expenses** — Track shared bills and who owes you what
- 🔔 **Budget Alert Emails** — Get notified when spending hits 80% of budget via email
- 🤖 **Smart Insights** — Personalized financial tips based on your spending patterns
- 🎨 **Draggable Widgets** — Rearrange dashboard sections to your preference
- 🌙 **Dark Mode** — Full dark/light theme toggle
- 📱 **Responsive Design** — Works seamlessly on mobile, tablet and desktop
- 📈 **Reports** — Monthly charts including line, donut and bar visualizations

---

## 🛠️ Tech Stack

### Frontend
- **React 18** — Component-based UI
- **Vite** — Lightning fast build tool
- **Tailwind CSS** — Utility-first styling
- **Recharts** — Beautiful financial charts
- **React Router v6** — Client-side navigation
- **Lucide React** — Clean icon library
- **Axios** — API communication

### Backend
- **Node.js** — JavaScript runtime
- **Express.js** — REST API framework
- **MongoDB** — NoSQL database
- **Mongoose** — MongoDB object modeling
- **JWT** — JSON Web Token authentication
- **Bcrypt** — Password hashing
- **Nodemailer** — Email alert system

### Deployment
- **Vercel** — Frontend hosting
- **Render** — Backend hosting
- **MongoDB Atlas** — Cloud database

---

## 🏗️ Project Structure

```
financeiq/
├── frontend/                  # React + Vite application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Layout.jsx     # Sidebar navigation
│   │   │   ├── StatCard.jsx   # Stats display cards
│   │   │   └── AddTransactionModal.jsx
│   │   ├── pages/             # Application pages
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TransactionsPage.jsx
│   │   │   ├── BudgetsPage.jsx
│   │   │   ├── GoalsPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   ├── RecurringPage.jsx
│   │   │   ├── SplitsPage.jsx
│   │   │   └── AlertsPage.jsx
│   │   ├── context/           # Global state management
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   └── utils/
│   │       ├── api.js         # Axios instance
│   │       └── helpers.js     # Utility functions
│   └── public/
│       ├── favicon.svg
│       └── manifest.json
│
└── backend/                   # Node.js + Express API
    └── src/
        ├── models/            # MongoDB schemas
        │   ├── User.js
        │   ├── Transaction.js
        │   ├── Budget.js
        │   └── Goal.js
        ├── routes/            # API endpoints
        │   ├── auth.js
        │   ├── transactions.js
        │   ├── budgets.js
        │   ├── goals.js
        │   ├── recurring.js
        │   ├── splits.js
        │   ├── alerts.js
        │   └── insights.js
        ├── middleware/
        │   └── auth.js        # JWT middleware
        └── server.js
```

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- Node.js v18+
- MongoDB (local) or MongoDB Atlas account

### 1. Clone the repository
```bash
git clone https://github.com/SankalpGaikwad02/financeiq.git
cd financeiq
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/finance_dashboard
JWT_SECRET=your_secret_key_here
NODE_ENV=development
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Start the backend:
```bash
npm run dev
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/transactions` | Get transactions |
| POST | `/api/transactions` | Add transaction |
| GET | `/api/transactions/summary` | Monthly stats |
| GET | `/api/budgets` | Get budgets with spending |
| POST | `/api/budgets` | Create/update budget |
| GET | `/api/goals` | Get financial goals |
| POST | `/api/goals` | Create goal |
| GET | `/api/recurring` | Get recurring transactions |
| POST | `/api/splits` | Create split expense |
| GET | `/api/insights` | Get smart insights |
| POST | `/api/alerts/check` | Send budget alert emails |

---

## 🌐 Deployment

| Service | Purpose | URL |
|---------|---------|-----|
| Vercel | Frontend | [financeiq-seven.vercel.app](https://financeiq-seven.vercel.app) |
| Render | Backend API | [financeiq-backend-542n.onrender.com](https://financeiq-backend-542n.onrender.com) |
| MongoDB Atlas | Database | Cloud hosted |

---

## 📱 PWA Support

FinanceIQ is installable as a Progressive Web App:
- Open the live URL in **Safari** on iPhone
- Tap **Share → Add to Home Screen**
- Use it like a native app with no browser chrome!

---

## 🔮 Future Enhancements

- [ ] PDF export of monthly financial reports
- [ ] Multi-currency support
- [ ] Bank statement import (CSV)
- [ ] AI-powered spending predictions
- [ ] Family/shared account mode

---

## 👨‍💻 Author

**Sankalp Gaikwad**
- GitHub: [@SankalpGaikwad02](https://github.com/SankalpGaikwad02)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

⭐ If you found this project helpful, please give it a star!
