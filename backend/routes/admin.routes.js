import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import User from '../models/User.model.js';
import Resume from '../models/Resume.model.js';
import Template from '../models/Template.model.js';
import Payment from '../models/Payment.model.js';
import ATSReport from '../models/ATSReport.model.js';
import CreditTransaction from '../models/CreditTransaction.model.js';
import AdminActivityLog from '../models/AdminActivityLog.model.js';
import { addCredits } from '../utils/credit.utils.js';
import { uploadResume } from '../utils/upload.utils.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * Helper function to log admin activity
 */
const logAdminActivity = async (adminId, action, description, metadata = {}) => {
  try {
    await AdminActivityLog.create({
      adminId,
      action,
      description,
      metadata
    });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
};

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalResumes = await Resume.countDocuments({ isActive: true });
    const totalPayments = await Payment.countDocuments({ status: 'completed' });
    const totalATSReports = await ATSReport.countDocuments();

    // Calculate total revenue
    const completedPayments = await Payment.find({ status: 'completed' });
    const totalRevenue = completedPayments.reduce((sum, payment) => sum + (payment.amount / 100), 0);

    // Calculate total credits issued
    const purchasedCredits = await CreditTransaction.countDocuments({ type: 'purchased' });
    const earnedCredits = await CreditTransaction.countDocuments({ type: { $in: ['earned', 'daily_free'] } });

    // Recent activity
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt');
    const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name email');

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          totalResumes,
          totalPayments,
          totalATSReports,
          totalRevenue,
          purchasedCredits,
          earnedCredits
        },
        recentUsers,
        recentPayments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: {
        users,
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
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details
 * @access  Private (Admin)
 */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const resumeCount = await Resume.countDocuments({ userId: user._id, isActive: true });
    const paymentCount = await Payment.countDocuments({ userId: user._id, status: 'completed' });

    res.json({
      success: true,
      data: {
        user,
        stats: {
          resumeCount,
          paymentCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user and all their data
 * @access  Private (Admin)
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Delete user's resumes
    await Resume.deleteMany({ userId: targetUser._id });

    // Delete user's ATS reports
    await ATSReport.deleteMany({ userId: targetUser._id });

    // Delete user's credit transactions
    await CreditTransaction.deleteMany({ userId: targetUser._id });

    // Delete user's payments
    await Payment.deleteMany({ userId: targetUser._id });

    // Delete the user
    await User.findByIdAndDelete(targetUser._id);

    await logAdminActivity(
      req.user._id,
      'delete_user',
      `Deleted user: ${targetUser.email}`,
      { deletedUserId: targetUser._id, deletedUserEmail: targetUser.email }
    );

    res.json({
      success: true,
      message: 'User and all associated data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id/toggle-status
 * @desc    Toggle user active status (deactivate/activate)
 * @access  Private (Admin)
 */
router.put('/users/:id/toggle-status', async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating yourself
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    await logAdminActivity(
      req.user._id,
      targetUser.isActive ? 'activate_user' : 'deactivate_user',
      `${targetUser.isActive ? 'Activated' : 'Deactivated'} user: ${targetUser.email}`,
      { targetUserId: targetUser._id }
    );

    res.json({
      success: true,
      message: `User ${targetUser.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: targetUser }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/users/:id/credits
 * @desc    Add credits to user
 * @access  Private (Admin)
 */
router.post('/users/:id/credits', [
  body('amount').isInt({ min: 1 }).withMessage('Valid credit amount is required'),
  body('description').optional().trim()
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

    const { amount, description } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await addCredits(
      targetUser._id,
      amount,
      'admin_added',
      description || `Credits added by admin`,
      { adminId: req.user._id.toString() }
    );

    await logAdminActivity(
      req.user._id,
      'add_credits',
      `Added ${amount} credits to user ${targetUser.email}`,
      { targetUserId: targetUser._id, amount }
    );

    const updatedUser = await User.findById(targetUser._id);

    res.json({
      success: true,
      message: 'Credits added successfully',
      data: {
        user: {
          id: updatedUser._id,
          credits: updatedUser.credits
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add credits',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/resumes
 * @desc    Get all resumes
 * @access  Private (Admin)
 */
router.get('/resumes', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const resumes = await Resume.find({ isActive: true })
      .populate('userId', 'name email')
      .populate('templateId', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Resume.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        resumes,
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
      message: 'Failed to fetch resumes',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/templates
 * @desc    Get all templates
 * @access  Private (Admin)
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = await Template.find().populate('createdBy', 'name email').sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { templates }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/templates
 * @desc    Create new template
 * @access  Private (Admin)
 */
router.post('/templates', [
  body('name').notEmpty().withMessage('Template name is required'),
  body('category').isIn(['standard', 'modern', 'minimal', 'professional', 'creative', 'executive']).withMessage('Valid category is required'),
  body('componentCode').notEmpty().withMessage('Component code is required')
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

    const { name, description, category, componentCode, templateStyles, previewImage, isDefault, isBuiltIn } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await Template.updateMany({ isDefault: true }, { isDefault: false });
    }

    const template = await Template.create({
      name,
      description: description || '',
      category,
      componentCode,
      templateStyles: templateStyles || '',
      isBuiltIn: isBuiltIn || false,
      previewImage: previewImage || '',
      isDefault: isDefault || false,
      createdBy: req.user._id
    });

    await logAdminActivity(
      req.user._id,
      'upload_template',
      `Created template: ${name}`,
      { templateId: template._id, name }
    );

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: { template }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Template with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/templates/:id
 * @desc    Update template
 * @access  Private (Admin)
 */
router.put('/templates/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const { name, description, category, componentCode, templateStyles, previewImage, isActive, isDefault, isBuiltIn } = req.body;

    if (name) template.name = name;
    if (description !== undefined) template.description = description;
    if (category) template.category = category;
    if (componentCode) template.componentCode = componentCode;
    if (templateStyles !== undefined) template.templateStyles = templateStyles;
    if (previewImage !== undefined) template.previewImage = previewImage;
    if (isActive !== undefined) template.isActive = isActive;
    if (isBuiltIn !== undefined) template.isBuiltIn = isBuiltIn;
    
    if (isDefault) {
      await Template.updateMany({ isDefault: true, _id: { $ne: template._id } }, { isDefault: false });
      template.isDefault = true;
    }

    await template.save();

    await logAdminActivity(
      req.user._id,
      'update_template',
      `Updated template: ${template.name}`,
      { templateId: template._id }
    );

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: { template }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/templates/:id
 * @desc    Delete template
 * @access  Private (Admin)
 */
router.delete('/templates/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    await Template.findByIdAndDelete(template._id);

    await logAdminActivity(
      req.user._id,
      'delete_template',
      `Deleted template: ${template.name}`,
      { templateId: template._id }
    );

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/payments
 * @desc    Get all payments
 * @access  Private (Admin)
 */
router.get('/payments', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const payments = await Payment.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments();
    const completedPayments = await Payment.find({ status: 'completed' });
    const totalRevenue = completedPayments.reduce((sum, payment) => sum + (payment.amount / 100), 0);

    res.json({
      success: true,
      data: {
        payments,
        totalRevenue,
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
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/cleanup/resumes
 * @desc    Delete all resumes (for clearing fake data)
 * @access  Private (Admin)
 */
router.post('/cleanup/resumes', async (req, res) => {
  try {
    const { confirmPassword } = req.body;

    // Require password confirmation for safety
    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation required'
      });
    }

    // Verify admin password
    const bcrypt = await import('bcryptjs');
    const admin = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(confirmPassword, admin.password);

    if (!isMatch) {
      return res.status(403).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Delete all resumes (hard delete)
    const result = await Resume.deleteMany({});

    // Also delete resume versions
    await ResumeVersion.deleteMany({});

    await logAdminActivity(
      req.user._id,
      'CLEANUP_RESUMES',
      'Deleted all resumes from database',
      { deletedCount: result.deletedCount }
    );

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} resumes`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Cleanup resumes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup resumes',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/cleanup/test-data
 * @desc    Delete all test/fake data (resumes, ATS reports)
 * @access  Private (Admin)
 */
router.post('/cleanup/test-data', async (req, res) => {
  try {
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation required'
      });
    }

    // Verify admin password
    const bcrypt = await import('bcryptjs');
    const admin = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(confirmPassword, admin.password);

    if (!isMatch) {
      return res.status(403).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Delete all resumes
    const resumeResult = await Resume.deleteMany({});
    
    // Delete all resume versions
    const versionResult = await ResumeVersion.deleteMany({});
    
    // Delete all ATS reports
    const atsResult = await ATSReport.deleteMany({});

    await logAdminActivity(
      req.user._id,
      'CLEANUP_TEST_DATA',
      'Deleted all test data from database',
      {
        deletedResumes: resumeResult.deletedCount,
        deletedVersions: versionResult.deletedCount,
        deletedATSReports: atsResult.deletedCount
      }
    );

    res.json({
      success: true,
      message: 'Successfully deleted all test data',
      data: {
        deletedResumes: resumeResult.deletedCount,
        deletedVersions: versionResult.deletedCount,
        deletedATSReports: atsResult.deletedCount
      }
    });
  } catch (error) {
    console.error('Cleanup test data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup test data',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/resumes/:id/hard-delete
 * @desc    Permanently delete a specific resume
 * @access  Private (Admin)
 */
router.delete('/resumes/:id/hard-delete', async (req, res) => {
  try {
    // Validate MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume ID format'
      });
    }

    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Delete resume versions
    await ResumeVersion.deleteMany({ resumeId: req.params.id });

    // Delete resume
    await Resume.findByIdAndDelete(req.params.id);

    await logAdminActivity(
      req.user._id,
      'HARD_DELETE_RESUME',
      `Permanently deleted resume: ${resume.title}`,
      { resumeId: req.params.id, userId: resume.userId }
    );

    res.json({
      success: true,
      message: 'Resume permanently deleted'
    });
  } catch (error) {
    console.error('Hard delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resume',
      error: error.message
    });
  }
});

export default router;





