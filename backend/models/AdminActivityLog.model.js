import mongoose from 'mongoose';

const adminActivityLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'add_credits',
      'remove_credits',
      'upload_template',
      'update_template',
      'delete_template',
      'enable_template',
      'disable_template',
      'view_user',
      'update_user',
      'delete_user',
      'view_payment',
      'refund_payment',
      'other'
    ]
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  targetType: {
    type: String,
    enum: ['user', 'resume', 'template', 'payment', 'credit', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  },
  ipAddress: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
adminActivityLogSchema.index({ adminId: 1, createdAt: -1 });
adminActivityLogSchema.index({ action: 1, createdAt: -1 });

const AdminActivityLog = mongoose.model('AdminActivityLog', adminActivityLogSchema);

export default AdminActivityLog;





