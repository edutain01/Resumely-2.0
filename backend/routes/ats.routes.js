import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import ATSReport from '../models/ATSReport.model.js';
import Resume from '../models/Resume.model.js';
import { analyzeATS, parseResumeWithAI } from '../utils/gemini.utils.js';
import { deductCredits } from '../utils/credit.utils.js';
import { uploadResume, deleteFile } from '../utils/upload.utils.js';
import { extractResumeText } from '../utils/resumeExtractor.utils.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/ats/analyze
 * @desc    Analyze resume for ATS compatibility
 * @access  Private
 */
router.post('/analyze', uploadResume.single('resume'), [
  body('targetRole').optional({ checkFalsy: true }).trim(),
  body('experienceLevel')
    .optional({ checkFalsy: true })
    .custom((value) => {
      // If value is empty, null, or undefined, it's valid (optional field)
      if (!value || value.trim() === '') {
        return true;
      }
      // If value is provided, it must be one of the valid options
      const validLevels = ['fresher', '1-3', '3-5', '5+'];
      return validLevels.includes(value.trim());
    })
    .withMessage('Valid experience level must be one of: fresher, 1-3, 3-5, 5+'),
  body('industry').optional({ checkFalsy: true }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('ATS Analyze Validation Errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { resumeId, resumeText, targetRole, experienceLevel, industry } = req.body;
    // Normalize optional fields - convert empty strings to undefined
    const normalizedTargetRole = targetRole?.trim() || undefined;
    const normalizedExperienceLevel = experienceLevel?.trim() || undefined;
    const normalizedIndustry = industry?.trim() || undefined;
    
    let filePath = null;
    let extractedMetadata = null;

    console.log('ATS Analyze Request:', { resumeId, hasResumeText: !!resumeText, hasFile: !!req.file, targetRole: normalizedTargetRole, experienceLevel: normalizedExperienceLevel });

    let textToAnalyze = resumeText;

    // If file uploaded, extract text and parse metadata
    if (req.file) {
      filePath = req.file.path;
      const mimeType = req.file.mimetype;
      
      try {
        textToAnalyze = await extractResumeText(filePath, mimeType);
        
        // Also parse metadata for resume creation
        try {
          extractedMetadata = await parseResumeWithAI(textToAnalyze);
        } catch (parseError) {
          console.error('Metadata extraction error (non-fatal):', parseError);
        }
      } catch (extractError) {
        if (filePath) await deleteFile(filePath);
        return res.status(400).json({
          success: false,
          message: 'Failed to extract text from file. Please ensure the file is not corrupted.',
          error: extractError.message
        });
      }
    }

    // If resumeId provided, fetch resume data
    if (resumeId && !textToAnalyze && !req.file) {
      const resume = await Resume.findOne({
        _id: resumeId,
        userId: req.user._id,
        isActive: true
      });

      if (!resume) {
        if (filePath) await deleteFile(filePath);
        return res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }

      // Convert resume metadata to text format
      textToAnalyze = convertResumeMetadataToText(resume.metadata);
      extractedMetadata = resume.metadata; // Use existing metadata
    }

    if (!textToAnalyze) {
      if (filePath) await deleteFile(filePath);
      return res.status(400).json({
        success: false,
        message: 'Resume text, resume ID, or file is required'
      });
    }

    console.log('Text to analyze length:', textToAnalyze.length);

    // Check if user has enough credits
    const creditsRequired = parseInt(process.env.ATS_CREDITS_COST || '5');
    
    try {
      await deductCredits(
        req.user._id,
        creditsRequired,
        `ATS analysis${normalizedTargetRole ? ` for ${normalizedTargetRole}` : ''}`,
        { targetRole: normalizedTargetRole, experienceLevel: normalizedExperienceLevel, industry: normalizedIndustry, resumeId },
        'ats_analysis'
      );
    } catch (creditError) {
      return res.status(400).json({
        success: false,
        message: creditError.message || 'Insufficient credits'
      });
    }

    // Analyze with AI
    let analysis;
    try {
      analysis = await analyzeATS(textToAnalyze, {
        targetRole: normalizedTargetRole || '',
        experienceLevel: normalizedExperienceLevel || '',
        industry: normalizedIndustry || ''
      });
      
      if (!analysis || typeof analysis.score !== 'number') {
        throw new Error('Invalid analysis response from AI');
      }
    } catch (aiError) {
      console.error('AI Analysis Error:', aiError);
      if (filePath) await deleteFile(filePath);
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze resume with AI. Please try again.',
        error: process.env.NODE_ENV === 'development' ? aiError.message : undefined
      });
    }

    // Save report
    let report;
    try {
      report = await ATSReport.create({
        userId: req.user._id,
        resumeId: resumeId || null,
        resumeText: textToAnalyze,
        targetRole: normalizedTargetRole || '',
        experienceLevel: normalizedExperienceLevel || '',
        industry: normalizedIndustry || '',
        score: analysis.score,
        keywordMatch: analysis.keywordMatch || 0,
        missingKeywords: analysis.missingKeywords || [],
        suggestions: analysis.suggestions || [],
        sectionWiseTips: analysis.sectionWiseTips || {},
        formattingSuggestions: analysis.formattingSuggestions || [],
        aiAnalysis: analysis.aiAnalysis || '',
        metadata: extractedMetadata || null // Store extracted metadata for resume creation
      });
    } catch (saveError) {
      console.error('Save Report Error:', saveError);
      if (filePath) await deleteFile(filePath);
      return res.status(500).json({
        success: false,
        message: 'Failed to save analysis report',
        error: process.env.NODE_ENV === 'development' ? saveError.message : undefined
      });
    }

    // Clean up uploaded file
    if (filePath) {
      try {
        await deleteFile(filePath);
      } catch (deleteError) {
        console.error('Failed to delete file:', deleteError);
      }
    }

    // Get updated user credits
    const User = (await import('../models/User.model.js')).default;
    const updatedUser = await User.findById(req.user._id);

    res.status(201).json({
      success: true,
      message: 'ATS analysis completed',
      data: { 
        report,
        extractedMetadata: extractedMetadata || null, // Include parsed metadata for resume creation
        creditsRemaining: updatedUser?.credits || 0
      }
    });
  } catch (error) {
    console.error('ATS Analysis error:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up uploaded file if it exists
    if (filePath) {
      try {
        await deleteFile(filePath);
      } catch (deleteError) {
        console.error('Failed to delete file during error cleanup:', deleteError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to analyze resume. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/ats/reports/:id
 * @desc    Get ATS report by ID
 * @access  Private
 */
router.get('/reports/:id', async (req, res) => {
  try {
    const report = await ATSReport.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('resumeId', 'title');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
});

/**
 * Helper function to convert resume metadata to text
 */
function convertResumeMetadataToText(metadata) {
  let text = '';

  if (metadata.personalInfo) {
    const pi = metadata.personalInfo;
    text += `${pi.name || ''}\n${pi.email || ''}\n${pi.phone || ''}\n${pi.location || ''}\n`;
    if (pi.summary) text += `\nSummary: ${pi.summary}\n`;
  }

  if (metadata.experience && metadata.experience.length > 0) {
    text += '\nExperience:\n';
    metadata.experience.forEach(exp => {
      text += `${exp.title || ''} at ${exp.company || ''}\n`;
      if (exp.description) text += `${exp.description}\n`;
      if (exp.achievements && exp.achievements.length > 0) {
        exp.achievements.forEach(ach => text += `- ${ach}\n`);
      }
    });
  }

  if (metadata.education && metadata.education.length > 0) {
    text += '\nEducation:\n';
    metadata.education.forEach(edu => {
      text += `${edu.degree || ''} from ${edu.institution || ''}\n`;
      if (edu.description) text += `${edu.description}\n`;
    });
  }

  if (metadata.skills && metadata.skills.length > 0) {
    text += '\nSkills: ' + metadata.skills.join(', ') + '\n';
  }

  if (metadata.projects && metadata.projects.length > 0) {
    text += '\nProjects:\n';
    metadata.projects.forEach(proj => {
      text += `${proj.name || ''}\n${proj.description || ''}\n`;
    });
  }

  return text;
}

/**
 * @route   POST /api/ats/reports/:id/create-resume
 * @desc    Create optimized resume from ATS analysis (applies all AI suggestions)
 * @access  Private
 */
router.post('/reports/:id/create-resume', async (req, res) => {
  try {
    const { templateId } = req.body;
    console.log('Create optimized resume request:', { reportId: req.params.id, templateId, userId: req.user._id });
    
    // Get the ATS report
    const report = await ATSReport.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!report) {
      console.error('Report not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'ATS report not found'
      });
    }
    
    console.log('Report found:', { reportId: report._id, hasResumeId: !!report.resumeId, hasResumeText: !!report.resumeText });

    // Check user credits (5 credits required)
    const User = (await import('../models/User.model.js')).default;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const CREDITS_COST = 5;
    if (user.credits < CREDITS_COST) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. ${CREDITS_COST} credits required. You have ${user.credits} credits.`,
        creditsRequired: CREDITS_COST,
        creditsAvailable: user.credits
      });
    }

    // Get resume metadata (from existing resume, report metadata, or parsing resumeText)
    let resumeMetadata = null;
    
    // First, try to get from existing resume if report has resumeId
    if (report.resumeId) {
      try {
        const existingResume = await Resume.findOne({
          _id: report.resumeId,
          userId: req.user._id
        });
        if (existingResume && existingResume.metadata) {
          resumeMetadata = existingResume.metadata;
          console.log('Using metadata from existing resume');
        }
      } catch (resumeError) {
        console.error('Error fetching existing resume:', resumeError);
      }
    }

    // If no metadata from resume, try to get from report metadata field (if stored)
    if (!resumeMetadata && report.metadata && typeof report.metadata === 'object') {
      resumeMetadata = report.metadata;
      console.log('Using metadata from report');
    }

    // If still no metadata, try to parse from resumeText
    if (!resumeMetadata && report.resumeText && report.resumeText.length > 100) {
      try {
        console.log('Parsing resume text to extract metadata...');
        const { parseResumeWithAI } = await import('../utils/gemini.utils.js');
        resumeMetadata = await parseResumeWithAI(report.resumeText);
        console.log('Successfully parsed metadata from resume text');
      } catch (parseError) {
        console.error('Failed to parse resume text:', parseError);
        console.error('Parse error stack:', parseError.stack);
        // Don't return error yet, try to continue with basic metadata
      }
    }

    if (!resumeMetadata) {
      console.error('No resume metadata available:', {
        hasResumeId: !!report.resumeId,
        hasResumeText: !!report.resumeText,
        resumeTextLength: report.resumeText?.length || 0,
        hasReportMetadata: !!report.metadata
      });
      return res.status(400).json({
        success: false,
        message: 'No resume data found. Please analyze a resume first or ensure the resume has content.'
      });
    }
    
    console.log('Resume metadata found:', {
      hasPersonalInfo: !!resumeMetadata.personalInfo,
      experienceCount: resumeMetadata.experience?.length || 0,
      educationCount: resumeMetadata.education?.length || 0,
      skillsCount: resumeMetadata.skills?.length || 0
    });

    // Enhance resume with AI using ATS analysis insights
    let enhancedMetadata;
    try {
      const { enhanceResumeContent } = await import('../utils/gemini.utils.js');
      
      // Create enhancement prompt that incorporates ATS suggestions
      enhancedMetadata = await enhanceResumeContent(resumeMetadata, {
        targetRole: report.targetRole || '',
        experienceLevel: report.experienceLevel || '',
        industry: report.industry || '',
        atsSuggestions: report.suggestions || [],
        missingKeywords: report.missingKeywords || [],
        sectionWiseTips: report.sectionWiseTips || {}
      });
      
      if (!enhancedMetadata) {
        throw new Error('AI enhancement returned null or undefined');
      }
    } catch (enhanceError) {
      console.error('AI Enhancement Error:', enhanceError);
      console.error('Enhancement error stack:', enhanceError.stack);
      console.error('Enhancement error details:', {
        message: enhanceError.message,
        name: enhanceError.name
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to optimize resume with AI. Please try again.',
        error: process.env.NODE_ENV === 'development' ? enhanceError.message : undefined
      });
    }

    // Deduct credits only after successful enhancement
    try {
      const { deductCredits } = await import('../utils/credit.utils.js');
      await deductCredits(
        req.user._id,
        CREDITS_COST,
        `Create optimized resume from ATS analysis`,
        { reportId: report._id, templateId },
        'resume_creation'
      );
    } catch (creditError) {
      console.error('Credit deduction error:', creditError);
      return res.status(400).json({
        success: false,
        message: creditError.message || 'Failed to deduct credits'
      });
    }

    // Get or create template
    const Template = (await import('../models/Template.model.js')).default;
    let template;
    
    if (templateId) {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(templateId);
      if (isValidObjectId) {
        template = await Template.findById(templateId);
      } else {
        template = await Template.findOne({ 
          $or: [
            { name: { $regex: new RegExp(`^${templateId}$`, 'i') } },
            { category: { $regex: new RegExp(`^${templateId}$`, 'i') } }
          ],
          isActive: true 
        });
      }
    }
    
    if (!template) {
      template = await Template.findOne({ isActive: true, isDefault: true }) || 
                 await Template.findOne({ isActive: true });
    }

    if (!template || !template.isActive) {
      console.error('Template not found or inactive:', { templateId, foundTemplate: !!template });
      return res.status(400).json({
        success: false,
        message: 'Template not found or inactive. Please select a valid template.'
      });
    }
    
    console.log('Using template:', { templateId: template._id, name: template.name });

    // Get user name for resume title
    const userName = user.name || user.email?.split('@')[0] || 'User';
    const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const resumeTitle = report.targetRole 
      ? `${userName}'s ${report.targetRole} Resume - ${timestamp}`
      : `${userName}'s Optimized Resume - ${timestamp}`;

    // Create the optimized resume
    const resume = await Resume.create({
      userId: req.user._id,
      title: resumeTitle,
      templateId: template._id,
      templateStyle: template.category || 'standard',
      metadata: enhancedMetadata,
      sections: []
    });

    // Get updated user credits
    const updatedUser = await User.findById(req.user._id);

    await resume.populate('templateId', 'name category');

    console.log('Resume created successfully:', { resumeId: resume._id, title: resume.title });
    
    // Return the full resume object (same structure as GET /resumes/:id)
    const resumeResponse = await Resume.findById(resume._id).populate('templateId', 'name category');
    
    res.status(201).json({
      success: true,
      message: 'Optimized resume created successfully',
      data: { 
        resume: resumeResponse || resume, // Return populated resume if available
        creditsRemaining: updatedUser?.credits || 0
      }
    });
  } catch (error) {
    console.error('Create optimized resume error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create optimized resume',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;





