import express from 'express';
import Wishlist from '../models/Wishlist.js';
import Dress from '../models/Dress.js';
import Jewellery from '../models/Jewellery.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to get product details
const getProductDetails = async (productType, productId) => {
  const Model = productType === 'dress' ? Dress : Jewellery;
  const product = await Model.findById(productId);
  
  if (!product) return null;
  
  if (productType === 'dress') {
    return {
      name: product.name,
      image: product.images?.cover,
      price: product.price,
      discount: product.discount,
      finalPrice: product.finalPrice || product.price
    };
  } else {
    return {
      name: product.name,
      image: product.image,
      price: product.price,
      discount: product.discount,
      finalPrice: product.finalPrice || product.price
    };
  }
};

// Get user wishlist
router.get('/', authenticate, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user._id });
    
    if (!wishlist) {
      wishlist = await Wishlist.create({
        userId: req.user._id,
        items: [],
        totalItems: 0
      });
    }
    
    res.status(200).json({
      success: true,
      wishlist
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add item to wishlist
router.post('/add', authenticate, async (req, res) => {
  try {
    const { productType, productId } = req.body;
    
    console.log('Add to wishlist request:', { productType, productId });
    
    // Validate input
    if (!productType || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Product type and ID are required'
      });
    }
    
    if (!['dress', 'jewellery'].includes(productType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product type'
      });
    }
    
    // Get product details
    const product = await getProductDetails(productType, productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Get or create user wishlist
    let wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ 
        userId: req.user._id, 
        items: [],
        totalItems: 0
      });
    }
    
    // Check if item already exists in wishlist
    const existingItem = wishlist.items.find(item => 
      item.productId.toString() === productId &&
      item.productType === productType
    );
    
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Item already in wishlist'
      });
    }
    
    // Add new item
    wishlist.items.push({
      productType,
      productId,
      name: product.name,
      image: product.image,
      price: product.price,
      discount: product.discount,
      finalPrice: product.finalPrice
    });
    
    // Update totalItems manually
    wishlist.totalItems = wishlist.items.length;
    
    await wishlist.save();
    
    res.status(200).json({
      success: true,
      message: 'Item added to wishlist successfully',
      wishlist
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Remove item from wishlist
router.delete('/remove/:itemId', authenticate, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    console.log('Remove item from wishlist:', itemId);
    
    const wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    wishlist.items = wishlist.items.filter(item => item._id.toString() !== itemId);
    // Update totalItems manually
    wishlist.totalItems = wishlist.items.length;
    
    await wishlist.save();
    
    res.status(200).json({
      success: true,
      message: 'Item removed from wishlist',
      wishlist
    });
  } catch (error) {
    console.error('Remove item error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Clear wishlist
router.delete('/clear', authenticate, async (req, res) => {
  try {
    console.log('Clear wishlist for user:', req.user._id);
    
    const wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    wishlist.items = [];
    wishlist.totalItems = 0;
    await wishlist.save();
    
    res.status(200).json({
      success: true,
      message: 'Wishlist cleared successfully',
      wishlist
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Check if item is in wishlist
router.get('/check/:productType/:productId', authenticate, async (req, res) => {
  try {
    const { productType, productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      return res.json({ success: true, inWishlist: false });
    }
    
    const exists = wishlist.items.some(item => 
      item.productId.toString() === productId &&
      item.productType === productType
    );
    
    res.json({
      success: true,
      inWishlist: exists
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;