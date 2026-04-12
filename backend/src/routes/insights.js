import express from 'express';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/insights - Generate smart financial insights
router.get('/', protect, async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const lastMonthStart = new Date(year, month - 2, 1);
    const lastMonthEnd = new Date(year, month - 1, 0, 23, 59, 59);

    const thisMonthTxns = await Transaction.find({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    });

    const lastMonthTxns = await Transaction.find({
      user: req.user._id,
      date: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    const budgets = await Budget.find({ user: req.user._id, month, year });

    const insights = [];

    // Budget overspending alerts
    for (const budget of budgets) {
      const spent = thisMonthTxns
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((s, t) => s + t.amount, 0);
      const pct = (spent / budget.limit) * 100;

      if (pct >= 100) {
        insights.push({
          type: 'danger',
          icon: '🚨',
          message: `You've exceeded your ${budget.category} budget by ₹${Math.round(spent - budget.limit)}`
        });
      } else if (pct >= 80) {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          message: `You're at ${Math.round(pct)}% of your ${budget.category} budget — only ₹${Math.round(budget.limit - spent)} left`
        });
      }
    }

    // Month-over-month comparison
    const thisMonthExpenses = thisMonthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const lastMonthExpenses = lastMonthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    if (lastMonthExpenses > 0) {
      const change = ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
      if (change > 15) {
        insights.push({
          type: 'warning',
          icon: '📈',
          message: `Your spending is up ${Math.round(change)}% compared to last month`
        });
      } else if (change < -10) {
        insights.push({
          type: 'success',
          icon: '📉',
          message: `Great job! Your spending decreased by ${Math.abs(Math.round(change))}% this month`
        });
      }
    }

    // Top spending category
    const categoryTotals = {};
    thisMonthTxns.filter(t => t.type === 'expense').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      insights.push({
        type: 'info',
        icon: '💡',
        message: `${topCategory[0]} is your biggest expense this month at ₹${Math.round(topCategory[1])}`
      });
    }

    // Savings tip
    const income = thisMonthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    if (income > 0) {
      const savingsRate = ((income - thisMonthExpenses) / income) * 100;
      if (savingsRate < 20) {
        insights.push({
          type: 'tip',
          icon: '💰',
          message: `Your savings rate is ${Math.round(savingsRate)}%. Aim for at least 20% for financial health!`
        });
      } else {
        insights.push({
          type: 'success',
          icon: '🎉',
          message: `Excellent! You're saving ${Math.round(savingsRate)}% of your income this month`
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        type: 'info',
        icon: '📊',
        message: 'Add transactions and budgets to see personalized insights!'
      });
    }

    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
