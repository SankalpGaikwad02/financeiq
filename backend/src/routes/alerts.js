import express from 'express';
import nodemailer from 'nodemailer';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS   // Gmail App Password
    }
  });
};

const sendBudgetAlert = async (userEmail, userName, category, spent, limit, percentage) => {
  const transporter = createTransporter();
  const remaining = limit - spent;
  const isExceeded = percentage >= 100;

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px; border-radius: 16px;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">💰 FinanceIQ</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Budget Alert</p>
      </div>
      
      <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid ${isExceeded ? '#ef4444' : '#f59e0b'};">
        <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 18px;">
          ${isExceeded ? '🚨 Budget Exceeded!' : '⚠️ Budget Warning'}
        </h2>
        <p style="color: #64748b; margin: 0;">Hi ${userName}, your <strong>${category}</strong> budget needs attention.</p>
      </div>

      <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Category</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1e293b; text-align: right; border-bottom: 1px solid #f1f5f9;">${category}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Monthly Budget</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1e293b; text-align: right; border-bottom: 1px solid #f1f5f9;">₹${limit.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Amount Spent</td>
            <td style="padding: 10px 0; font-weight: 600; color: #ef4444; text-align: right; border-bottom: 1px solid #f1f5f9;">₹${spent.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b;">Remaining</td>
            <td style="padding: 10px 0; font-weight: 700; color: ${remaining <= 0 ? '#ef4444' : '#10b981'}; text-align: right;">
              ${remaining <= 0 ? '-₹' + Math.abs(remaining).toLocaleString('en-IN') : '₹' + remaining.toLocaleString('en-IN')}
            </td>
          </tr>
        </table>

        <!-- Progress bar -->
        <div style="margin-top: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 12px; color: #64748b;">Budget Used</span>
            <span style="font-size: 12px; font-weight: 700; color: ${isExceeded ? '#ef4444' : '#f59e0b'};">${percentage}%</span>
          </div>
          <div style="background: #f1f5f9; border-radius: 999px; height: 8px; overflow: hidden;">
            <div style="background: ${isExceeded ? '#ef4444' : '#f59e0b'}; width: ${Math.min(percentage, 100)}%; height: 100%; border-radius: 999px;"></div>
          </div>
        </div>
      </div>

      <div style="background: #f0fdf4; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
        <p style="margin: 0; color: #166534; font-size: 14px;">
          💡 <strong>Tip:</strong> ${isExceeded 
            ? `You've exceeded your ${category} budget. Consider reviewing your spending or increasing your budget limit.`
            : `You have ₹${remaining.toLocaleString('en-IN')} left in your ${category} budget for this month. Spend wisely!`
          }
        </p>
      </div>

      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin: 0;">
        This alert was sent by FinanceIQ • Your Personal Finance Dashboard
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"FinanceIQ Alerts" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `${isExceeded ? '🚨' : '⚠️'} Budget Alert: ${category} at ${percentage}%`,
    html
  });
};

// POST /api/alerts/check - Check budgets and send alerts if needed
router.post('/check', protect, async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(400).json({ message: 'Email not configured. Add EMAIL_USER and EMAIL_PASS to .env' });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budgets = await Budget.find({ user: req.user._id, month, year });
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      user: req.user._id,
      type: 'expense',
      date: { $gte: start, $lte: end }
    });

    const user = await User.findById(req.user._id);
    const alertsSent = [];

    for (const budget of budgets) {
      const spent = transactions
        .filter(t => t.category === budget.category)
        .reduce((s, t) => s + t.amount, 0);
      const percentage = Math.round((spent / budget.limit) * 100);

      if (percentage >= 80) {
        await sendBudgetAlert(user.email, user.name, budget.category, spent, budget.limit, percentage);
        alertsSent.push({ category: budget.category, percentage });
      }
    }

    if (alertsSent.length === 0) {
      return res.json({ message: 'All budgets are healthy! No alerts needed.', alertsSent: [] });
    }

    res.json({ message: `${alertsSent.length} alert(s) sent successfully!`, alertsSent });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ message: 'Failed to send alerts: ' + error.message });
  }
});

// GET /api/alerts/status - Check which budgets are at risk (no email)
router.get('/status', protect, async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budgets = await Budget.find({ user: req.user._id, month, year });
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      user: req.user._id,
      type: 'expense',
      date: { $gte: start, $lte: end }
    });

    const statuses = budgets.map(budget => {
      const spent = transactions
        .filter(t => t.category === budget.category)
        .reduce((s, t) => s + t.amount, 0);
      const percentage = Math.round((spent / budget.limit) * 100);
      return {
        category: budget.category,
        spent,
        limit: budget.limit,
        percentage,
        status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'healthy'
      };
    });

    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
