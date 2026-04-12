import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required']
  },
  savedAmount: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date
  },
  emoji: {
    type: String,
    default: '🎯'
  },
  color: {
    type: String,
    default: '#6366f1'
  }
}, { timestamps: true });

export default mongoose.model('Goal', goalSchema);
