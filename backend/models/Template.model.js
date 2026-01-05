import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['standard', 'modern', 'minimal', 'professional'],
    required: true
  },
  previewImage: {
    type: String,
    default: ''
  },
  componentCode: {
    type: String, // React component code as string
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Template = mongoose.model('Template', templateSchema);

export default Template;





