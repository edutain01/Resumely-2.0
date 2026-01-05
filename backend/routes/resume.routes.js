import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import Resume from '../models/Resume.model.js';
import ResumeVersion from '../models/ResumeVersion.model.js';
import Template from '../models/Template.model.js';
import User from '../models/User.model.js';
import { uploadResume, deleteFile } from '../utils/upload.utils.js';
import { extractResumeText } from '../utils/resumeExtractor.utils.js';
import { parseResumeWithAI } from '../utils/gemini.utils.js';
import { generatePDF } from '../utils/pdfGenerator.utils.js';
import { metadataToSections, sectionsToMetadata } from '../utils/resumeSectionConverter.utils.js';
import HTMLtoDOCX from 'html-docx-js/dist/html-docx.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/resumes/templates
 * @desc    Get available templates for resume creation
 * @access  Private
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = await Template.find({ isActive: true })
      .select('name category description isDefault')
      .sort({ isDefault: -1, createdAt: -1 });

    // If no templates exist, return empty array instead of error
    res.json({
      success: true,
      data: { templates: templates || [] }
    });
  } catch (error) {
    console.error('Fetch templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/resumes
 * @desc    Get all resumes for current user
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id, isActive: true })
      .populate('templateId', 'name category')
      .sort({ lastModified: -1 });

    res.json({
      success: true,
      data: { resumes }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resumes',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/resumes/:id
 * @desc    Get single resume by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume ID format'
      });
    }

    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    }).populate('templateId', 'name category componentCode');

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      data: { resume }
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/resumes
 * @desc    Create a new resume
 * @access  Private
 */
router.post('/', [
  body('title').optional().trim(),
  body('templateId').notEmpty().withMessage('Template ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Create Resume Validation Errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, templateId, templateStyle, metadata } = req.body;
    console.log('Create Resume Request:', { title, templateId, hasMetadata: !!metadata, userId: req.user._id });

    // Handle templateId - it might be a string style name or an ObjectId
    let template;
    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: 'Template ID is required'
      });
    }

    // Check if templateId is a valid ObjectId format (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(templateId);
    
    if (isValidObjectId) {
      // It's an ObjectId, find by ID
      template = await Template.findById(templateId);
    } else {
      // It's a template style name (e.g., "standard", "modern"), find by name or style
      template = await Template.findOne({ 
        $or: [
          { name: { $regex: new RegExp(`^${templateId}$`, 'i') } },
          { category: { $regex: new RegExp(`^${templateId}$`, 'i') } }
        ],
        isActive: true 
      }) || await Template.findOne({ isActive: true, isDefault: true }) || 
         await Template.findOne({ isActive: true });
    }

    if (!template || !template.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Template not found or inactive. Please select a valid template.'
      });
    }

    const resume = await Resume.create({
      userId: req.user._id,
      title: title || 'Untitled Resume',
      templateId: template._id, // Save the ObjectId reference, not the string
      templateStyle: templateStyle || 'standard',
      metadata: metadata || {
        personalInfo: {},
        education: [],
        experience: [],
        skills: [],
        projects: [],
        certifications: [],
        achievements: [],
        customSections: []
      },
      sections: [] // Initialize with empty sections array
    });

    await resume.populate('templateId', 'name category');

    res.status(201).json({
      success: true,
      message: 'Resume created successfully',
      data: { resume }
    });
  } catch (error) {
    console.error('Create resume error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({
      success: false,
      message: 'Failed to create resume',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/resumes/:id
 * @desc    Update resume
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    const { title, metadata, templateStyle, templateId, sections } = req.body;

    if (title) resume.title = title;
    if (metadata) resume.metadata = metadata;
    if (sections && Array.isArray(sections)) resume.sections = sections;
    if (templateStyle) resume.templateStyle = templateStyle;
    
    // Update templateId if provided (user changed template)
    if (templateId) {
      // Validate templateId - it might be a string style name or an ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(templateId);
      
      let template;
      if (isValidObjectId) {
        // It's an ObjectId, find by ID
        template = await Template.findById(templateId);
      } else {
        // It's a template style name, find by name or category
        template = await Template.findOne({ 
          $or: [
            { name: { $regex: new RegExp(`^${templateId}$`, 'i') } },
            { category: { $regex: new RegExp(`^${templateId}$`, 'i') } }
          ],
          isActive: true 
        }) || await Template.findOne({ isActive: true, isDefault: true }) || 
           await Template.findOne({ isActive: true });
      }
      
      if (template && template.isActive) {
        resume.templateId = template._id; // Save the ObjectId reference
      } else {
        console.warn(`Template not found or inactive: ${templateId}. Keeping existing template.`);
      }
    }
    
    resume.lastModified = new Date();
    await resume.save();
    
    // Create version snapshot on major edits (when sections are updated)
    if (sections && Array.isArray(sections)) {
      try {
        const latestVersion = await ResumeVersion.findOne({ resumeId: resume._id })
          .sort({ versionNumber: -1 })
          .limit(1);
        
        const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
        
        await ResumeVersion.create({
          resumeId: resume._id,
          versionNumber: newVersionNumber,
          sections: JSON.parse(JSON.stringify(sections)),
          metadata: resume.metadata,
          templateId: resume.templateId, // Save template reference in version
          templateStyle: resume.templateStyle,
          notes: 'Auto-saved version'
        });
      } catch (versionError) {
        console.error('Failed to create version snapshot:', versionError);
        // Don't fail the update if versioning fails
      }
    }

    await resume.populate('templateId', 'name category');

    res.json({
      success: true,
      message: 'Resume updated successfully',
      data: { resume }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update resume',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/resumes/:id
 * @desc    Delete resume (soft delete)
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Validate MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume ID format'
      });
    }

    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Use updateOne to skip validation for soft delete
    await Resume.updateOne(
      { _id: req.params.id, userId: req.user._id },
      { $set: { isActive: false } }
    );

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resume',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/resumes/upload
 * @desc    Upload resume file and auto-populate
 * @access  Private
 */
router.post('/upload', uploadResume.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    // Extract text from resume
    const resumeText = await extractResumeText(filePath, mimeType);

    // Parse resume with AI
    let parsedData;
    try {
      parsedData = await parseResumeWithAI(resumeText);
    } catch (aiError) {
      console.error('AI parsing error:', aiError);
      // If AI parsing fails, return basic structure
      parsedData = {
        personalInfo: {},
        education: [],
        experience: [],
        skills: [],
        projects: [],
        certifications: [],
        achievements: [],
        customSections: []
      };
    }

    // Get default template
    const defaultTemplate = await Template.findOne({ isActive: true, isDefault: true }) ||
                           await Template.findOne({ isActive: true });

    if (!defaultTemplate) {
      await deleteFile(filePath);
      return res.status(500).json({
        success: false,
        message: 'No active template found'
      });
    }

    // Convert parsed metadata to sections array (new format)
    const { metadataToSections } = await import('../utils/resumeSectionConverter.utils.js');
    const sections = metadataToSections(parsedData);

    // Create resume from parsed data with sections
    const resume = await Resume.create({
      userId: req.user._id,
      title: parsedData.personalInfo?.name ? `${parsedData.personalInfo.name}'s Resume` : 'Uploaded Resume',
      templateId: defaultTemplate._id,
      templateStyle: 'standard',
      sections: sections,
      metadata: parsedData // Keep for backward compatibility
    });

    // Delete uploaded file after processing
    await deleteFile(filePath);

    await resume.populate('templateId', 'name category');

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      data: {
        resume,
        extractedText: resumeText.substring(0, 500) // Return first 500 chars for preview
      }
    });
  } catch (error) {
    // Clean up file on error
    if (req.file) {
      await deleteFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload and parse resume',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/resumes/:id/duplicate
 * @desc    Duplicate a resume
 * @access  Private
 */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const originalResume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!originalResume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    const duplicatedResume = await Resume.create({
      userId: req.user._id,
      title: `${originalResume.title} (Copy)`,
      templateId: originalResume.templateId,
      templateStyle: originalResume.templateStyle,
      sections: originalResume.sections && originalResume.sections.length > 0 
        ? JSON.parse(JSON.stringify(originalResume.sections)) // Deep copy
        : [],
      metadata: originalResume.metadata // Keep for backward compatibility
    });

    await duplicatedResume.populate('templateId', 'name category');

    res.status(201).json({
      success: true,
      message: 'Resume duplicated successfully',
      data: { resume: duplicatedResume }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate resume',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/resumes/:id/versions
 * @desc    Create a new version of resume
 * @access  Private
 */
router.post('/:id/versions', async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Get latest version number
    const latestVersion = await ResumeVersion.findOne({ resumeId: resume._id })
      .sort({ versionNumber: -1 })
      .limit(1);

    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    const version = await ResumeVersion.create({
      resumeId: resume._id,
      versionNumber: newVersionNumber,
      sections: resume.sections && resume.sections.length > 0 
        ? JSON.parse(JSON.stringify(resume.sections)) // Deep copy
        : [],
      metadata: resume.metadata, // Keep for backward compatibility
      templateId: resume.templateId, // Save template reference in version
      templateStyle: resume.templateStyle,
      notes: req.body.notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Version created successfully',
      data: { version }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create version',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/resumes/:id/versions
 * @desc    Get all versions of a resume
 * @access  Private
 */
router.get('/:id/versions', async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    const versions = await ResumeVersion.find({ resumeId: resume._id })
      .sort({ versionNumber: -1 });

    res.json({
      success: true,
      data: { versions }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch versions',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/resumes/:id/rename
 * @desc    Rename a resume
 * @access  Private
 */
router.patch('/:id/rename', [
  body('title').notEmpty().withMessage('Title is required').trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    resume.title = req.body.title;
    resume.lastModified = new Date();
    await resume.save();

    res.json({
      success: true,
      message: 'Resume renamed successfully',
      data: { resume }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to rename resume',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/resumes/:id/versions/:versionId/restore
 * @desc    Restore a specific version of resume
 * @access  Private
 */
router.post('/:id/versions/:versionId/restore', async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    const version = await ResumeVersion.findOne({
      _id: req.params.versionId,
      resumeId: resume._id
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    // Convert version metadata to sections if needed
    const { metadataToSections } = await import('../utils/resumeSectionConverter.utils.js');
    const sections = version.sections && version.sections.length > 0 
      ? version.sections 
      : metadataToSections(version.metadata);

    // Restore resume to this version
    resume.metadata = version.metadata;
    resume.sections = sections;
    resume.templateStyle = version.templateStyle;
    resume.lastModified = new Date();
    await resume.save();

    res.json({
      success: true,
      message: 'Version restored successfully',
      data: { resume }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to restore version',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/resumes/:id/export/pdf
 * @desc    Export resume as PDF
 * @access  Private
 */
router.post('/:id/export/pdf', async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    }).populate('templateId');

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Use sections if available, otherwise fall back to metadata (backward compatibility)
    // Generate PDF using the same layout engine as preview
    const pdfBuffer = await generatePDF(
      resume.sections && resume.sections.length > 0 ? resume.sections : null,
      resume.metadata || null,
      resume.templateStyle
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.title.replace(/\s+/g, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/resumes/:id/export/docx
 * @desc    Export resume as DOCX
 * @access  Private
 */
router.post('/:id/export/docx', async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    }).populate('templateId');

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Generate HTML (same as PDF)
    const { generateResumeHTML } = await import('../utils/resumeHTMLGenerator.utils.js');
    const { metadataToSections } = await import('../utils/resumeSectionConverter.utils.js');
    
    const sections = resume.sections && resume.sections.length > 0 
      ? resume.sections 
      : metadataToSections(resume.metadata);
    
    const html = generateResumeHTML(sections, resume.templateStyle);

    // Convert HTML to DOCX
    const docxBuffer = HTMLtoDOCX(html, {
      orientation: 'portrait',
      margins: { top: 720, right: 720, bottom: 720, left: 720 } // 0.5 inch = 720 twips
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.title || 'resume'}.docx"`);
    res.send(Buffer.from(docxBuffer));
  } catch (error) {
    console.error('DOCX Export Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate DOCX',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/resumes/import
 * @desc    Import resume file and extract data (for Resume Builder)
 * @access  Private
 */
router.post('/import', (req, res, next) => {
  uploadResume.single('resume')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 10MB.'
        });
      }
      if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'File upload failed: ' + err.message
      });
    }
    next();
  });
}, async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    filePath = req.file.path;
    const mimeType = req.file.mimetype;

    // Validate file type
    const validMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validMimeTypes.includes(mimeType)) {
      await deleteFile(filePath);
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PDF and DOCX files are supported.'
      });
    }

    // Extract text from resume
    let resumeText;
    try {
      resumeText = await extractResumeText(filePath, mimeType);
      if (!resumeText || resumeText.trim().length === 0) {
        throw new Error('No text could be extracted from the file');
      }
    } catch (extractError) {
      console.error('Text extraction error:', extractError);
      if (filePath) await deleteFile(filePath);
      return res.status(400).json({
        success: false,
        message: 'Failed to extract text from resume. Please ensure the file is not corrupted or password-protected.',
        error: extractError.message
      });
    }

    // Parse resume with AI (including custom sections detection)
    let parsedData;
    try {
      parsedData = await parseResumeWithAI(resumeText);
      if (!parsedData) {
        throw new Error('AI parser returned null or undefined');
      }
      console.log('Resume parsed successfully. Extracted:', {
        education: parsedData.education?.length || 0,
        experience: parsedData.experience?.length || 0,
        skills: parsedData.skills?.length || 0,
        projects: parsedData.projects?.length || 0,
        certifications: parsedData.certifications?.length || 0,
        achievements: parsedData.achievements?.length || 0,
        customSections: parsedData.customSections?.length || 0
      });
    } catch (aiError) {
      console.error('AI parsing error:', aiError);
      console.error('AI parsing error stack:', aiError.stack);
      // If AI parsing fails, use basic parser
      try {
        const { basicResumeParser } = await import('../utils/gemini.utils.js');
        parsedData = basicResumeParser(resumeText);
        if (!parsedData) {
          throw new Error('Basic parser returned null or undefined');
        }
        console.log('Using basic parser. Extracted:', {
          education: parsedData.education?.length || 0,
          experience: parsedData.experience?.length || 0,
          skills: parsedData.skills?.length || 0,
          projects: parsedData.projects?.length || 0,
          certifications: parsedData.certifications?.length || 0,
          achievements: parsedData.achievements?.length || 0
        });
      } catch (basicError) {
        console.error('Basic parser error:', basicError);
        console.error('Basic parser error stack:', basicError.stack);
        // Return basic structure with extracted text
        parsedData = {
          personalInfo: {
            summary: resumeText.substring(0, 500) // First 500 chars as summary
          },
          education: [],
          experience: [],
          skills: [],
          projects: [],
          certifications: [],
          achievements: [],
          customSections: []
        };
      }
    }
    
    // Ensure parsedData has all required fields
    if (!parsedData) {
      parsedData = {};
    }
    
    // Ensure all required fields exist with proper structure
    parsedData.personalInfo = parsedData.personalInfo || {};
    parsedData.education = Array.isArray(parsedData.education) ? parsedData.education : [];
    parsedData.experience = Array.isArray(parsedData.experience) ? parsedData.experience : [];
    parsedData.skills = Array.isArray(parsedData.skills) ? parsedData.skills : [];
    parsedData.projects = Array.isArray(parsedData.projects) ? parsedData.projects : [];
    parsedData.certifications = Array.isArray(parsedData.certifications) ? parsedData.certifications : [];
    parsedData.achievements = Array.isArray(parsedData.achievements) ? parsedData.achievements : [];
    parsedData.customSections = Array.isArray(parsedData.customSections) ? parsedData.customSections : [];

    // Delete uploaded file after processing
    if (filePath) {
      await deleteFile(filePath);
    }

    res.json({
      success: true,
      message: 'Resume imported and parsed successfully',
      data: {
        metadata: parsedData,
        extractedText: resumeText // Return full text for ATS analysis
      }
    });
  } catch (error) {
    console.error('Import resume error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Clean up file on error
    if (filePath) {
      try {
        await deleteFile(filePath);
      } catch (deleteError) {
        console.error('Failed to delete file:', deleteError);
      }
    }

    // Handle multer errors
    if (error.name === 'MulterError') {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 10MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to import resume',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while importing the resume. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

/**
 * @route   POST /api/resumes/builder/export-pdf
 * @desc    Export resume from builder to PDF without saving
 * @access  Private
 */
router.post('/builder/export-pdf', async (req, res) => {
  try {
    const { metadata, templateId, templateStyle, title } = req.body;

    if (!metadata || !templateId) {
      return res.status(400).json({
        success: false,
        message: 'Metadata and template ID are required'
      });
    }

    // Handle templateId - it might be a string style name or an ObjectId
    let template;
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(templateId);
    
    if (isValidObjectId) {
      template = await Template.findById(templateId);
    } else {
      // It's a template style name, find by name or use default
      template = await Template.findOne({ 
        $or: [
          { name: { $regex: new RegExp(`^${templateId}$`, 'i') } },
          { category: { $regex: new RegExp(`^${templateId}$`, 'i') } }
        ],
        isActive: true 
      }) || await Template.findOne({ isActive: true, isDefault: true }) || 
         await Template.findOne({ isActive: true });
    }

    if (!template || !template.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Template not found or inactive'
      });
    }

    // Generate PDF using sections and metadata
    const { generatePDF } = await import('../utils/pdfGenerator.utils.js');
    const { metadataToSections } = await import('../utils/resumeSectionConverter.utils.js');
    
    const sections = metadataToSections(metadata);

    // Generate PDF using sections and metadata (not raw HTML)
    const pdfBuffer = await generatePDF(sections, metadata, templateStyle || 'standard');

    // Validate PDF buffer
    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
      throw new Error('Invalid PDF buffer generated');
    }

    // Check if buffer has valid PDF header
    if (pdfBuffer.length < 4 || pdfBuffer.toString('ascii', 0, 4) !== '%PDF') {
      throw new Error('Generated buffer is not a valid PDF');
    }

    const fileName = (title || 'resume').replace(/[^a-z0-9]/gi, '_') + '.pdf';
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Builder PDF Export Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/resumes/builder/enhance
 * @desc    Enhance resume content with AI (ATS-friendly optimization)
 * @access  Private
 */
router.post('/builder/enhance', async (req, res) => {
  try {
    const { metadata, enhancementDetails } = req.body;

    if (!metadata) {
      return res.status(400).json({
        success: false,
        message: 'Resume metadata is required'
      });
    }

    // Check user credits (5 credits required)
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const ENHANCEMENT_COST = 5;
    if (user.credits < ENHANCEMENT_COST) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. ${ENHANCEMENT_COST} credits required. You have ${user.credits} credits.`,
        creditsRequired: ENHANCEMENT_COST,
        creditsAvailable: user.credits
      });
    }

    // Use AI to enhance resume content
    let enhancedMetadata;
    try {
      const { enhanceResumeContent } = await import('../utils/gemini.utils.js');
      // enhanceResumeContent expects (resumeData, inputs) - use general inputs for ATS optimization
      const enhancementInputs = {
        experienceLevel: 'mid-level',
        targetRole: 'General',
        industry: 'General',
        customInstructions: enhancementDetails || undefined
      };
      enhancedMetadata = await enhanceResumeContent(metadata, enhancementInputs);
      
      if (!enhancedMetadata) {
        throw new Error('AI enhancement returned null or undefined');
      }
    } catch (enhanceError) {
      console.error('AI Enhancement Error:', enhanceError);
      console.error('Enhancement error stack:', enhanceError.stack);
      // Don't deduct credits if enhancement failed
      return res.status(500).json({
        success: false,
        message: 'Failed to enhance resume with AI. Please try again.',
        error: process.env.NODE_ENV === 'development' ? enhanceError.message : undefined
      });
    }

    // Deduct credits only after successful enhancement
    try {
      const { deductCredits } = await import('../utils/credit.utils.js');
      await deductCredits(
        user._id,
        ENHANCEMENT_COST,
        'AI Resume Enhancement',
        { type: 'resume_enhancement' },
        'ai_enhancement'
      );
      
      // Refresh user to get updated credits
      const updatedUser = await User.findById(req.user._id);
      
      res.json({
        success: true,
        message: 'Resume enhanced successfully',
        data: {
          metadata: enhancedMetadata,
          creditsUsed: ENHANCEMENT_COST,
          creditsRemaining: updatedUser.credits
        }
      });
    } catch (creditError) {
      console.error('Credit deduction error:', creditError);
      // Enhancement succeeded but credit deduction failed - still return success but log error
      res.json({
        success: true,
        message: 'Resume enhanced successfully (credit deduction failed - please contact support)',
        data: {
          metadata: enhancedMetadata,
          creditsUsed: 0,
          creditsRemaining: user.credits
        }
      });
    }
  } catch (error) {
    console.error('Resume Enhancement Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to enhance resume',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while enhancing the resume. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

export default router;

