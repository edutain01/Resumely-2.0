import mongoose from 'mongoose';

const resumeVersionSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
    index: true
  },
  versionNumber: {
    type: Number,
    required: true,
    default: 1
  },
  // Flexible section-based structure (new format)
  sections: [{
    type: {
      type: String,
      required: true,
      enum: ['header', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements', 'custom'],
      default: 'custom'
    },
    order: {
      type: Number,
      required: true,
      default: 0
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {}
    }
  }],
  // Legacy metadata field for backward compatibility
  metadata: {
    type: Object,
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: false // Optional for backward compatibility
  },
  templateStyle: {
    type: String,
    enum: ['standard', 'modern', 'minimal', 'professional'],
    default: 'standard'
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
resumeVersionSchema.index({ resumeId: 1, versionNumber: -1 });

const ResumeVersion = mongoose.model('ResumeVersion', resumeVersionSchema);

export default ResumeVersion;

