import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { enhanceResumeContent } from '../utils/gemini.utils.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/enhancement/enhance
 * @desc    Enhance resume content using AI
 * @access  Private
 */
router.post('/enhance', [
  body('resumeData').notEmpty().withMessage('Resume data is required'),
  body('targetRole').notEmpty().withMessage('Target role is required'),
  body('experienceLevel').isIn(['fresher', '1-3', '3-5', '5+']).withMessage('Valid experience level is required')
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

    const { resumeData, targetRole, experienceLevel, industry } = req.body;

    // Optional: Deduct credits for enhancement
    const creditsRequired = parseInt(process.env.ENHANCEMENT_CREDITS_COST || '0');
    
    if (creditsRequired > 0) {
      try {
        const { deductCredits } = await import('../utils/credit.utils.js');
        await deductCredits(
          req.user._id,
          creditsRequired,
          `AI enhancement for ${targetRole}`,
          { targetRole, experienceLevel, industry },
          'ai_enhancement'
        );
      } catch (creditError) {
        return res.status(400).json({
          success: false,
          message: creditError.message || 'Insufficient credits'
        });
      }
    }

    // Enhance content with AI
    const enhancedData = await enhanceResumeContent(resumeData, {
      targetRole,
      experienceLevel,
      industry: industry || ''
    });

    res.json({
      success: true,
      message: 'Resume content enhanced successfully',
      data: { enhancedData }
    });
  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enhance resume content',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/enhancement/section
 * @desc    Enhance a single section using AI
 * @access  Private
 */
router.post('/section', [
  body('sectionType').notEmpty().withMessage('Section type is required'),
  body('sectionData').notEmpty().withMessage('Section data is required'),
  body('targetRole').notEmpty().withMessage('Target role is required'),
  body('experienceLevel').isIn(['fresher', '1-3', '3-5', '5+']).withMessage('Valid experience level is required')
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

    const { sectionType, sectionData, targetRole, experienceLevel, industry } = req.body;

    // Section enhancement is free (0 credits) to encourage users to improve content
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    let prompt = '';
    
    // Create context-specific prompts for different section types
    switch (sectionType) {
      case 'summary':
        prompt = `You are an expert resume writer. Enhance this professional summary to make it more impactful and tailored to the target role.

Target Role: ${targetRole}
Experience Level: ${experienceLevel}
Industry: ${industry || 'General'}

Current Summary:
${sectionData.summary || sectionData.text || ''}

Instructions:
1. Make it more concise and impactful (2-3 sentences max)
2. Use strong action words and quantifiable achievements
3. Tailor it specifically to the ${targetRole} role
4. Highlight key strengths and unique value proposition

Return ONLY the enhanced summary text, no explanations, no markdown.`;
        break;

      case 'experience':
        prompt = `You are an expert resume writer. Enhance this work experience entry to make it more impactful and ATS-friendly.

Target Role: ${targetRole}
Experience Level: ${experienceLevel}
Industry: ${industry || 'General'}

Current Experience:
Title: ${sectionData.title || ''}
Company: ${sectionData.company || ''}
Description: ${sectionData.description || ''}
Achievements: ${(sectionData.achievements || []).join('\n')}

Instructions:
1. Start each bullet with strong action verbs
2. Add quantifiable results where possible (percentages, numbers, metrics)
3. Make it relevant to ${targetRole} position
4. Ensure ATS-friendly language with industry keywords
5. Keep bullets concise (1-2 lines each)

Return ONLY a JSON object with this structure:
{
  "description": "enhanced description",
  "achievements": ["achievement 1", "achievement 2", ...]
}

No markdown, no explanations.`;
        break;

      case 'project':
        prompt = `You are an expert resume writer. Enhance this project description to showcase technical skills and impact.

Target Role: ${targetRole}
Experience Level: ${experienceLevel}

Current Project:
Name: ${sectionData.name || ''}
Description: ${sectionData.description || ''}
Technologies: ${(sectionData.technologies || []).join(', ')}

Instructions:
1. Make the description concise and impactful
2. Highlight technical achievements and problem-solving
3. Include measurable outcomes if possible
4. Emphasize technologies relevant to ${targetRole}

Return ONLY a JSON object with this structure:
{
  "description": "enhanced description"
}

No markdown, no explanations.`;
        break;

      case 'skills':
        prompt = `You are an expert resume writer. Optimize this skills list for the target role.

Target Role: ${targetRole}
Experience Level: ${experienceLevel}
Industry: ${industry || 'General'}

Current Skills:
${Array.isArray(sectionData) ? sectionData.join(', ') : sectionData}

Instructions:
1. Prioritize skills most relevant to ${targetRole}
2. Remove overly generic skills
3. Group related skills together
4. Include industry-standard terminology
5. Return 10-15 most impactful skills

Return ONLY a JSON array of skills:
["skill1", "skill2", ...]

No markdown, no explanations.`;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported section type for enhancement'
        });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let enhancedData;
    
    // For JSON responses (experience, project, skills)
    if (['experience', 'project', 'skills'].includes(sectionType)) {
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        enhancedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to extract JSON from AI response');
      }
    } else {
      // For text responses (summary)
      enhancedData = text.trim();
    }

    res.json({
      success: true,
      message: 'Section enhanced successfully',
      data: { enhancedData }
    });
  } catch (error) {
    console.error('Section enhancement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enhance section',
      error: error.message
    });
  }
});

export default router;





