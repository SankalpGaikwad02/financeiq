import express from 'express';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/splits - Get all split expenses
router.get('/', protect, async (req, res) => {
  try {
    const splits = await Transaction.find({
      user: req.user._id,
      isSplit: true
    }).sort({ date: -1 });
    res.json(splits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/splits - Create a split expense
router.post('/', protect, async (req, res) => {
  try {
    const { title, totalAmount, category, date, note, splitWith } = req.body;

    // Calculate my share = totalAmount - sum of others' shares
    const othersTotal = splitWith.reduce((s, p) => s + parseFloat(p.share), 0);
    const myShare = parseFloat(totalAmount) - othersTotal;

    if (myShare < 0) {
      return res.status(400).json({ message: "Others' shares exceed total amount" });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      title,
      amount: myShare,        // only my share hits the ledger
      totalAmount: parseFloat(totalAmount),
      type: 'expense',
      category: category || 'Other',
      date: date || new Date(),
      note,
      isSplit: true,
      myShare,
      splitWith: splitWith.map(p => ({
        name: p.name,
        share: parseFloat(p.share),
        settled: false
      }))
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/splits/:id/settle/:personIndex - Mark a person's share as settled
router.put('/:id/settle/:personIndex', protect, async (req, res) => {
  try {
    const txn = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!txn) return res.status(404).json({ message: 'Not found' });

    const idx = parseInt(req.params.personIndex);
    if (txn.splitWith[idx]) {
      txn.splitWith[idx].settled = !txn.splitWith[idx].settled;
      await txn.save();
    }
    res.json(txn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/splits/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
