import User from '../models/User.model.js';
import CreditTransaction from '../models/CreditTransaction.model.js';

/**
 * Add credits to user
 */
export const addCredits = async (userId, amount, type, description = '', metadata = {}, paymentId = null) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const balanceBefore = user.credits;
  user.credits += amount;
  
  if (type === 'purchased') {
    user.purchasedCredits += amount;
  } else if (type === 'earned' || type === 'daily_free') {
    user.earnedCredits += amount;
  }
  
  await user.save();

  // Create transaction record
  await CreditTransaction.create({
    userId,
    type,
    amount,
    balanceBefore,
    balanceAfter: user.credits,
    description,
    metadata,
    paymentId,
    relatedTo: paymentId ? 'payment' : type === 'daily_free' ? 'daily_bonus' : 'other'
  });

  return user.credits;
};

/**
 * Deduct credits from user
 */
export const deductCredits = async (userId, amount, description = '', metadata = {}, relatedTo = 'other') => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.credits < amount) {
    throw new Error('Insufficient credits');
  }

  const balanceBefore = user.credits;
  user.credits -= amount;
  await user.save();

  // Create transaction record
  await CreditTransaction.create({
    userId,
    type: 'used',
    amount: -amount,
    balanceBefore,
    balanceAfter: user.credits,
    description,
    metadata,
    relatedTo
  });

  return user.credits;
};

/**
 * Check and add daily free credits
 */
export const checkAndAddDailyCredits = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const dailyFreeCredits = parseInt(process.env.DAILY_FREE_CREDITS || '5');
  
  if (!dailyFreeCredits || dailyFreeCredits <= 0) {
    return { added: false, credits: user.credits };
  }

  const now = new Date();
  const lastDate = user.lastFreeCreditDate ? new Date(user.lastFreeCreditDate) : null;

  // Check if user already received credits today
  if (lastDate) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastCreditDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    
    if (today.getTime() === lastCreditDate.getTime()) {
      return { added: false, credits: user.credits };
    }
  }

  // Add daily credits
  const newCredits = await addCredits(
    userId,
    dailyFreeCredits,
    'daily_free',
    `Daily free credits (${dailyFreeCredits} credits)`,
    { date: now }
  );

  user.lastFreeCreditDate = now;
  await user.save();

  return { added: true, credits: newCredits, amount: dailyFreeCredits };
};





