import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  otp: {
    type: String,
    select: false
  },
  otpExpiry: {
    type: Date,
    select: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Add these fields to your userSchema
lastLogin: { type: Date },
isActive: { type: Boolean, default: true },
username: { type: String, unique: true, sparse: true },
  // Add this field to your existing userSchema
coins: { type: Number, default: 0 },
}, {
  timestamps: true
});

// NO PRE-SAVE MIDDLEWARE - We'll hash in the controller

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('comparePassword called');
    console.log('Candidate password:', candidatePassword);
    console.log('Stored hash:', this.password);
    
    if (!this.password) {
      console.log('No password stored');
      return false;
    }
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('bcrypt compare result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error in comparePassword:', error);
    return false;
  }
};

const User = mongoose.model('User', userSchema);
export default User;