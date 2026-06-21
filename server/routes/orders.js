import express from 'express';
import Order from '../models/Order.js';
import Address from '../models/Address.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = express.Router();

let razorpay = null;
// Initialize Razorpay only if keys are present
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log(' Razorpay initialized');
} else {
  console.warn('Razorpay keys missing – online payments disabled');
}

// Get user addresses
router.get('/addresses', authenticate, async (req, res) => {
  try {
    console.log(` Fetching addresses for user: ${req.user._id}`);
    const addresses = await Address.find({ userId: req.user._id });
    console.log(` Found ${addresses.length} addresses`);
    res.json({ success: true, addresses });
  } catch (error) {
    console.error(' Error fetching addresses:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new address
router.post('/addresses', authenticate, async (req, res) => {
  try {
    console.log(` Adding new address for user: ${req.user._id}`);
    console.log('Address data:', req.body);
    
    const addressData = { ...req.body, userId: req.user._id };
    const address = await Address.create(addressData);
    
    console.log(` Address added successfully: ${address._id}`);
    res.json({ success: true, address });
  } catch (error) {
    console.error(' Error adding address:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update address
router.put('/addresses/:id', authenticate, async (req, res) => {
  try {
    console.log(`Updating address: ${req.params.id} for user: ${req.user._id}`);
    
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    
    if (!address) {
      console.log(' Address not found');
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    console.log(` Address updated successfully`);
    res.json({ success: true, address });
  } catch (error) {
    console.error(' Error updating address:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete address
router.delete('/addresses/:id', authenticate, async (req, res) => {
  try {
    console.log(` Deleting address: ${req.params.id} for user: ${req.user._id}`);
    
    const result = await Address.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!result) {
      console.log(' Address not found');
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    console.log(` Address deleted successfully`);
    res.json({ success: true });
  } catch (error) {
    console.error(' Error deleting address:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Then update your POST route:
router.post('/', authenticate, async (req, res) => {
  try {
    const orderData = { ...req.body, userId: req.user._id };
    console.log('📦 Creating order with data:', {
      type: orderData.orderType,
      hasGiftDetails: !!orderData.giftDetails,
      giftDetails: orderData.giftDetails,
      coinsApplied: orderData.coinsApplied
    });
    
    // Deduct applied coins from user's balance
    if (orderData.coinsApplied && orderData.coinsApplied > 0) {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      if (user.coins < orderData.coinsApplied) {
        return res.status(400).json({ success: false, message: 'Insufficient coins' });
      }
      await User.findByIdAndUpdate(req.user._id, { $inc: { coins: -orderData.coinsApplied } });
      console.log(` Deducted ${orderData.coinsApplied} coins from user ${req.user._id}`);
    }
    
    const order = await Order.create(orderData);
    
    console.log(' Order created with gift details:', order.giftDetails);
    res.json({ success: true, order });
  } catch (error) {
    console.error(' Error creating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Razorpay order
router.post('/create-razorpay-order', authenticate, async (req, res) => {
  if (!razorpay) {
    console.log(' Online payments not configured');
    return res.status(503).json({ 
      success: false, 
      message: 'Online payments not configured' 
    });
  }
  try {
    const { amount } = req.body;
    console.log(`💳 Creating Razorpay order for amount: ₹${amount}`);
    
    const options = {
      amount: Math.round(amount * 100), // in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };
    const order = await razorpay.orders.create(options);
    
    console.log(` Razorpay order created: ${order.id}`);
    res.json({ success: true, order });
  } catch (error) {
    console.error(' Razorpay order creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify Razorpay payment and create order
router.post('/verify-payment', authenticate, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData
    } = req.body;

    console.log(`Verifying Razorpay payment: ${razorpay_payment_id}`);

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.log('Invalid payment signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    console.log(' Payment signature verified');

    // Create order in database
    const order = await Order.create({
      ...orderData,
      userId: req.user._id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'paid'
    });

    console.log(` Order created with payment: ${order._id}`);
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error(' Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user orders - FIXED: Now includes all fields
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    console.log(` Fetching orders for user: ${req.user._id}`);
    
  const orders = await Order.find({ userId: req.user._id })
  .populate({
    path: 'items.productId',
    select: 'category name price finalPrice images'
  })
  .sort({ createdAt: -1 })
  .lean();
    
    console.log(` Found ${orders.length} orders`);
    
    // Debug each order
    orders.forEach((order, index) => {
      console.log(`\n Order ${index + 1}:`);
      console.log(`  ID: ${order._id}`);
      console.log(`  Type: ${order.orderType}`);
      console.log(`  Status: ${order.orderStatus}`);
      console.log(`  Payment: ${order.paymentMethod} (${order.paymentStatus})`);
      
      if (order.orderType === 'gift') {
        console.log(`  Gift Details:`, order.giftDetails || 'NOT FOUND');
        if (!order.giftDetails) {
          console.log(`   WARNING: Gift order has no giftDetails!`);
        }
      }
      
      console.log(`  Items: ${order.items?.length || 0}`);
      console.log(`  Total: ₹${order.finalAmount}`);
    });
    
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel entire order - FIXED: Case-insensitive status check
router.put('/:orderId/cancel', authenticate, async (req, res) => {
  try {
    console.log(` Cancelling order: ${req.params.orderId} for user: ${req.user._id}`);
    
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      userId: req.user._id 
    });
    
    if (!order) {
      console.log(' Order not found');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    console.log(`Order current status: "${order.orderStatus}"`);
    
    // Case-insensitive check
    const currentStatus = order.orderStatus?.toLowerCase() || '';
    if (!['placed', 'confirmed'].includes(currentStatus)) {
      console.log(` Cannot cancel - current status: ${order.orderStatus}`);
      return res.status(400).json({ 
        success: false, 
        message: `Order cannot be cancelled at ${order.orderStatus} stage` 
      });
    }
    
    order.orderStatus = 'Cancelled';
    await order.save();
    
    console.log(` Order cancelled successfully`);
    res.json({ success: true, order });
  } catch (error) {
    console.error(' Error cancelling order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel single item - FIXED: Better error handling
router.put('/:orderId/cancel-item', authenticate, async (req, res) => {
  try {
    const { itemId } = req.body;
    console.log(`Cancelling item ${itemId} from order: ${req.params.orderId}`);
    
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      userId: req.user._id 
    });

    if (!order) {
      console.log('Order not found');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentStatus = order.orderStatus?.toLowerCase() || '';
    if (!['placed', 'confirmed'].includes(currentStatus)) {
      console.log(` Cannot cancel item - order status: ${order.orderStatus}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel item after shipping' 
      });
    }

    // Find the item
    const itemIndex = order.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      console.log(' Item not found in order');
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    console.log(`Removing item: ${order.items[itemIndex].name}`);

    // Remove the item
    order.items.splice(itemIndex, 1);
    
    // Recalculate totals
    order.subtotal = order.items.reduce((sum, i) => sum + (i.finalPrice * i.quantity), 0);
    order.finalAmount = order.subtotal - (order.coinsApplied / 10);

    if (order.items.length === 0) {
      console.log('No items left, cancelling entire order');
      order.orderStatus = 'cancelled';
    }

    await order.save();
    console.log(` Item cancelled successfully. Remaining items: ${order.items.length}`);
    res.json({ success: true, order });
  } catch (error) {
    console.error(' Error cancelling item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Return order - FIXED: Better validation
router.post('/:orderId/return', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    console.log(` Return request for order: ${req.params.orderId}`);
    console.log(`Reason: "${reason}" (length: ${reason?.length || 0})`);
    
    if (!reason || reason.length < 10) {
      console.log(' Reason too short');
      return res.status(400).json({ 
        success: false, 
        message: 'Reason must be at least 10 characters' 
      });
    }
    
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      userId: req.user._id 
    });
    
    if (!order) {
      console.log(' Order not found');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    console.log(`Order status: "${order.orderStatus}"`);
    
    if (order.orderStatus?.toLowerCase() !== 'delivered') {
      console.log(` Cannot return - status: ${order.orderStatus}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Only delivered orders can be returned' 
      });
    }
    
    order.returnRequest = {
      reason,
      status: 'pending',
      requestedAt: new Date()
    };
    await order.save();
    
    console.log(` Return request submitted successfully`);
    res.json({ success: true, order });
  } catch (error) {
    console.error(' Error submitting return:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order address - FIXED: Case-insensitive check
router.put('/:orderId/address', authenticate, async (req, res) => {
  try {
    console.log(` Updating address for order: ${req.params.orderId}`);
    console.log('New address:', req.body);
    
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      userId: req.user._id 
    });
    
    if (!order) {
      console.log(' Order not found');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const currentStatus = order.orderStatus?.toLowerCase() || '';
    if (!['placed', 'confirmed'].includes(currentStatus)) {
      console.log(` Cannot update address - order status: ${order.orderStatus}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Address cannot be updated after shipping' 
      });
    }
    
    order.address = req.body;
    await order.save();
    
    console.log(` Address updated successfully`);
    res.json({ success: true, order });
  } catch (error) {
    console.error(' Error updating address:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update gift details - FIXED: Better logging
router.put('/:orderId/gift-details', authenticate, async (req, res) => {
  try {
    console.log(` Updating gift details for order: ${req.params.orderId}`);
    console.log('Gift details:', req.body);
    
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      userId: req.user._id 
    });

    if (!order) {
      console.log(' Order not found');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    console.log(`Order type: ${order.orderType}`);

    if (order.orderType !== 'gift') {
      console.log(' Not a gift order');
      return res.status(400).json({ 
        success: false, 
        message: 'Not a gift order' 
      });
    }

    const currentStatus = order.orderStatus?.toLowerCase() || '';
    if (!['placed', 'confirmed'].includes(currentStatus)) {
      console.log(` Cannot update - order status: ${order.orderStatus}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot update gift details after shipping' 
      });
    }

    order.giftDetails = req.body;
    await order.save();
    
    console.log(` Gift details updated successfully`);
    console.log('Updated gift details:', order.giftDetails);
    
    res.json({ success: true, order });
  } catch (error) {
    console.error(' Error updating gift details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark order as delivered and award coins
router.put('/:orderId/deliver', authenticate, async (req, res) => {
  try {
    console.log(` Marking order as delivered: ${req.params.orderId}`);
    
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      userId: req.user._id 
    });

    if (!order) {
      console.log(' Order not found');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    console.log(`Current status: ${order.orderStatus}`);

    if (order.orderStatus?.toLowerCase() !== 'shipped') {
      console.log(` Cannot deliver - status: ${order.orderStatus}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Order must be shipped first' 
      });
    }

    // Calculate coins earned (10 coins per ₹100 spent)
    const coinsEarned = Math.floor(order.finalAmount / 100) * 10;
    console.log(`Coins to award: ${coinsEarned}`);
    
    order.orderStatus = 'delivered';
    order.coinsEarned = coinsEarned;

    // Add coins to user
    await User.findByIdAndUpdate(req.user._id, { $inc: { coins: coinsEarned } });
    console.log(` Coins awarded to user: ${req.user._id}`);

    await order.save();
    
    console.log(` Order delivered successfully`);
    res.json({ 
      success: true, 
      message: `Order delivered! You earned ${coinsEarned} coins.`,
      order 
    });
  } catch (error) {
    console.error(' Error delivering order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process return request (approve/reject)
router.post('/:orderId/process-return', authenticate, async (req, res) => {
  try {
    const { approve } = req.body;
    console.log(` Processing return for order: ${req.params.orderId}, approve: ${approve}`);
    
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      userId: req.user._id 
    });

    if (!order) {
      console.log(' Order not found');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    console.log(`Order status: ${order.orderStatus}`);
    console.log(`Return request:`, order.returnRequest);

    if (order.orderStatus?.toLowerCase() !== 'delivered') {
      console.log(` Cannot process return - status: ${order.orderStatus}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Only delivered orders can be processed for return' 
      });
    }

    if (!order.returnRequest || order.returnRequest.status !== 'pending') {
      console.log(' No pending return request');
      return res.status(400).json({ 
        success: false, 
        message: 'No pending return request' 
      });
    }

    if (approve) {
      // Deduct coins if they were earned
      if (order.coinsEarned > 0) {
        console.log(`Deducting ${order.coinsEarned} coins from user`);
        await User.findByIdAndUpdate(req.user._id, { $inc: { coins: -order.coinsEarned } });
        order.coinsDeducted = order.coinsEarned;
      }
      order.returnRequest.status = 'approved';
    } else {
      order.returnRequest.status = 'rejected';
    }

    order.returnRequest.processedAt = new Date();
    await order.save();

    console.log(` Return request ${approve ? 'approved' : 'rejected'}`);
    res.json({ 
      success: true, 
      message: approve ? 'Return approved' : 'Return rejected',
      order 
    });
  } catch (error) {
    console.error(' Error processing return:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Change payment method
router.put('/:orderId/payment-method', authenticate, async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    console.log(` Changing payment method for order: ${req.params.orderId} to: ${paymentMethod}`);
    
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      userId: req.user._id 
    });

    if (!order) {
      console.log(' Order not found');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentStatus = order.orderStatus?.toLowerCase() || '';
    if (!['placed', 'confirmed'].includes(currentStatus)) {
      console.log(` Cannot change payment - order status: ${order.orderStatus}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change payment method after shipping' 
      });
    }

    order.paymentMethod = paymentMethod;
    await order.save();

    console.log(` Payment method updated successfully`);
    res.json({ success: true, order });
  } catch (error) {
    console.error(' Error changing payment method:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug endpoint - Get single order details
router.get('/debug/:orderId', authenticate, async (req, res) => {
  try {
    console.log(` Debug endpoint: Fetching order ${req.params.orderId}`);
    
    const order = await Order.findById(req.params.orderId).lean();
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const debug = {
      id: order._id,
      type: order.orderType,
      status: order.orderStatus,
      hasGiftDetails: !!order.giftDetails,
      giftDetails: order.giftDetails,
      itemsCount: order.items?.length,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      raw: order
    };

    console.log('Debug info:', debug);
    res.json({ success: true, debug });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});
// Verify payment and update order payment method
router.post('/verify-payment-update', authenticate, async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    console.log(` Verifying payment update for order: ${orderId}`);

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.log(' Invalid payment signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Find and update the order
    const order = await Order.findOne({
      _id: orderId,
      userId: req.user._id
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update payment details
    order.paymentMethod = 'online';
    order.paymentStatus = 'paid';
    order.razorpayOrderId = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;

    await order.save();

    console.log(` Order ${orderId} updated to paid online payment`);
    res.json({ success: true, order });
  } catch (error) {
    console.error(' Payment verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// Delete return request
router.delete('/:orderId/return', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      userId: req.user._id 
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.returnRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'No return request found' 
      });
    }

    order.returnRequest = undefined;
    await order.save();

    res.json({ success: true, message: 'Return request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin cancel order with reason
router.put('/admin/:orderId/cancel', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = 'cancelled';
    order.cancelReason = reason || 'Cancelled by admin';
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
export default router;