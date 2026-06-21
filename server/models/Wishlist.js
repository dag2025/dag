import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema({
  productType: {
    type: String,
    enum: ['dress', 'jewellery'],
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'productType'
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  finalPrice: {
    type: Number,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [wishlistItemSchema],
  totalItems: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// ✅ METHOD 1: Remove pre-save middleware entirely (Simplest)
// Just let the controller handle totalItems calculation
// Remove the pre-save hook completely

// OR

// ✅ METHOD 2: Use pre-save without next() - just return
wishlistSchema.pre('save', function() {
  // Update totalItems before saving
  this.totalItems = this.items.length;
  // No need to call next() - just return
  return;
});

// ✅ METHOD 3: Use function that returns a promise
wishlistSchema.pre('save', function() {
  return new Promise((resolve) => {
    this.totalItems = this.items.length;
    resolve();
  });
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;