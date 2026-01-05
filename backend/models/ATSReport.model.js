import mongoose from 'mongoose';

const atsReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null
  },
  resumeText: {
    type: String,
    required: true
  },
  targetRole: {
    type: String,
    default: ''
  },
  experienceLevel: {
    type: String,
    enum: ['fresher', '1-3', '3-5', '5+', ''],
    default: ''
  },
  industry: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  keywordMatch: {
    type: Number,
    min: 0,
    max: 100
  },
  missingKeywords: {
    type: Array,
    default: []
  },
  suggestions: {
    type: Array,
    default: []
  },
  sectionWiseTips: {
    type: Object,
    default: {}
  },
  formattingSuggestions: {
    type: Array,
    default: []
  },
  aiAnalysis: {
    type: String,
    default: ''
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
atsReportSchema.index({ userId: 1, createdAt: -1 });
atsReportSchema.index({ score: -1 });

const ATSReport = mongoose.model('ATSReport', atsReportSchema);

export default ATSReport;





