import express from 'express';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/recurring - Get all recurring transactions
router.get('/', protect, async (req, res) => {
  try {
    const recurring = await Transaction.find({
      user: req.user._id,
      isRecurring: true,
      recurringParentId: null  // only originals, not generated copies
    }).sort({ nextDueDate: 1 });
    res.json(recurring);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/recurring/process - Auto-generate due recurring transactions
router.post('/process', protect, async (req, res) => {
  try {
    const now = new Date();
    const due = await Transaction.find({
      user: req.user._id,
      isRecurring: true,
      recurringParentId: null,
      nextDueDate: { $lte: now }
    });

    const created = [];

    for (const parent of due) {
      // Create the new transaction for this period
      const newTxn = await Transaction.create({
        user: parent.user,
        title: parent.title,
        amount: parent.amount,
        type: parent.type,
        category: parent.category,
        date: parent.nextDueDate,
        note: `Auto-generated recurring (${parent.recurringInterval})`,
        isRecurring: false,
        recurringParentId: parent._id
      });

      // Update nextDueDate on parent
      const next = new Date(parent.nextDueDate);
      if (parent.recurringInterval === 'monthly') {
        next.setMonth(next.getMonth() + 1);
      } else if (parent.recurringInterval === 'weekly') {
        next.setDate(next.getDate() + 7);
      } else if (parent.recurringInterval === 'yearly') {
        next.setFullYear(next.getFullYear() + 1);
      }

      await Transaction.findByIdAndUpdate(parent._id, { nextDueDate: next });
      created.push(newTxn);
    }

    res.json({ processed: created.length, transactions: created });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/recurring/:id - Stop a recurring transaction
router.delete('/:id', protect, async (req, res) => {
  try {
    await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Recurring transaction stopped' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
