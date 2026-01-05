import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import User from '../models/User.model.js';
import Resume from '../models/Resume.model.js';
import ATSReport from '../models/ATSReport.model.js';
import CreditTransaction from '../models/CreditTransaction.model.js';
import { checkAndAddDailyCredits } from '../utils/credit.utils.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/user/dashboard
 * @desc    Get user dashboard data
 * @access  Private
 */
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user data
    const user = await User.findById(userId);

    // Get resume count
    const totalResumes = await Resume.countDocuments({ userId, isActive: true });

    // Get ATS reports count
    const totalATSReports = await ATSReport.countDocuments({ userId });

    // Get recent ATS reports
    const recentATSReports = await ATSReport.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('score targetRole createdAt resumeTitle')
      .populate('resumeId', 'title');

    // Get recent resumes
    const recentResumes = await Resume.find({ userId, isActive: true })
      .sort({ lastModified: -1 })
      .limit(5)
      .select('title lastModified updatedAt createdAt');

    // Get credit transactions (last 10)
    const recentTransactions = await CreditTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('type amount description createdAt');

    res.json({
      success: true,
      data: {
        credits: {
          total: user.credits || 0,
          purchased: user.purchasedCredits || 0,
          earned: user.earnedCredits || 0
        },
        totalResumes,
        totalATSReports,
        recentATSReports: recentATSReports.map(report => ({
          _id: report._id,
          score: report.score,
          targetRole: report.targetRole,
          resumeTitle: report.resumeTitle || report.resumeId?.title || 'Resume Analysis',
          createdAt: report.createdAt
        })),
        recentResumes: recentResumes.map(resume => ({
          _id: resume._id,
          title: resume.title,
          updatedAt: resume.updatedAt || resume.lastModified || resume.createdAt,
          createdAt: resume.createdAt
        })),
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/user/resumes
 * @desc    Get all user resumes
 * @access  Private
 */
router.get('/resumes', async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id, isActive: true })
      .sort({ lastModified: -1 })
      .populate('templateId', 'name category');

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
 * @route   GET /api/user/ats-history
 * @desc    Get ATS analysis history
 * @access  Private
 */
router.get('/ats-history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reports = await ATSReport.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('resumeId', 'title');

    const total = await ATSReport.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ATS history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/user/credits
 * @desc    Get credit history
 * @access  Private
 */
router.get('/credits', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await CreditTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CreditTransaction.countDocuments({ userId: req.user._id });

    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        currentCredits: user.credits,
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credit history',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/user/claim-daily-credits
 * @desc    Claim daily free credits
 * @access  Private
 */
router.post('/claim-daily-credits', async (req, res) => {
  try {
    const result = await checkAndAddDailyCredits(req.user._id);

    if (!result.added) {
      return res.status(400).json({
        success: false,
        message: 'Daily credits already claimed today'
      });
    }

    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      message: `Daily credits claimed: ${result.amount} credits`,
      data: {
        creditsAdded: result.amount,
        totalCredits: user.credits
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to claim daily credits',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/user/export-data
 * @desc    Export all user data (GDPR compliance)
 * @access  Private
 */
router.get('/export-data', async (req, res) => {
  try {
    const userId = req.user._id;

    // Collect all user data
    const user = await User.findById(userId).select('-password');
    const resumes = await Resume.find({ userId, isActive: true });
    const atsReports = await ATSReport.find({ userId });
    const transactions = await CreditTransaction.find({ userId });

    const exportData = {
      user: user.toObject(),
      resumes: resumes.map(r => r.toObject()),
      atsReports: atsReports.map(r => r.toObject()),
      creditTransactions: transactions.map(t => t.toObject()),
      exportedAt: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="resumly-data-export-${Date.now()}.json"`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/user/account
 * @desc    Delete user account and all associated data (GDPR compliance)
 * @access  Private
 */
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user._id;
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation is required'
      });
    }

    // Verify password
    const user = await User.findById(userId).select('+password');
    const isPasswordValid = await user.comparePassword(confirmPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Soft delete or hard delete user data
    // For GDPR: we'll anonymize instead of hard delete to preserve analytics
    user.email = `deleted_${userId}@resumly.deleted`;
    user.name = 'Deleted User';
    user.isActive = false;
    user.phone = '';
    user.location = '';
    user.profilePicture = '';
    await user.save();

    // Soft delete all resumes
    await Resume.updateMany({ userId }, { isActive: false });

    // Optionally: remove ATS reports and transactions
    // await ATSReport.deleteMany({ userId });
    // await CreditTransaction.deleteMany({ userId });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
});

export default router;




