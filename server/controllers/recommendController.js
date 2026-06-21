import { computeUCBForFeatures, updateBanditWithFeatures } from '../services/banditService.js';
import Dress from '../models/Dress.js';
import Jewellery from '../models/Jewellery.js';

const D = 10;

const getProductFeatures = (product) => {
  console.log('Getting features for product:', product?._id, product?.name);
  const features = new Array(D).fill(0);
  
  // Category encoding (indices 0-2)
  const categoryMap = { 'Kurithi': 0, 'Hoodie': 1, 'Gold covering': 2 };
  if (product.category && categoryMap[product.category] !== undefined) {
    features[categoryMap[product.category]] = 1;
  }
  
  // Color encoding (indices 3-5)
  const colorMap = { 'red': 3, 'yellow': 4, 'silver': 5 };
  if (product.color && colorMap[product.color]) {
    features[colorMap[product.color]] = 1;
  }
  
  // Occasion encoding (indices 6-7)
  const occasionMap = { 'party wear': 6, 'casual': 7 };
  if (product.occasion && occasionMap[product.occasion]) {
    features[occasionMap[product.occasion]] = 1;
  }
  
  // Normalized price (index 8)
  features[8] = (product.price || 0) / 10000;
  
  // Bias term (index 9)
  features[9] = 1;
  
  return features;
};

const combineFeatures = (dress, jewel) => {
  console.log('Combining features for:', dress?.name, 'and', jewel?.name);
  const dressFeat = getProductFeatures(dress);
  const jewelFeat = getProductFeatures(jewel);
  return dressFeat.map((val, idx) => (val + jewelFeat[idx]) / 2);
};

export const getOutfitRecommendations = async (req, res) => {
  try {
    console.log('getOutfitRecommendations called for user:', req.user?._id);
    
    const userId = req.user._id;
    const { occasion, season } = req.query;
    console.log('Query params:', { occasion, season });

    // Fetch all dresses and jewellery
    console.log('Fetching dresses...');
    const dresses = await Dress.find().lean();
    console.log(`Found ${dresses.length} dresses`);
    
    console.log('Fetching jewellery...');
    const jewellery = await Jewellery.find().lean();
    console.log(`Found ${jewellery.length} jewellery items`);

    if (dresses.length === 0 || jewellery.length === 0) {
      console.log('No products found');
      return res.json({ success: true, outfits: [] });
    }

    // Limit candidates to prevent explosion (e.g., first 5 dresses × first 5 jewellery = 25 outfits)
    const maxDresses = Math.min(dresses.length, 5);
    const maxJewellery = Math.min(jewellery.length, 5);
    
    const candidates = [];
    for (let i = 0; i < maxDresses; i++) {
      for (let j = 0; j < maxJewellery; j++) {
        candidates.push({ dress: dresses[i], jewel: jewellery[j] });
      }
    }
    console.log(`Created ${candidates.length} candidate outfits`);

    // Compute feature vectors for all candidates
    console.log('Computing feature vectors...');
    const featureVectors = candidates.map(c => combineFeatures(c.dress, c.jewel));
    console.log('Feature vectors computed');

    // Get UCB scores
    console.log('Calling computeUCBForFeatures...');
    const ucbResults = await computeUCBForFeatures(userId, featureVectors);
    console.log(`Got ${ucbResults.length} UCB results`);

    // Attach scores and sort
    const scored = candidates.map((c, idx) => ({
      dress: c.dress,
      jewel: c.jewel,
      ucb: ucbResults[idx].ucb,
      features: featureVectors[idx]
    }));
    
    scored.sort((a, b) => b.ucb - a.ucb);
    console.log('Top 3 UCB scores:', scored.slice(0,3).map(s => s.ucb));

    const topOutfits = scored.slice(0, 10).map(o => ({ 
      dress: o.dress, 
      jewel: o.jewel 
    }));

    res.json({ success: true, outfits: topOutfits });
    
  } catch (error) {
    console.error('ERROR in getOutfitRecommendations:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const postFeedback = async (req, res) => {
  try {
    console.log('postFeedback called for user:', req.user?._id);
    const userId = req.user._id;
    const { dressId, jewelId, action } = req.body;
    console.log('Feedback data:', { dressId, jewelId, action });

    // Determine reward
    let reward = 0;
    if (action === 'click') reward = 0.5;
    else if (action === 'purchase') reward = 1.0;
    else if (action === 'skip') reward = 0;

    // Fetch both products
    const dress = await Dress.findById(dressId).lean();
    const jewel = await Jewellery.findById(jewelId).lean();
    
    if (!dress || !jewel) {
      console.log('Products not found:', { dress: !!dress, jewel: !!jewel });
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const featureVector = combineFeatures(dress, jewel);
    console.log('Feature vector length:', featureVector.length);

    await updateBanditWithFeatures(userId, featureVector, reward);
    console.log('Bandit updated successfully');

    res.json({ success: true });
  } catch (error) {
    console.error('ERROR in postFeedback:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};