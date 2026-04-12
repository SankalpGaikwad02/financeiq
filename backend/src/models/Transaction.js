import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    enum: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Salary', 'Investment', 'Other'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    trim: true
  },
  // --- RECURRING ---
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringInterval: {
    type: String,
    enum: ['monthly', 'weekly', 'yearly'],
    default: 'monthly'
  },
  recurringParentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  nextDueDate: {
    type: Date,
    default: null
  },
  // --- SPLIT EXPENSE ---
  isSplit: {
    type: Boolean,
    default: false
  },
  totalAmount: {
    type: Number,
    default: null   // full bill amount before split
  },
  splitWith: [{
    name: String,
    share: Number,  // their share amount
    settled: { type: Boolean, default: false }
  }],
  myShare: {
    type: Number,
    default: null
  }
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
