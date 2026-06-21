import express from 'express';
import Combo from '../models/Combo.js';
import Dress from '../models/Dress.js';
import Jewellery from '../models/Jewellery.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to calculate combo totals
const calculateComboTotals = (combo) => {
  combo.totalPrice = combo.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  combo.totalDiscount = combo.items.reduce((sum, item) => 
    sum + ((item.price - item.finalPrice) * item.quantity), 0);
  
  const additionalDiscount = combo.type === 'combo' ? 0.20 : 0.10;
  combo.finalPrice = combo.totalPrice * (1 - additionalDiscount);
  combo.discountPercentage = additionalDiscount * 100;
  
  return combo;
};

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
      sizes: product.sizes || [],
      meterSizes: product.meterSizes || []
    };
  } else {
    return {
      name: product.name,
      image: product.image,
      price: product.price,
      discount: product.discount,
      finalPrice: product.finalPrice || product.price,
      sizes: product.sizes || []
    };
  }
};

// Get user's active combo/gift
router.get('/:type', authenticate, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['combo', 'gift'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type'
      });
    }
    
    let combo = await Combo.findOne({
      userId: req.user._id,
      type,
      status: 'active'
    });
    
    if (!combo) {
      combo = await Combo.create({
        userId: req.user._id,
        type,
        items: []
      });
    }
    
    res.status(200).json({
      success: true,
      combo
    });
  } catch (error) {
    console.error('Get combo error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add item to combo/gift
router.post('/add/:type', authenticate, async (req, res) => {
  try {
    const { type } = req.params;
    const { productType, productId, selectedSize, quantity = 1 } = req.body;
    
    if (!['combo', 'gift'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type'
      });
    }
    
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
    const hasSizes = product.sizes.length > 0 || product.meterSizes?.length > 0;
    
    if (hasSizes && !selectedSize) {
      return res.status(400).json({
        success: false,
        message: 'Please select a size'
      });
    }
    
    // Find the selected size in product
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
          message: `Only ${sizeFound.stock} items available`
        });
      }
    }
    
    // Get or create combo
    let combo = await Combo.findOne({
      userId: req.user._id,
      type,
      status: 'active'
    });
    
    if (!combo) {
      combo = new Combo({
        userId: req.user._id,
        type,
        items: []
      });
    }
    
    // Check if item already exists
    const existingItemIndex = combo.items.findIndex(item => 
      item.productId.toString() === productId &&
      item.productType === productType &&
      ((!item.selectedSize && !selectedSize) || 
       (item.selectedSize?.size === selectedSize?.size))
    );
    
    if (existingItemIndex > -1) {
      // Update quantity
      combo.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      combo.items.push({
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
    
    // Calculate totals before saving
    calculateComboTotals(combo);
    await combo.save();
    
    res.status(200).json({
      success: true,
      message: 'Item added successfully',
      combo
    });
  } catch (error) {
    console.error('Add to combo error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update item in combo/gift
router.put('/update/:comboId/:itemId', authenticate, async (req, res) => {
  try {
    const { comboId, itemId } = req.params;
    const { quantity, selectedSize } = req.body;
    
    const combo = await Combo.findOne({
      _id: comboId,
      userId: req.user._id,
      status: 'active'
    });
    
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }
    
    const itemIndex = combo.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Update quantity if provided
    if (quantity !== undefined) {
      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1'
        });
      }
      combo.items[itemIndex].quantity = quantity;
    }
    
    // Update size if provided
    if (selectedSize) {
      const product = await getProductDetails(
        combo.items[itemIndex].productType,
        combo.items[itemIndex].productId
      );
      
      if (product) {
        const allSizes = [...(product.sizes || []), ...(product.meterSizes || [])];
        const sizeFound = allSizes.find(s => s.size === selectedSize.size);
        
        if (!sizeFound) {
          return res.status(400).json({
            success: false,
            message: 'Selected size not available'
          });
        }
        
        if (sizeFound.stock < combo.items[itemIndex].quantity) {
          return res.status(400).json({
            success: false,
            message: `Only ${sizeFound.stock} items available`
          });
        }
        
        combo.items[itemIndex].selectedSize = selectedSize;
      }
    }
    
    // Calculate totals before saving
    calculateComboTotals(combo);
    await combo.save();
    
    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      combo
    });
  } catch (error) {
    console.error('Update combo error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Remove item from combo/gift
router.delete('/remove/:comboId/:itemId', authenticate, async (req, res) => {
  try {
    const { comboId, itemId } = req.params;
    
    const combo = await Combo.findOne({
      _id: comboId,
      userId: req.user._id,
      status: 'active'
    });
    
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }
    
    combo.items = combo.items.filter(item => item._id.toString() !== itemId);
    
    // Calculate totals before saving
    calculateComboTotals(combo);
    await combo.save();
    
    res.status(200).json({
      success: true,
      message: 'Item removed successfully',
      combo
    });
  } catch (error) {
    console.error('Remove from combo error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update gift details
router.put('/gift/:comboId', authenticate, async (req, res) => {
  try {
    const { comboId } = req.params;
    const { message, recipientName, recipientEmail } = req.body;
    
    const combo = await Combo.findOne({
      _id: comboId,
      userId: req.user._id,
      type: 'gift',
      status: 'active'
    });
    
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found'
      });
    }
    
    if (message !== undefined) combo.message = message;
    if (recipientName !== undefined) combo.recipientName = recipientName;
    if (recipientEmail !== undefined) combo.recipientEmail = recipientEmail;
    
    // Calculate totals before saving (in case items were modified)
    calculateComboTotals(combo);
    await combo.save();
    
    res.status(200).json({
      success: true,
      message: 'Gift details updated',
      combo
    });
  } catch (error) {
    console.error('Update gift error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Clear combo/gift
router.delete('/clear/:comboId', authenticate, async (req, res) => {
  try {
    const { comboId } = req.params;
    
    const combo = await Combo.findOne({
      _id: comboId,
      userId: req.user._id,
      status: 'active'
    });
    
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }
    
    combo.items = [];
    
    // Calculate totals before saving
    calculateComboTotals(combo);
    await combo.save();
    
    res.status(200).json({
      success: true,
      message: 'Combo cleared successfully',
      combo
    });
  } catch (error) {
    console.error('Clear combo error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Purchase combo/gift
router.post('/purchase/:comboId', authenticate, async (req, res) => {
  try {
    const { comboId } = req.params;
    
    const combo = await Combo.findOne({
      _id: comboId,
      userId: req.user._id,
      status: 'active'
    });
    
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }
    
    if (combo.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot purchase empty combo'
      });
    }
    
    // Here you would integrate with payment gateway
    // For now, just mark as purchased
    
    combo.status = 'purchased';
    await combo.save();
    
    res.status(200).json({
      success: true,
      message: 'Purchase successful',
      combo
    });
  } catch (error) {
    console.error('Purchase combo error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;