import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Review from '../models/Review.js'
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));
// Get dashboard stats
router.get('/dashboard/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [totalUsers, totalOrders, totalDresses, totalJewellery, totalAds] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(),
      Dress.countDocuments(),
      Jewellery.countDocuments(),
      Ad.countDocuments()
    ]);

    const revenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        totalDresses,
        totalJewellery,
        totalAds,
        totalRevenue: revenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Get all orders with user details
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order status
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // If order is being delivered, award coins
    if (status === 'delivered' && order.orderStatus !== 'delivered') {
      const coinsEarned = Math.floor(order.finalAmount / 100) * 10;
      await User.findByIdAndUpdate(order.userId, { $inc: { coins: coinsEarned } });
    }

    order.orderStatus = status;
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel order with reason
router.post('/orders/:orderId/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = 'cancelled';
    order.cancelReason = reason;
    
    // If payment was made, record for refund
    if (order.paymentStatus === 'paid') {
      order.refundStatus = 'pending';
    }
    
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete order (admin only)
router.delete('/orders/:orderId', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.orderId);
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get order statistics
router.get('/orders/stats', async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$orderStatus', 'placed'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$finalAmount', 0] } }
        }
      }
    ]);

    res.json({ success: true, stats: stats[0] || { total: 0, pending: 0, delivered: 0, cancelled: 0, revenue: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Process return request (approve/reject)
router.post('/orders/:orderId/process-return', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { approve, reason } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.returnRequest || order.returnRequest.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'No pending return request found' 
      });
    }

    if (approve) {
      // Deduct coins if they were earned
      if (order.coinsEarned > 0) {
        await User.findByIdAndUpdate(order.userId, { $inc: { coins: -order.coinsEarned } });
        order.coinsDeducted = order.coinsEarned;
      }
      order.returnRequest.status = 'approved';
      
      // If online payment, mark for refund
      if (order.paymentMethod === 'online' && order.paymentStatus === 'paid') {
        order.refundStatus = 'pending';
      }
    } else {
      order.returnRequest.status = 'rejected';
      order.returnRequest.rejectionReason = reason;
    }

    order.returnRequest.processedAt = new Date();
    order.returnRequest.processedBy = req.user._id;
    await order.save();

    res.json({ 
      success: true, 
      message: approve ? 'Return approved' : 'Return rejected',
      order 
    });
  } catch (error) {
    console.error('Process return error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('admin'));

// Get all users with their stats
router.get('/users', async (req, res) => {
  try {
    console.log('Fetching all users for admin...');
    
    // Get all users without sensitive data
    const users = await User.find()
      .select('-password -otp -otpExpiry -__v')
      .lean();

    console.log(` Found ${users.length} users`);

    // Get review counts for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      try {
        const reviewCount = await Review.countDocuments({ userId: user._id });
        
        // Get user's order count (optional)
        const orderCount = await Order.countDocuments({ userId: user._id });
        
        // Determine if user is active (based on recent login or orders)
        const isActive = orderCount > 0 || (user.lastLogin && 
          (new Date() - new Date(user.lastLogin)) < 30 * 24 * 60 * 60 * 1000); // 30 days

        return {
          ...user,
          reviewCount,
          orderCount,
          isActive,
          createdAt: user.createdAt || user._id.getTimestamp()
        };
      } catch (err) {
        console.error(`Error processing user ${user._id}:`, err);
        return {
          ...user,
          reviewCount: 0,
          orderCount: 0,
          isActive: false,
          createdAt: user.createdAt || user._id.getTimestamp()
        };
      }
    }));

    res.json({ 
      success: true, 
      users: usersWithStats 
    });

  } catch (error) {
    console.error(' Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user's reviews
router.get('/users/:userId/reviews', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(` Fetching reviews for user: ${userId}`);

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get all reviews by this user
    const reviews = await Review.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    console.log(` Found ${reviews.length} reviews`);

    // Get product details for each review
    const formattedReviews = await Promise.all(reviews.map(async (review) => {
      try {
        let productDetails = null;
        
        if (review.productType === 'dress') {
          const Dress = mongoose.model('Dress');
          productDetails = await Dress.findById(review.productId)
            .select('name images category');
        } else {
          const Jewellery = mongoose.model('Jewellery');
          productDetails = await Jewellery.findById(review.productId)
            .select('name image category');
        }

        return {
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          productName: productDetails?.name || 'Deleted Product',
          productImage: review.productType === 'dress' 
            ? productDetails?.images?.cover 
            : productDetails?.image,
          productType: review.productType,
          productCategory: productDetails?.category || 'N/A'
        };
      } catch (err) {
        console.error(`Error processing review ${review._id}:`, err);
        return {
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          productName: 'Product Unavailable',
          productImage: null,
          productType: review.productType,
          productCategory: 'N/A'
        };
      }
    }));

    res.json({ 
      success: true, 
      reviews: formattedReviews 
    });

  } catch (error) {
    console.error(' Error fetching user reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get user details by ID
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password -otp -otpExpiry')
      .lean();

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get user stats
    const [reviewCount, orderCount] = await Promise.all([
      Review.countDocuments({ userId }),
      Order.countDocuments({ userId })
    ]);

    res.json({ 
      success: true, 
      user: {
        ...user,
        reviewCount,
        orderCount
      }
    });

  } catch (error) {
    console.error(' Error fetching user:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Update user status (activate/deactivate)
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password -otp -otpExpiry');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      user 
    });

  } catch (error) {
    console.error(' Error updating user status:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Delete user's reviews first
    await Review.deleteMany({ userId });

    // Delete user's orders (optional - you might want to keep them for records)
    // await Order.deleteMany({ userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;