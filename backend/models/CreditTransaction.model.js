import mongoose from 'mongoose';

const creditTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['earned', 'purchased', 'used', 'admin_added', 'daily_free'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  relatedTo: {
    type: String,
    enum: ['ats_analysis', 'ai_enhancement', 'resume_creation', 'payment', 'daily_bonus', 'admin', 'other'],
    default: 'other'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
creditTransactionSchema.index({ userId: 1, createdAt: -1 });
creditTransactionSchema.index({ type: 1, createdAt: -1 });

const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);

export default CreditTransaction;





