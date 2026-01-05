import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/resumly';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Delete existing admin if exists
    await User.deleteOne({ email: 'admin@resumely.com' });

    // Create new admin user using the model (this will hash password properly)
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@resumely.com',
      password: '12345678',
      role: 'admin',
      isActive: true,
      credits: 1000,
      purchasedCredits: 0,
      earnedCredits: 1000
    });

    console.log('✓ Admin account created successfully!');
    console.log('Admin ID:', admin._id);

    console.log('\n=== Admin Login Credentials ===');
    console.log('Email: admin@resumely.com');
    console.log('Password: 12345678');
    console.log('================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
