import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkAndAddDailyCredits } from '../utils/credit.utils.js';
import CreditTransaction from '../models/CreditTransaction.model.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/credits/balance
 * @desc    Get current credit balance
 * @access  Private
 */
router.get('/balance', async (req, res) => {
  try {
    const user = await import('../models/User.model.js').then(m => m.default.findById(req.user._id));

    res.json({
      success: true,
      data: {
        credits: user.credits,
        purchasedCredits: user.purchasedCredits,
        earnedCredits: user.earnedCredits
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credit balance',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/credits/transactions
 * @desc    Get credit transaction history
 * @access  Private
 */
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await CreditTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CreditTransaction.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      data: {
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
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/credits/claim-daily
 * @desc    Claim daily free credits
 * @access  Private
 */
router.post('/claim-daily', async (req, res) => {
  try {
    const result = await checkAndAddDailyCredits(req.user._id);

    if (!result.added) {
      return res.status(400).json({
        success: false,
        message: 'Daily credits already claimed today'
      });
    }

    res.json({
      success: true,
      message: `Daily credits claimed: ${result.amount} credits`,
      data: {
        creditsAdded: result.amount,
        totalCredits: result.credits
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

export default router;





