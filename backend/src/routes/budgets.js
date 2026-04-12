import express from 'express';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/budgets - Get budgets with spending for current month
router.get('/', protect, async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const budgets = await Budget.find({ user: req.user._id, month, year });

    // Get spending for each budget category
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      user: req.user._id,
      type: 'expense',
      date: { $gte: start, $lte: end }
    });

    const budgetsWithSpending = budgets.map(budget => {
      const spent = transactions
        .filter(t => t.category === budget.category)
        .reduce((s, t) => s + t.amount, 0);
      return {
        ...budget.toObject(),
        spent,
        percentage: Math.round((spent / budget.limit) * 100)
      };
    });

    res.json(budgetsWithSpending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/budgets - Create or update a budget
router.post('/', protect, async (req, res) => {
  try {
    const { category, limit, month, year } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month, year },
      { limit },
      { upsert: true, new: true }
    );
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
