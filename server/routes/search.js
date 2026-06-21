import express from 'express';
import Dress from '../models/Dress.js';
import Jewellery from '../models/Jewellery.js';
import UserProfile from '../models/UserProfile.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Search across dresses and jewellery
router.get('/', authenticate, async (req, res) => {
  try {
    const { q, category, occasion, color, minPrice, maxPrice } = req.query;
    
    // Build search query
    const searchQuery = {};
    
    if (q) {
      searchQuery.$or = [
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { occasion: { $regex: q, $options: 'i' } },
        { color: { $regex: q, $options: 'i' } },
        { material: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (category) searchQuery.category = category;
    if (occasion) searchQuery.occasion = occasion;
    if (color) searchQuery.color = color;
    
    // Price filter
    if (minPrice || maxPrice) {
      searchQuery.finalPrice = {};
      if (minPrice) searchQuery.finalPrice.$gte = Number(minPrice);
      if (maxPrice) searchQuery.finalPrice.$lte = Number(maxPrice);
    }

    // Execute parallel searches
    const [dresses, jewellery] = await Promise.all([
      Dress.find(searchQuery).limit(20).lean(),
      Jewellery.find(searchQuery).limit(20).lean()
    ]);

    // Format results
    const results = [
      ...dresses.map(d => ({ ...d, type: 'dress' })),
      ...jewellery.map(j => ({ ...j, type: 'jewellery' }))
    ];

    // Save search to history if user is authenticated and query exists
    if (req.user && q) {
      await UserProfile.findOneAndUpdate(
        { userId: req.user._id },
        { 
          $push: { 
            searchHistory: { 
              $each: [{
                query: q,
                filters: { category, occasion, color, minPrice, maxPrice },
                timestamp: new Date()
              }],
              $slice: -20 // Keep only last 20 searches
            }
          }
        },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      count: results.length,
      results
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get search history and generate outfit recommendations
router.get('/history', authenticate, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user._id });
    
    if (!profile || !profile.searchHistory.length) {
      return res.json({ 
        success: true, 
        history: [], 
        outfits: [] 
      });
    }

    // Get last 3 unique search queries
    const recentQueries = [...new Set(
      profile.searchHistory.slice(-5).map(h => h.query)
    )].slice(-3);

    // Generate outfit combinations based on search interests
    let outfits = [];
    
    for (const query of recentQueries) {
      // Find dresses matching the search query
      const dresses = await Dress.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { occasion: { $regex: query, $options: 'i' } },
          { color: { $regex: query, $options: 'i' } }
        ]
      }).limit(5).lean();

      // Find jewellery matching the search query
      const jewellery = await Jewellery.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { occasion: { $regex: query, $options: 'i' } },
          { color: { $regex: query, $options: 'i' } }
        ]
      }).limit(5).lean();

      // Create outfit combinations
      if (dresses.length > 0 && jewellery.length > 0) {
        // Create up to 3 outfits per search query
        for (let i = 0; i < Math.min(3, dresses.length, jewellery.length); i++) {
          outfits.push({
            id: `outfit-${Date.now()}-${i}-${query}`,
            basedOn: query,
            dress: { ...dresses[i], type: 'dress' },
            jewellery: { ...jewellery[i], type: 'jewellery' }
          });
        }
      } else if (dresses.length > 0) {
        // If no jewellery, pair with random popular jewellery
        const randomJewellery = await Jewellery.aggregate([{ $sample: { size: 3 } }]);
        randomJewellery.forEach((j, i) => {
          if (dresses[i]) {
            outfits.push({
              id: `outfit-${Date.now()}-${i}-${query}`,
              basedOn: query,
              dress: { ...dresses[i], type: 'dress' },
              jewellery: { ...j, type: 'jewellery' }
            });
          }
        });
      }
    }

    // Remove duplicates and limit to 6 outfits
    outfits = outfits
      .filter((v, i, a) => a.findIndex(t => 
        t.dress._id === v.dress._id && t.jewellery._id === v.jewellery._id
      ) === i)
      .slice(0, 6);

    res.json({
      success: true,
      history: recentQueries,
      outfits
    });

  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clear search history
router.delete('/history', authenticate, async (req, res) => {
  try {
    await UserProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { searchHistory: [] } }
    );
    
    res.json({ success: true, message: 'History cleared' });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;