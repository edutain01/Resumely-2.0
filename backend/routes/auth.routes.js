import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.model.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { generateToken, setTokenCookie, clearTokenCookie } from '../utils/jwt.utils.js';
import { checkAndAddDailyCredits } from '../utils/credit.utils.js';
import passport from '../utils/passport.utils.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate token
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          credits: user.credits
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check and add daily credits (don't fail login if this fails)
    try {
      await checkAndAddDailyCredits(user._id);
    } catch (creditError) {
      console.error('Daily credits error (non-fatal):', creditError.message);
    }
    
    // Refresh user data to get updated credits
    const updatedUser = await User.findById(user._id);

    // Generate token
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          credits: updatedUser.credits,
          purchasedCredits: updatedUser.purchasedCredits,
          earnedCredits: updatedUser.earnedCredits
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, (req, res) => {
  clearTokenCookie(res);
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          credits: user.credits,
          purchasedCredits: user.purchasedCredits,
          earnedCredits: user.earnedCredits
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth
 * @access  Public
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', passport.authenticate('google', { session: false }), async (req, res) => {
  try {
    const user = req.user;
    
    // Check and add daily credits
    try {
      await checkAndAddDailyCredits(user._id);
    } catch (creditError) {
      console.error('Daily credits error (non-fatal):', creditError.message);
    }
    
    const updatedUser = await User.findById(user._id);
    const token = generateToken(updatedUser._id);
    setTokenCookie(res, token);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=google`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});

/**
 * @route   GET /api/auth/github
 * @desc    Initiate GitHub OAuth
 * @access  Public
 */
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

/**
 * @route   GET /api/auth/github/callback
 * @desc    GitHub OAuth callback
 * @access  Public
 */
router.get('/github/callback', passport.authenticate('github', { session: false }), async (req, res) => {
  try {
    const user = req.user;
    
    // Check and add daily credits
    try {
      await checkAndAddDailyCredits(user._id);
    } catch (creditError) {
      console.error('Daily credits error (non-fatal):', creditError.message);
    }
    
    const updatedUser = await User.findById(user._id);
    const token = generateToken(updatedUser._id);
    setTokenCookie(res, token);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=github`);
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});

export default router;





