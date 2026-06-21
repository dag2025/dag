import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
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
    required: true,
    min: 1,
    default: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0
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
  estimatedCoins: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// ✅ METHOD 1: Remove pre-save middleware and calculate in controller
// (Simplest solution - I recommend this)
// Just remove the pre-save middleware entirely

// OR

// ✅ METHOD 2: Use pre-save without next() - just return
cartSchema.pre('save', function() {
  // Calculate cart totals
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalPrice = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.totalDiscount = this.items.reduce((sum, item) => 
    sum + ((item.price - item.finalPrice) * item.quantity), 0);
  this.finalPrice = this.items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
  this.estimatedCoins = Math.floor(this.finalPrice / 100) * 10; // 10 coins per 1000 spent
  
  // No need to call next() - just return
  return;
});

// ✅ METHOD 3: Use function that returns a promise (if you need async)
cartSchema.pre('save', function() {
  return new Promise((resolve) => {
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.totalPrice = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.totalDiscount = this.items.reduce((sum, item) => 
      sum + ((item.price - item.finalPrice) * item.quantity), 0);
    this.finalPrice = this.items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    this.estimatedCoins = Math.floor(this.finalPrice / 100) * 10;
    resolve();
  });
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;