import mongoose from 'mongoose';

const comboItemSchema = new mongoose.Schema({
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
  selectedSize: {
    size: String,
    stock: Number
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const comboSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['combo', 'gift'],
    required: true
  },
  items: [comboItemSchema],
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },
  recipientName: {
    type: String,
    trim: true
  },
  recipientEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  finalPrice: {
    type: Number,
    default: 0
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'purchased', 'expired'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 7*24*60*60*1000)
  }
});

// ✅ FIXED: Remove pre-save middleware entirely - let controller handle calculations
// No middleware needed - calculations will be done in controller

const Combo = mongoose.model('Combo', comboSchema);
export default Combo;