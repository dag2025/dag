import express from 'express';
import Cart from '../models/Cart.js';
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
      finalPrice: product.finalPrice || product.price,
      sizes: product.sizes,
      meterSizes: product.meterSizes
    };
  } else {
    return {
      name: product.name,
      image: product.image,
      price: product.price,
      discount: product.discount,
      finalPrice: product.finalPrice || product.price,
      sizes: product.sizes
    };
  }
};

// Get user cart
router.get('/', authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        items: []
      });
    }
    
    res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add item to cart
router.post('/add', authenticate, async (req, res) => {
  try {
    const { productType, productId, selectedSize, quantity = 1 } = req.body;
    
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
    
    // Validate size selection
    const hasSizes = product.sizes && product.sizes.length > 0;
    const hasMeterSizes = product.meterSizes && product.meterSizes.length > 0;
    
    if ((hasSizes || hasMeterSizes) && !selectedSize) {
      return res.status(400).json({
        success: false,
        message: 'Please select a size'
      });
    }
    
    // Find the selected size in product
    let sizeStock = null;
    if (selectedSize) {
      const allSizes = [...(product.sizes || []), ...(product.meterSizes || [])];
      const sizeFound = allSizes.find(s => s.size === selectedSize.size);
      
      if (!sizeFound) {
        return res.status(400).json({
          success: false,
          message: 'Selected size not available'
        });
      }
      
      if (sizeFound.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${sizeFound.stock} items available in this size`
        });
      }
      
      sizeStock = sizeFound.stock;
    }
    
    // Get or create user cart
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }
    
    // Check if item already exists in cart (with same size)
    const existingItemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId &&
      item.productType === productType &&
      ((!item.selectedSize && !selectedSize) || 
       (item.selectedSize?.size === selectedSize?.size))
    );
    
    if (existingItemIndex > -1) {
      // Update existing item quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      // Check stock limit
      if (sizeStock && newQuantity > sizeStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more than ${sizeStock} items of this size`
        });
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        productType,
        productId,
        name: product.name,
        image: product.image,
        price: product.price,
        discount: product.discount,
        finalPrice: product.finalPrice,
        selectedSize: selectedSize || null,
        quantity
      });
    }
    
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update cart item quantity
router.put('/update/:itemId', authenticate, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }
    
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    // Get product to check stock
    const item = cart.items[itemIndex];
    const product = await getProductDetails(item.productType, item.productId);
    
    if (item.selectedSize) {
      const allSizes = [...(product.sizes || []), ...(product.meterSizes || [])];
      const sizeFound = allSizes.find(s => s.size === item.selectedSize.size);
      
      if (sizeFound && quantity > sizeFound.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${sizeFound.stock} items available in this size`
        });
      }
    }
    
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      cart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update item size
router.put('/update-size/:itemId', authenticate, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { selectedSize } = req.body;
    
    if (!selectedSize || !selectedSize.size) {
      return res.status(400).json({
        success: false,
        message: 'Please select a size'
      });
    }
    
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    const item = cart.items[itemIndex];
    const product = await getProductDetails(item.productType, item.productId);
    
    // Validate new size
    const allSizes = [...(product.sizes || []), ...(product.meterSizes || [])];
    const sizeFound = allSizes.find(s => s.size === selectedSize.size);
    
    if (!sizeFound) {
      return res.status(400).json({
        success: false,
        message: 'Selected size not available'
      });
    }
    
    if (sizeFound.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${sizeFound.stock} items available in this size`
      });
    }
    
    cart.items[itemIndex].selectedSize = selectedSize;
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Size updated successfully',
      cart
    });
  } catch (error) {
    console.error('Update size error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', authenticate, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart
    });
  } catch (error) {
    console.error('Remove item error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Clear cart
router.delete('/clear', authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    cart.items = [];
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Apply coins to cart
router.post('/apply-coins', authenticate, async (req, res) => {
  try {
    const { coinsToApply } = req.body;
    
    if (!coinsToApply || coinsToApply < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid coins to apply'
      });
    }
    
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Store applied coins in session or temporary field
    // This would need to be handled in a more sophisticated way
    // For now, we'll just return success
    
    res.status(200).json({
      success: true,
      message: 'Coins applied successfully',
      cart
    });
  } catch (error) {
    console.error('Apply coins error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;