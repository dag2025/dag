import express from 'express';
import Review from '../models/Review.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get reviews for a product
router.get('/:productType/:productId', async (req, res) => {
  try {
    const { productType, productId } = req.params;
    
    // Validate product type
    if (!['dress', 'jewellery'].includes(productType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product type'
      });
    }
    
    // Get all reviews for the product
    const reviews = await Review.find({ productType, productId })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 reviews
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
    
    // Count reviews by rating
    const ratingCounts = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length
    };
    
    res.status(200).json({
      success: true,
      reviews,
      stats: {
        totalReviews: reviews.length,
        averageRating,
        ratingCounts
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add a review
router.post('/', authenticate, async (req, res) => {
  try {
    const { productType, productId, rating, comment } = req.body;
    
    // Validate input
    if (!productType || !productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    if (!['dress', 'jewellery'].includes(productType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product type'
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    if (comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be less than 500 characters'
      });
    }
    
    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      productType,
      productId,
      userId: req.user._id
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }
    
    // Create new review
    const review = await Review.create({
      productType,
      productId,
      userId: req.user._id,
      userName: req.user.name,
      rating,
      comment
    });
    
    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update a review
router.put('/:reviewId', authenticate, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    
    // Find review
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if user owns the review
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews'
      });
    }
    
    // Update review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.updatedAt = Date.now();
    
    await review.save();
    
    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete a review
router.delete('/:reviewId', authenticate, async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    // Find review
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if user owns the review
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }
    
    await Review.findByIdAndDelete(reviewId);
    
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user's review for a specific product
router.get('/user/:productType/:productId', authenticate, async (req, res) => {
  try {
    const { productType, productId } = req.params;
    
    const review = await Review.findOne({
      productType,
      productId,
      userId: req.user._id
    });
    
    res.status(200).json({
      success: true,
      review: review || null
    });
  } catch (error) {
    console.error('Get user review error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;