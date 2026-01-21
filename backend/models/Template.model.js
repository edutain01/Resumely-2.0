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
    enum: ['standard', 'modern', 'minimal', 'professional', 'creative', 'executive'],
    required: true
  },
  previewImage: {
    type: String,
    default: ''
  },
  // For built-in templates: just the component name (e.g., "StandardTemplate")
  // For custom templates: full HTML template with placeholders
  componentCode: {
    type: String,
    required: true
  },
  // CSS styles for the template (used with custom HTML templates)
  templateStyles: {
    type: String,
    default: ''
  },
  // Whether this is a built-in template (uses React components) or custom (uses HTML)
  isBuiltIn: {
    type: Boolean,
    default: false
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





