import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productType: { type: String, enum: ['dress', 'jewellery'], required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'productType' },
  name: String,
  image: String,
  price: Number,
  discount: Number,
  finalPrice: Number,
  selectedSize: {
    size: String,
    stock: Number
  },
  quantity: { type: Number, default: 1 },
  total: Number
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  orderType: { type: String, enum: ['single', 'combo', 'gift', 'cart'], required: true },
  giftDetails: {
    message: String,
    recipientName: String,
    recipientEmail: String
  },
  comboDiscount: { type: Number, default: 0 },
  address: {
    name: String,
    email: String,
    mobile: String,
    altMobile: String,
    pincode: String,
    landmark: String,
    city: String,
    state: String,
    address: String
  },
  subtotal: Number,
  totalDiscount: Number,
  coinsApplied: { type: Number, default: 0 },
  finalAmount: Number,
  paymentMethod: { type: String, enum: ['cod', 'online'] },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  orderStatus: { type: String, enum: ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled','Cancelled'], default: 'placed' },
  razorpayOrderId: String,
  createdAt: { type: Date, default: Date.now },
  
  // New fields for returns and coins
  returnRequest: {
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    requestedAt: Date,
    processedAt: Date
  },
  coinsEarned: { type: Number, default: 0 },
  coinsDeducted: { type: Number, default: 0 },
  cancelReason: { type: String },
refundStatus: { type: String, enum: ['pending', 'processed', 'none'], default: 'none' },
giftDetails: {
  message: { type: String, default: '' },
  recipientName: { type: String, default: '' },
  recipientEmail: { type: String, default: '' }
},
});


export default mongoose.model('Order', orderSchema);