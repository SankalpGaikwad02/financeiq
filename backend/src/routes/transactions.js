import express from 'express';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/transactions - Get all transactions for user
router.get('/', protect, async (req, res) => {
  try {
    const { month, year, category, type, limit = 50 } = req.query;
    const query = { user: req.user._id };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }
    if (category) query.category = category;
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/transactions - Create transaction
router.post('/', protect, async (req, res) => {
  try {
    const transaction = await Transaction.create({
      ...req.body,
      user: req.user._id
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    if (!transaction) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/transactions/summary - Monthly summary stats
router.get('/summary', protect, async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    });

    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    // Category breakdown
    const categoryBreakdown = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
    });

    // Last 7 days trend
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayExpenses = transactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= dayStart && new Date(t.date) <= dayEnd)
        .reduce((s, t) => s + t.amount, 0);

      last7Days.push({
        day: new Date(dayStart).toLocaleDateString('en-IN', { weekday: 'short' }),
        amount: dayExpenses
      });
    }

    res.json({
      income,
      expenses,
      balance: income - expenses,
      savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
      categoryBreakdown,
      last7Days
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
