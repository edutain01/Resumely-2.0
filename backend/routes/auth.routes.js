import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.model.js';
import TempRegistration from '../models/TempRegistration.model.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { generateToken, setTokenCookie, clearTokenCookie } from '../utils/jwt.utils.js';
import { checkAndAddDailyCredits } from '../utils/credit.utils.js';
import { sendOTPEmail } from '../utils/email.utils.js';
import passport from '../utils/passport.utils.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * @route   POST /api/auth/send-registration-otp
 * @desc    Send OTP for registration
 * @access  Public
 */
router.post('/send-registration-otp', [
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

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store password in plain text temporarily (will be hashed by User model on creation)
    // Note: In production, consider encrypting this or using a more secure temporary storage
    const userName = (name && name.trim()) ? name.trim() : email.split('@')[0]; // Use email prefix if name not provided
    await TempRegistration.findOneAndUpdate(
      { email },
      {
        email,
        name: userName,
        password: password, // Store plain password - User model will hash it
        otp: {
          code: otpCode,
          expiresAt
        },
        attempts: 0
      },
      { upsert: true, new: true }
    );

    // Send OTP email and wait for result
    try {
      await sendOTPEmail(email, otpCode);
      console.log(`✅ OTP email sent to ${email}`);
      res.json({
        success: true,
        message: 'OTP sent to your email. Please check your inbox.'
      });
    } catch (emailError) {
      console.error(`❌ Failed to send OTP email to ${email}:`, emailError.message);
      // Delete the temp registration since email failed
      await TempRegistration.deleteOne({ email });
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please check your email address and try again.'
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/verify-registration-otp
 * @desc    Verify OTP and complete registration
 * @access  Public
 */
router.post('/verify-registration-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
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

    const { email, otp } = req.body;

    // Find temporary registration
    const tempRegistration = await TempRegistration.findOne({ email });
    if (!tempRegistration) {
      return res.status(400).json({
        success: false,
        message: 'No registration found. Please start the registration process again.'
      });
    }

    // Check if OTP has expired
    if (new Date() > tempRegistration.otp.expiresAt) {
      await TempRegistration.deleteOne({ email });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check attempts
    if (tempRegistration.attempts >= 5) {
      await TempRegistration.deleteOne({ email });
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please start the registration process again.'
      });
    }

    // Verify OTP
    if (tempRegistration.otp.code !== otp) {
      tempRegistration.attempts += 1;
      await tempRegistration.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.',
        attemptsRemaining: 5 - tempRegistration.attempts
      });
    }

    // Check if user already exists (double check)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await TempRegistration.deleteOne({ email });
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = await User.create({
      name: tempRegistration.name,
      email: tempRegistration.email,
      password: tempRegistration.password,
      emailVerified: true
    });

    // Delete temporary registration
    await TempRegistration.deleteOne({ email });

    // Generate token
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'User account creation is complete',
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
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/resend-registration-otp
 * @desc    Resend OTP for registration
 * @access  Public
 */
router.post('/resend-registration-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
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

    const { email } = req.body;

    // Find temporary registration
    const tempRegistration = await TempRegistration.findOne({ email });
    if (!tempRegistration) {
      return res.status(400).json({
        success: false,
        message: 'No registration found. Please start the registration process again.'
      });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update OTP
    tempRegistration.otp = {
      code: otpCode,
      expiresAt
    };
    tempRegistration.attempts = 0;
    await tempRegistration.save();

    // Send OTP email and wait for result
    try {
      await sendOTPEmail(email, otpCode);
      console.log(`✅ OTP resent to ${email}`);
      res.json({
        success: true,
        message: 'OTP resent to your email. Please check your inbox.'
      });
    } catch (emailError) {
      console.error(`❌ Failed to resend OTP to ${email}:`, emailError.message);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
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

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Login attempt for email:', normalizedEmail);

    // Find user and include password for comparison
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      console.log('User not found for email:', normalizedEmail);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('User found:', { id: user._id, email: user.email, hasPassword: !!user.password });

    // Check if user has a password (OAuth users might not have passwords)
    if (!user.password) {
      console.log('User has no password (OAuth account)');
      return res.status(401).json({
        success: false,
        message: 'This account was created with social login. Please use Google or GitHub to sign in.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('User account is deactivated');
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    console.log('Verifying password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', normalizedEmail);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('Login successful for user:', normalizedEmail);

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
router.get('/google', (req, res, next) => {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    if (err) {
      console.error('Google OAuth error:', err);
      return res.redirect(`${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(err.message || 'Authentication failed')}`);
    }
    
    if (!user) {
      console.error('Google OAuth - no user returned:', info);
      return res.redirect(`${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(info?.message || 'No user found')}`);
    }
    
    try {
      // Check and add daily credits
      try {
        await checkAndAddDailyCredits(user._id);
      } catch (creditError) {
        console.error('Daily credits error (non-fatal):', creditError.message);
      }
      
      const updatedUser = await User.findById(user._id);
      const token = generateToken(updatedUser._id);
      setTokenCookie(res, token);

      res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=google`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  })(req, res, next);
});

/**
 * @route   GET /api/auth/github
 * @desc    Initiate GitHub OAuth
 * @access  Public
 */
router.get('/github', (req, res, next) => {
  // Check if GitHub OAuth is configured
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?error=github_not_configured`);
  }
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

/**
 * @route   GET /api/auth/github/callback
 * @desc    GitHub OAuth callback
 * @access  Public
 */
router.get('/github/callback', (req, res, next) => {
  passport.authenticate('github', { session: false }, async (err, user, info) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    if (err) {
      console.error('GitHub OAuth error:', err);
      return res.redirect(`${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(err.message || 'Authentication failed')}`);
    }
    
    if (!user) {
      console.error('GitHub OAuth - no user returned:', info);
      return res.redirect(`${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(info?.message || 'No user found')}`);
    }
    
    try {
      // Check and add daily credits
      try {
        await checkAndAddDailyCredits(user._id);
      } catch (creditError) {
        console.error('Daily credits error (non-fatal):', creditError.message);
      }
      
      const updatedUser = await User.findById(user._id);
      const token = generateToken(updatedUser._id);
      setTokenCookie(res, token);

      res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=github`);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  })(req, res, next);
});

export default router;





