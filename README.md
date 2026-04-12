# 💰 FinanceIQ — Personal Finance Dashboard

A full-stack personal finance web app built with **React + Node.js + MongoDB**.

---

## 🗂 Project Structure

```
finance-dashboard/
├── backend/          ← Node.js + Express API
│   ├── src/
│   │   ├── models/       (MongoDB schemas)
│   │   ├── routes/       (API endpoints)
│   │   ├── middleware/   (JWT auth)
│   │   └── server.js     (entry point)
│   ├── .env.example
│   └── package.json
│
└── frontend/         ← React + Vite + Tailwind CSS
    ├── src/
    │   ├── components/   (Layout, StatCard, AddTransactionModal)
    │   ├── context/      (Auth, Theme, Notification)
    │   ├── pages/        (Dashboard, Transactions, Budgets, Goals, Reports, Settings)
    │   └── utils/        (api.js, helpers.js)
    ├── index.html
    └── package.json
```

---

## 🚀 Step-by-Step Setup Guide

### ✅ STEP 1 — Install Prerequisites

You need these installed on your computer:

1. **Node.js** (v18 or higher) → https://nodejs.org
   - After install, verify: `node -v` and `npm -v`

2. **MongoDB Community Edition** → https://www.mongodb.com/try/download/community
   - Install it, then start the service:
     - **Windows**: MongoDB runs as a service automatically after install
     - **Mac**: `brew services start mongodb-community`
     - **Linux**: `sudo systemctl start mongod`
   - Verify MongoDB is running: `mongosh` (should open a shell)

---

### ✅ STEP 2 — Set Up the Backend

Open a terminal and run:

```bash
# Navigate to the backend folder
cd finance-dashboard/backend

# Install dependencies
npm install

# Create your .env file from the example
cp .env.example .env
```

Now open `.env` in any text editor and set:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_dashboard
JWT_SECRET=mySecretKey123ChangeThis
NODE_ENV=development
```

> 💡 You can set `JWT_SECRET` to any long random string. It's used to sign login tokens.

Start the backend server:

```bash
npm run dev
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
```

Test it: Open your browser and go to → `http://localhost:5000/api/health`
You should see: `{"status":"OK","message":"Finance Dashboard API is running"}`

---

### ✅ STEP 3 — Set Up the Frontend

Open a **new terminal tab** (keep the backend running!) and run:

```bash
# Navigate to the frontend folder
cd finance-dashboard/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

You should see:
```
VITE v5.x  ready in Xs
➜  Local:   http://localhost:5173/
```

Open your browser → `http://localhost:5173`

---

### ✅ STEP 4 — Create Your Account

1. You'll be redirected to the **Login** page
2. Click **"Register"** to create a new account
3. Fill in your name, email, password, and monthly income
4. You'll be automatically logged in and taken to the **Dashboard**

---

## 🎯 Features

| Feature | Description |
|---|---|
| 🔐 Authentication | JWT-based login & register |
| 📊 Dashboard | Hero section, stats, charts, insights |
| 💸 Transactions | Add, filter, search, delete |
| 💳 Budgets | Set monthly limits per category with progress bars |
| 🎯 Goals | Track savings goals with progress |
| 📈 Reports | Monthly charts (line, donut, bar) |
| 🤖 AI Insights | Smart alerts based on your data |
| 🌙 Dark Mode | Toggle in sidebar or Settings |
| 📱 Responsive | Works on mobile and desktop |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Icons | Lucide React |
| Fonts | DM Sans + Syne (Google Fonts) |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/update` | Update profile |
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Add transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/summary` | Monthly stats |
| GET | `/api/budgets` | List budgets with spending |
| POST | `/api/budgets` | Create/update budget |
| DELETE | `/api/budgets/:id` | Delete budget |
| GET | `/api/goals` | List goals |
| POST | `/api/goals` | Create goal |
| PUT | `/api/goals/:id` | Update goal |
| DELETE | `/api/goals/:id` | Delete goal |
| GET | `/api/insights` | Smart AI insights |

---

## ❓ Troubleshooting

**"Cannot connect to MongoDB"**
→ Make sure MongoDB is running. On Windows, check Services → "MongoDB". On Mac: `brew services start mongodb-community`

**"Port 5000 already in use"**
→ Change `PORT=5001` in your `.env` file, and update `vite.config.js` proxy target to `http://localhost:5001`

**Frontend shows blank page**
→ Check the terminal for errors. Make sure you ran `npm install` in the frontend folder.

**Login fails with "Network Error"**
→ Make sure the backend is running on port 5000 and you see "MongoDB connected" in the backend terminal.
