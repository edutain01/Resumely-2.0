import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.middleware.js';
import Payment from '../models/Payment.model.js';
import { addCredits } from '../utils/credit.utils.js';

const router = express.Router();

// Initialize Razorpay only if keys are provided (production mode)
// In development mode without keys, we'll use mock payment flow
const isProductionPayment = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;
let razorpay = null;

if (isProductionPayment) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('✅ Razorpay initialized (Production mode)');
} else {
  console.log('⚠️  Razorpay keys not found - Running in Development/Mock payment mode');
}

// All routes require authentication
router.use(authenticate);

/**
 * Credit packages
 */
const CREDIT_PACKAGES = [
  { id: 'basic', credits: 50, amount: 99, name: 'Basic Pack' },
  { id: 'standard', credits: 150, amount: 249, name: 'Standard Pack' },
  { id: 'premium', credits: 300, amount: 449, name: 'Premium Pack' },
  { id: 'enterprise', credits: 1000, amount: 999, name: 'Enterprise Pack' }
];

/**
 * @route   GET /api/payments/packages
 * @desc    Get available credit packages
 * @access  Private
 */
router.get('/packages', (req, res) => {
  res.json({
    success: true,
    data: { packages: CREDIT_PACKAGES }
  });
});

/**
 * @route   POST /api/payments/create-order
 * @desc    Create Razorpay order (or mock order in dev mode)
 * @access  Private
 */
router.post('/create-order', async (req, res) => {
  try {
    const { packageId } = req.body;

    const packageData = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    if (!packageData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package ID'
      });
    }

    // Create order in database
    const order = await Payment.create({
      userId: req.user._id,
      orderId: `order_${Date.now()}_${req.user._id}`,
      razorpayOrderId: isProductionPayment ? '' : `mock_order_${Date.now()}`,
      amount: packageData.amount * 100, // Convert to paise
      credits: packageData.credits,
      status: isProductionPayment ? 'pending' : 'processing'
    });

    if (isProductionPayment && razorpay) {
      // Production mode: Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: packageData.amount * 100, // Amount in paise
        currency: 'INR',
        receipt: order.orderId,
        notes: {
          userId: req.user._id.toString(),
          orderId: order._id.toString(),
          credits: packageData.credits.toString()
        }
      });

      // Update order with Razorpay order ID
      order.razorpayOrderId = razorpayOrder.id;
      order.status = 'pending';
      await order.save();

      res.json({
        success: true,
        data: {
          order: {
            id: order._id,
            orderId: order.orderId,
            razorpayOrderId: razorpayOrder.id,
            amount: packageData.amount,
            credits: packageData.credits,
            key: process.env.RAZORPAY_KEY_ID
          }
        }
      });
    } else {
      // Development mode: Mock order (auto-complete)
      order.razorpayOrderId = `mock_order_${Date.now()}`;
      order.razorpayPaymentId = `mock_payment_${Date.now()}`;
      order.status = 'completed';
      order.verifiedAt = new Date();
      await order.save();

      // Add credits immediately in dev mode
      await addCredits(
        req.user._id,
        order.credits,
        'purchased',
        `Credits purchased via mock payment (Order: ${order.orderId})`,
        { orderId: order._id.toString(), mock: true },
        order._id
      );

      res.json({
        success: true,
        data: {
          order: {
            id: order._id,
            orderId: order.orderId,
            razorpayOrderId: order.razorpayOrderId,
            amount: packageData.amount,
            credits: packageData.credits,
            key: 'mock_key_dev_mode',
            mock: true,
            message: 'Development mode: Payment auto-completed'
          }
        }
      });
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay payment (or auto-verify in dev mode)
 * @access  Private
 */
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Find order
    const order = await Payment.findOne({
      razorpayOrderId: razorpay_order_id || req.body.orderId,
      userId: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'completed') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        data: { order }
      });
    }

    if (isProductionPayment && razorpay) {
      // Production mode: Verify Razorpay signature
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification data is incomplete'
        });
      }

      // Verify signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        order.status = 'failed';
        await order.save();

        return res.status(400).json({
          success: false,
          message: 'Payment verification failed: Invalid signature'
        });
      }

      // Update order status
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
      order.status = 'completed';
      order.verifiedAt = new Date();
      await order.save();

      // Add credits to user
      await addCredits(
        req.user._id,
        order.credits,
        'purchased',
        `Credits purchased via payment (Order: ${order.orderId})`,
        { orderId: order._id.toString() },
        order._id
      );

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          order,
          creditsAdded: order.credits
        }
      });
    } else {
      // Development mode: Auto-verify mock payment
      order.razorpayPaymentId = razorpay_payment_id || `mock_payment_${Date.now()}`;
      order.status = 'completed';
      order.verifiedAt = new Date();
      await order.save();

      // Add credits to user
      await addCredits(
        req.user._id,
        order.credits,
        'purchased',
        `Credits purchased via mock payment (Order: ${order.orderId})`,
        { orderId: order._id.toString(), mock: true },
        order._id
      );

      res.json({
        success: true,
        message: 'Payment verified successfully (Development mode)',
        data: {
          order,
          creditsAdded: order.credits,
          mock: true
        }
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/payments/webhook
 * @desc    Razorpay webhook handler (only works in production mode)
 * @access  Public (but should be verified in production)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!isProductionPayment) {
      // In development mode, skip webhook processing
      console.log('Webhook received but ignored (Development mode)');
      return res.json({ success: true, message: 'Webhook ignored in dev mode' });
    }

    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    // Verify webhook signature
    const text = req.body.toString();
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== webhookSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(text);
    const { event: eventType, payload } = event;

    // Handle payment.captured event
    if (eventType === 'payment.captured') {
      const { order_id, id: payment_id } = payload.payment.entity;

      const order = await Payment.findOne({ razorpayOrderId: order_id });

      if (order && order.status === 'pending') {
        order.razorpayPaymentId = payment_id;
        order.status = 'completed';
        order.verifiedAt = new Date();
        await order.save();

        // Add credits
        await addCredits(
          order.userId,
          order.credits,
          'purchased',
          `Credits purchased via payment (Order: ${order.orderId})`,
          { orderId: order._id.toString() },
          order._id
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * @route   GET /api/payments/history
 * @desc    Get payment history
 * @access  Private
 */
router.get('/history', async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
});

export default router;

