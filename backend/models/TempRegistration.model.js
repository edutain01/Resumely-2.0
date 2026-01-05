import mongoose from 'mongoose';

const tempRegistrationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  otp: {
    code: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  }
}, {
  timestamps: true
});

// Index for automatic cleanup of expired registrations
tempRegistrationSchema.index({ 'otp.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Clean up expired registrations
tempRegistrationSchema.statics.cleanupExpired = async function() {
  const now = new Date();
  await this.deleteMany({ 'otp.expiresAt': { $lt: now } });
};

const TempRegistration = mongoose.model('TempRegistration', tempRegistrationSchema);

export default TempRegistration;

