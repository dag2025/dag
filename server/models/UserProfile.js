import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  searchHistory: [{
    query: String,
    filters: {
      category: String,
      occasion: String,
      color: String,
      minPrice: Number,
      maxPrice: Number
    },
    timestamp: { type: Date, default: Date.now }
  }],
  recentSearches: [{
    type: String,
    maxlength: 50
  }],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('UserProfile', userProfileSchema);