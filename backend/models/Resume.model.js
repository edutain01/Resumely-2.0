import mongoose from 'mongoose';

/**
 * Resume Model - Document-Based Architecture
 * 
 * Resumes are stored as a flexible array of sections, not fixed fields.
 * Each section has a type, order, title, and flexible content structure.
 * This allows unlimited sections, reordering, and automatic section creation from uploads.
 */
const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Resume title is required'],
    trim: true,
    default: 'Untitled Resume'
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true
  },
  templateStyle: {
    type: String,
    enum: ['standard', 'modern', 'minimal', 'professional'],
    default: 'standard'
  },
  // Flexible section-based structure
  // Each section is a document with type, order, title, and content
  sections: [{
    type: {
      type: String,
      required: false,
      enum: ['header', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements', 'custom'],
      default: 'custom'
    },
    order: {
      type: Number,
      required: false,
      default: 0
    },
    title: {
      type: String,
      required: false,
      trim: true
    },
    // Flexible content structure - different per section type
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      default: {}
    }
  }],
  // Legacy metadata field for backward compatibility during migration
  metadata: {
    type: Object,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
resumeSchema.index({ userId: 1, createdAt: -1 });

// Helper method to convert legacy metadata to sections
resumeSchema.methods.migrateToSections = function() {
  if (this.sections && this.sections.length > 0) {
    return; // Already migrated
  }

  const sections = [];
  let order = 0;

  // Convert legacy metadata to sections
  if (this.metadata.personalInfo) {
    sections.push({
      type: 'header',
      order: order++,
      title: 'Header',
      content: this.metadata.personalInfo
    });
  }

  if (this.metadata.personalInfo?.summary) {
    sections.push({
      type: 'summary',
      order: order++,
      title: 'Professional Summary',
      content: { text: this.metadata.personalInfo.summary }
    });
  }

  if (this.metadata.experience && this.metadata.experience.length > 0) {
    sections.push({
      type: 'experience',
      order: order++,
      title: 'Professional Experience',
      content: { items: this.metadata.experience }
    });
  }

  if (this.metadata.education && this.metadata.education.length > 0) {
    sections.push({
      type: 'education',
      order: order++,
      title: 'Education',
      content: { items: this.metadata.education }
    });
  }

  if (this.metadata.skills && this.metadata.skills.length > 0) {
    sections.push({
      type: 'skills',
      order: order++,
      title: 'Skills',
      content: { items: Array.isArray(this.metadata.skills[0]) ? this.metadata.skills : [this.metadata.skills] }
    });
  }

  if (this.metadata.projects && this.metadata.projects.length > 0) {
    sections.push({
      type: 'projects',
      order: order++,
      title: 'Projects',
      content: { items: this.metadata.projects }
    });
  }

  if (this.metadata.certifications && this.metadata.certifications.length > 0) {
    sections.push({
      type: 'certifications',
      order: order++,
      title: 'Certifications',
      content: { items: this.metadata.certifications }
    });
  }

  if (this.metadata.achievements && this.metadata.achievements.length > 0) {
    sections.push({
      type: 'achievements',
      order: order++,
      title: 'Achievements',
      content: { items: this.metadata.achievements }
    });
  }

  if (this.metadata.customSections && this.metadata.customSections.length > 0) {
    this.metadata.customSections.forEach(section => {
      sections.push({
        type: 'custom',
        order: order++,
        title: section.title || 'Custom Section',
        content: section.content || {}
      });
    });
  }

  this.sections = sections;
  return this;
};

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
