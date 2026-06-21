// routes/size.js
// ─────────────────────────────────────────────────────────────────────────────
// Size API Routes – Overhauled
// Changes:
//   • /detailed-feedback: smarter tip based on 5★ vs 3-4★
//   • /predict/smart: passes productId for exact order matching
//   • /measurements PUT: improved validation
//   • Full debug logging throughout
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express';
import {
  predictSizeWithKNN,
  recordPurchaseWithFeedback,
  updateMeasurements,
  getUserSizeProfile,
  getFitFeedbackHistory,
  knnPredictor,
} from '../services/sizeService.js';
import Dress      from '../models/Dress.js';
import Jewellery  from '../models/Jewellery.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ════════════════════════════════════════════════════════════
//  GET /api/size/measurements
//  Returns the user's stored body measurements.
// ════════════════════════════════════════════════════════════
router.get('/measurements', authenticate, async (req, res) => {
  try {
    console.log(`\n📏 [GET /measurements] user=${req.user._id}`);
    const profile = await getUserSizeProfile(req.user._id);
    console.log(`   Measurement fields on file:`, Object.keys(profile.measurements || {}).join(', ') || 'none');
    res.json({ success: true, measurements: profile });
  } catch (err) {
    console.error('❌ [GET /measurements]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/size/feedback/history
//  Returns user's full fit feedback log.
// ════════════════════════════════════════════════════════════
router.get('/feedback/history', authenticate, async (req, res) => {
  try {
    console.log(`\n⭐ [GET /feedback/history] user=${req.user._id}`);
    const feedback = await getFitFeedbackHistory(req.user._id);
    console.log(`   Returning ${feedback.length} feedback entries`);
    res.json({ success: true, feedback });
  } catch (err) {
    console.error('❌ [GET /feedback/history]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/size/profile
//  Returns enriched size profile (measurements + confirmed sizes + stats).
// ════════════════════════════════════════════════════════════
router.get('/profile', authenticate, async (req, res) => {
  try {
    console.log(`\n👤 [GET /profile] user=${req.user._id}`);
    const profile = await getUserSizeProfile(req.user._id);
    console.log(`   Profile built | confirmed size keys: ${Object.keys(profile.confirmedSizes).join(', ') || 'none'}`);
    res.json({ success: true, profile });
  } catch (err) {
    console.error('❌ [GET /profile]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/size/debug/knn
//  Dev-only endpoint to inspect KNN state.
// ════════════════════════════════════════════════════════════
if (process.env.NODE_ENV !== 'production') {
  router.get('/debug/knn', authenticate, (req, res) => {
    const stats = knnPredictor.stats;
    console.log(`\n🧠 [GET /debug/knn] Stats:`, stats);
    res.json({
      success: true,
      knn: {
        ...stats,
        note: 'KNN is trained ONLY on 5★ perfect-fit feedback with measurements attached.',
      },
    });
  });
}

// ════════════════════════════════════════════════════════════
//  POST /api/size/predict/smart/:productType/:productId
//  Full KNN + order-history prediction.
// ════════════════════════════════════════════════════════════
router.post('/predict/smart/:productType/:productId', authenticate, async (req, res) => {
  try {
    const { productType, productId } = req.params;
    const {
      orderHistory,
      fitHistory,
      userSizeProfile,
      currentMeasurements,
      productCategory,
    } = req.body;

    console.log(`\n🔮 [POST /predict/smart/${productType}/${productId}]`);
    console.log(`   User: ${req.user._id}`);
    console.log(`   Category: ${productCategory || 'not provided'}`);
    console.log(`   Order history items: ${orderHistory?.length ?? 0}`);
    console.log(`   Fit history items: ${fitHistory?.length ?? 0}`);
    console.log(`   Has inline measurements: ${currentMeasurements ? 'yes' : 'no'}`);

    if (!['dress', 'jewellery'].includes(productType)) {
      return res.status(400).json({ success: false, message: `Invalid productType: ${productType}` });
    }

    const Model   = productType === 'dress' ? Dress : Jewellery;
    const product = await Model.findById(productId).lean();

    if (!product) {
      console.log(`   ❌ Product ${productId} not found in ${productType} collection`);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    console.log(`   Product: "${product.name}" | category: ${product.category}`);
    console.log(`   Sizes: ${(product.sizes || []).map(s => `${s.size}(stock:${s.stock})`).join(', ')}`);

    const prediction = await predictSizeWithKNN(
      req.user._id,
      productType,
      product,
      { orderHistory, fitHistory, userSizeProfile, currentMeasurements, productCategory }
    );

    console.log(`   ✅ Prediction → size: ${prediction.predictedSize} | confidence: ${prediction.confidence}% | source: ${prediction.source}`);
    res.json({ success: true, ...prediction });
  } catch (err) {
    console.error('❌ [POST /predict/smart]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /api/size/detailed-feedback
//  Record fit feedback. 5★ = train KNN. 3-4★ = store only.
// ════════════════════════════════════════════════════════════
router.post('/detailed-feedback', authenticate, async (req, res) => {
  try {
    const {
      productId,
      productType,
      size,
      fitRating,
      fitIssues,
      comfortLevel,
      notes,
      wouldRecommend,
      category,
    } = req.body;

    console.log(`\n📝 [POST /detailed-feedback]`);
    console.log(`   User: ${req.user._id} | Product: ${productType}/${productId}`);
    console.log(`   Size: ${size} | Rating: ${fitRating}/5 | Issues: [${(fitIssues || []).join(', ')}]`);
    console.log(`   Category: ${category} | Recommend: ${wouldRecommend}`);

    // Validate required fields
    const missing = [];
    if (!productId)   missing.push('productId');
    if (!productType) missing.push('productType');
    if (!size)        missing.push('size');
    if (!fitRating)   missing.push('fitRating');
    if (missing.length > 0) {
      console.log('   ❌ Missing fields:', missing.join(', '));
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
    }

    if (!['dress', 'jewellery'].includes(productType)) {
      return res.status(400).json({ success: false, message: 'Invalid productType' });
    }

    if (fitRating < 1 || fitRating > 5) {
      return res.status(400).json({ success: false, message: 'fitRating must be between 1 and 5' });
    }

    const Model   = productType === 'dress' ? Dress : Jewellery;
    const product = await Model.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const result = await recordPurchaseWithFeedback(
      req.user._id,
      productId,
      productType,
      product,
      size,
      { fitRating, fitIssues: fitIssues || [], comfortLevel, notes, wouldRecommend }
    );

    // ── Generate personalised tip ──
    let tip = '';
    let tipType = 'info';

    if (fitRating === 5) {
      tip     = `🔒 Size ${size} is now locked in as your perfect fit for ${product.category || productType}! Future recommendations will prioritise it.`;
      tipType = 'success';
    } else if (fitRating === 4) {
      const isTight = (fitIssues || []).some(i => i.toLowerCase().includes('tight'));
      const isLoose = (fitIssues || []).some(i => i.toLowerCase().includes('loose'));
      if (isTight) {
        tip = `👍 Good fit! You noted it was a little tight — next time consider sizing up from ${size}.`;
      } else if (isLoose) {
        tip = `👍 Good fit! You noted it was a little loose — next time consider sizing down from ${size}.`;
      } else {
        tip = `👍 Good fit! We've recorded size ${size} for you. Rate it 5★ next time if it's perfect to lock it in.`;
      }
      tipType = 'warning';
    } else if (fitRating === 3) {
      const isTight = (fitIssues || []).some(i => i.toLowerCase().includes('tight'));
      const isLoose = (fitIssues || []).some(i => i.toLowerCase().includes('loose'));
      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
      const idx = sizeOrder.indexOf(size?.toUpperCase());
      const nextUp   = sizeOrder[idx + 1];
      const nextDown = sizeOrder[idx - 1];
      if (isTight && nextUp) {
        tip = `💡 Noted — size ${size} was too tight. Try ${nextUp} next time for more room.`;
      } else if (isLoose && nextDown) {
        tip = `💡 Noted — size ${size} was too loose. Try ${nextDown} next time for a closer fit.`;
      } else {
        tip = `💡 Thanks for the feedback! We'll factor this into future recommendations.`;
      }
      tipType = 'warning';
    } else {
      tip = `😟 Sorry the fit wasn't good! We'll avoid recommending size ${size} for you in future.`;
      tipType = 'danger';
    }

    console.log(`   ✅ Response tip: "${tip}"`);
    res.json({
      success:      true,
      message:      'Feedback recorded successfully',
      tip,
      tipType,
      modelUpdated: result.modelUpdated,
      feedbackId:   result.feedbackId,
    });
  } catch (err) {
    console.error('❌ [POST /detailed-feedback]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  PUT /api/size/measurements
//  Upsert user body measurements (partial update supported).
// ════════════════════════════════════════════════════════════
router.put('/measurements', authenticate, async (req, res) => {
  try {
    const measurements = req.body;
    console.log(`\n📐 [PUT /measurements] user=${req.user._id}`);
    console.log('   Received keys:', Object.keys(measurements).join(', '));

    if (!measurements || Object.keys(measurements).length === 0) {
      return res.status(400).json({ success: false, message: 'No measurements provided' });
    }

    // Validate structure: each entry must be { value, unit }
    const invalid = [];
    for (const [key, val] of Object.entries(measurements)) {
      if (!val || typeof val !== 'object') { invalid.push(`${key}: not an object`); continue; }
      if (val.value == null || isNaN(parseFloat(val.value))) { invalid.push(`${key}: missing or invalid value`); }
      if (parseFloat(val.value) <= 0) { invalid.push(`${key}: value must be > 0`); }
    }
    if (invalid.length > 0) {
      console.log('   ❌ Validation errors:', invalid.join('; '));
      return res.status(400).json({ success: false, message: `Validation errors: ${invalid.join('; ')}` });
    }

    await updateMeasurements(req.user._id, measurements);
    console.log(`   ✅ Measurements updated for user ${req.user._id}`);
    res.json({ success: true, message: 'Measurements updated successfully' });
  } catch (err) {
    console.error('❌ [PUT /measurements]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  LEGACY: GET /api/size/predict/:productType/:productId
// ════════════════════════════════════════════════════════════
router.get('/predict/:productType/:productId', authenticate, async (req, res) => {
  try {
    console.log(`\n⚠️  [LEGACY GET /predict] Redirecting to smart prediction...`);
    const { productType, productId } = req.params;

    if (!['dress', 'jewellery'].includes(productType)) {
      return res.status(400).json({ success: false, message: 'Invalid productType' });
    }

    const Model   = productType === 'dress' ? Dress : Jewellery;
    const product = await Model.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const prediction = await predictSizeWithKNN(req.user._id, productType, product, {});
    res.json({ success: true, ...prediction });
  } catch (err) {
    console.error('❌ [LEGACY GET /predict]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  LEGACY: POST /api/size/feedback
// ════════════════════════════════════════════════════════════
router.post('/feedback', authenticate, async (req, res) => {
  try {
    console.log(`\n⚠️  [LEGACY POST /feedback] Converting to detailed format...`);
    const { productId, productType, size, fitFeedback } = req.body;

    const ratingMap   = { perfect: 5, good: 4, tight: 3, loose: 3, poor: 2, terrible: 1 };
    const issuesMap   = { tight: ['too_tight_chest', 'too_tight_waist'], loose: ['too_loose_chest', 'too_loose_waist'] };
    const fitRating   = ratingMap[fitFeedback] ?? 3;
    const fitIssues   = issuesMap[fitFeedback] ?? [];
    const comfortLevel = fitRating >= 4 ? 'comfortable' : 'uncomfortable';

    console.log(`   Converted: ${fitFeedback} → rating ${fitRating}, issues [${fitIssues.join(', ')}]`);

    if (!['dress', 'jewellery'].includes(productType)) {
      return res.status(400).json({ success: false, message: 'Invalid productType' });
    }

    const Model   = productType === 'dress' ? Dress : Jewellery;
    const product = await Model.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const result = await recordPurchaseWithFeedback(
      req.user._id, productId, productType, product, size,
      { fitRating, fitIssues, comfortLevel, wouldRecommend: fitRating >= 4 }
    );

    res.json({ success: true, message: 'Feedback recorded', modelUpdated: result.modelUpdated });
  } catch (err) {
    console.error('❌ [LEGACY POST /feedback]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;