// services/sizeService.js
// ─────────────────────────────────────────────────────────────────────────────
// Size Prediction Service – Overhauled
// Changes:
//   • KNN training: uses ONLY 5★ feedback (perfect fits) as training signal
//   • Order fallback: matches by EXACT productId first, then category
//   • Feedback profile: separates 5★ (confirmed) from 3-4★ (imperfect)
//   • Measurement-based: deferred to frontend (globally accepted math)
//   • Extra debug logs throughout
// ─────────────────────────────────────────────────────────────────────────────
import UserMeasurement from '../models/UserMeasurement.js';
import FitFeedback     from '../models/FitFeedback.js';
import Order           from '../models/Order.js';

// ════════════════════════════════════════════════════════════
//  KNN PREDICTOR
// ════════════════════════════════════════════════════════════
class KNNPredictor {
  constructor(k = 5) {
    this.k = k;
    this.trainingData = [];
    this.lastTrainedAt = null;
  }

  // Euclidean distance on normalised body measurements
  calculateDistance(user1, user2) {
    let distance = 0;
    let dimensions = 0;

    const addDim = (v1, v2, scale) => {
      if (v1 !== null && v2 !== null) {
        distance += Math.pow((v1 - v2) / scale, 2);
        dimensions++;
      }
    };

    const toCm = (v, u) => u === 'inch' ? v * 2.54 : parseFloat(v);
    const toKg = (v, u) => u === 'lbs'  ? v * 0.453592 : parseFloat(v);

    if (user1.height?.value && user2.height?.value)
      addDim(toCm(user1.height.value, user1.height.unit), toCm(user2.height.value, user2.height.unit), 30);

    if (user1.weight?.value && user2.weight?.value)
      addDim(toKg(user1.weight.value, user1.weight.unit), toKg(user2.weight.value, user2.weight.unit), 20);

    if (user1.chest?.value && user2.chest?.value)
      addDim(toCm(user1.chest.value, user1.chest.unit), toCm(user2.chest.value, user2.chest.unit), 15);

    if (user1.waist?.value && user2.waist?.value)
      addDim(toCm(user1.waist.value, user1.waist.unit), toCm(user2.waist.value, user2.waist.unit), 15);

    if (user1.hips?.value && user2.hips?.value)
      addDim(toCm(user1.hips.value, user1.hips.unit), toCm(user2.hips.value, user2.hips.unit), 15);

    if (dimensions === 0) return Infinity;
    return Math.sqrt(distance / dimensions); // normalise by number of shared dimensions
  }

  /**
   * Train with ONLY 5★ data — these are confirmed perfect fits.
   * Lower-rated feedback is recorded but NOT used as training signal.
   */
  train(historicalData) {
    const before = this.trainingData.length;
    this.trainingData = historicalData.filter(d => d.fitRating === 5);
    this.lastTrainedAt = new Date();
    console.log(
      `🧠 [KNN] Trained: ${this.trainingData.length} samples ` +
      `(was ${before}, filtered from ${historicalData.length} total)`
    );
    if (this.trainingData.length < 5) {
      console.warn('⚠️  [KNN] Very few 5★ training samples — predictions may be unreliable');
    }
  }

  predict(userMeasurements, availableSizes, productType, category) {
    console.group(`🔮 [KNN] predict() | type=${productType} | cat=${category} | k=${this.k}`);
    console.log(`   Training set size: ${this.trainingData.length}`);

    if (this.trainingData.length === 0) {
      console.log('   ⚠️  No training data → fallback');
      console.groupEnd();
      return this._fallback(availableSizes, 'No 5★ training data available yet');
    }

    // Compute distances
    const distances = this.trainingData.map(dp => ({
      distance:    this.calculateDistance(userMeasurements, dp.measurements),
      size:        dp.size,
      fitRating:   dp.fitRating,
      productType: dp.productType,
      category:    dp.category,
    }));

    // Sort ascending and take k nearest within threshold
    const DISTANCE_THRESHOLD = 1.2; // tuned – anything > 1.2 std-devs is too different
    const neighbors = distances
      .sort((a, b) => a.distance - b.distance)
      .slice(0, this.k)
      .filter(n => n.distance < DISTANCE_THRESHOLD && n.distance < Infinity);

    console.log(`   Neighbors found (dist < ${DISTANCE_THRESHOLD}): ${neighbors.length}`);
    neighbors.forEach((n, i) =>
      console.log(`   [${i}] dist=${n.distance.toFixed(3)} | size=${n.size} | type=${n.productType} | cat=${n.category}`)
    );

    if (neighbors.length === 0) {
      console.log('   ⚠️  All neighbors beyond threshold → fallback');
      console.groupEnd();
      return this._fallback(availableSizes, 'Nearest users are too different — using default');
    }

    // Prefer same productType + category, fall back to same productType
    const sameBoth = neighbors.filter(n => n.productType === productType && n.category === category);
    const sameType = neighbors.filter(n => n.productType === productType);
    const pool     = sameBoth.length > 0 ? sameBoth : sameType.length > 0 ? sameType : neighbors;

    console.log(`   Pool: ${pool.length} (same-both=${sameBoth.length}, same-type=${sameType.length})`);

    // Weighted vote: closer = higher weight (inverse distance)
    const votes = {};
    pool.forEach(n => {
      const w = 1 / (n.distance + 0.01);
      votes[n.size] = (votes[n.size] || 0) + w;
    });

    const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    const [topSize, topWeight] = sorted[0];
    const runnerUpWeight = sorted[1]?.[1] || 0;

    // Confidence: how dominant is the winner?
    const dominance  = topWeight / (topWeight + runnerUpWeight + 1e-9);
    const confidence = Math.min(97, Math.max(45, Math.round(dominance * 120)));

    console.log(`   Vote results:`, sorted.map(([s, w]) => `${s}=${w.toFixed(2)}`).join(', '));
    console.log(`   Winner: ${topSize} | confidence: ${confidence}% | dominance: ${(dominance*100).toFixed(1)}%`);

    // Check availability in product
    const inStock = availableSizes.find(s => s.size?.toLowerCase() === topSize?.toLowerCase() && s.stock > 0);

    if (!inStock) {
      // Find closest available size
      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
      const topIdx    = sizeOrder.findIndex(s => s.toLowerCase() === topSize?.toLowerCase());
      const available = availableSizes.filter(s => s.stock > 0);

      let nearest = null;
      let minDist = Infinity;
      for (const s of available) {
        const sIdx = sizeOrder.findIndex(x => x.toLowerCase() === s.size?.toLowerCase());
        const dist = sIdx >= 0 ? Math.abs(sIdx - topIdx) : 999;
        if (dist < minDist) { minDist = dist; nearest = s; }
      }

      console.log(`   ⚠️  ${topSize} out of stock → nearest available: ${nearest?.size}`);
      console.groupEnd();
      return {
        predictedSize:  nearest?.size || availableSizes[0]?.size,
        confidence:     Math.max(40, confidence - 20),
        alternatives:   sorted.slice(1, 3).map(([s]) => s),
        neighborsUsed:  pool.length,
        reasoning:      `Our model picked ${topSize} but it's out of stock. ` +
                        `${nearest?.size} is the closest available size for your measurements.`,
        source:         'knn_adjusted',
      };
    }

    console.log(`   ✅ ${topSize} is in stock`);
    console.groupEnd();
    return {
      predictedSize: topSize,
      confidence,
      alternatives:  sorted.slice(1, 3).map(([s]) => s),
      neighborsUsed: pool.length,
      reasoning:     `Based on ${pool.length} shoppers with similar measurements who gave 5★ fit ratings.`,
      source:        'knn',
    };
  }

  _fallback(availableSizes, reason = 'Fallback prediction') {
    console.log(`⚠️  [KNN] _fallback: ${reason}`);
    // Default to middle of available sizes
    const middle = Math.floor((availableSizes.length - 1) / 2);
    return {
      predictedSize: availableSizes[middle]?.size || availableSizes[0]?.size,
      confidence:    40,
      alternatives:  availableSizes.filter((_, i) => i !== middle).slice(0, 2).map(s => s.size),
      neighborsUsed: 0,
      reasoning:     reason + ' — Add your measurements for accurate predictions.',
      source:        'fallback',
    };
  }

  get stats() {
    return {
      trainingSize:  this.trainingData.length,
      lastTrainedAt: this.lastTrainedAt,
      k:             this.k,
    };
  }
}

// Singleton
const knnPredictor = new KNNPredictor(5);

// ════════════════════════════════════════════════════════════
//  TRAINING DATA LOADER
// ════════════════════════════════════════════════════════════

/**
 * Load ONLY 5★ feedback with measurements as KNN training data.
 * 3-4★ feedback is stored but never used for training —
 * it may represent a size that "kinda worked" not a true fit.
 */
async function loadTrainingData() {
  console.log('🔄 [KNN] Loading training data (5★ only)...');
  try {
    const feedbacks = await FitFeedback.find({
      fitRating: 5, // ← ONLY perfect fits
      'measurements.height': { $exists: true },
    })
    .select('measurements size fitRating productType category')
    .lean();

    console.log(`📊 [KNN] Raw 5★ feedback with measurements: ${feedbacks.length}`);

    const trainingData = feedbacks
      .filter(f => f.measurements && f.size)
      .map(f => ({
        measurements: f.measurements,
        size:         f.size,
        fitRating:    f.fitRating,
        productType:  f.productType,
        category:     f.category,
      }));

    console.log(`✅ [KNN] Valid training samples: ${trainingData.length}`);
    knnPredictor.train(trainingData);
    return trainingData.length;
  } catch (err) {
    console.error('❌ [KNN] Training data load error:', err);
    return 0;
  }
}

// Bootstrap on startup + refresh hourly
loadTrainingData();
setInterval(loadTrainingData, 3_600_000);

// ════════════════════════════════════════════════════════════
//  MAIN PREDICTION FUNCTION
// ════════════════════════════════════════════════════════════
export async function predictSizeWithKNN(userId, productType, product, contextData = {}) {
  console.group(`🎯 [sizeService] predictSizeWithKNN | user=${userId} | product=${product._id}`);
  console.log('   Product:', product.name, '| Type:', productType, '| Category:', product.category);
  console.log('   KNN stats:', JSON.stringify(knnPredictor.stats));

  const { orderHistory, fitHistory, userSizeProfile, currentMeasurements, productCategory } = contextData;

  // ── 1. User measurements ──
  let userMeasurements = currentMeasurements || null;
  if (!userMeasurements) {
    const doc = await UserMeasurement.findOne({ userId }).lean();
    userMeasurements = doc || null;
    console.log('   Measurements from DB:', userMeasurements ? 'found' : 'none');
  }

  // ── 2. Available sizes (in-stock only) ──
  const availableSizes = (product.sizes || []).filter(s => s.stock > 0);
  if (availableSizes.length === 0) {
    console.log('   ❌ Product out of stock');
    console.groupEnd();
    return { predictedSize: null, confidence: 0, message: 'Product is out of stock', alternatives: [] };
  }
  console.log('   Available sizes:', availableSizes.map(s => `${s.size}(${s.stock})`).join(', '));

  const category = productCategory || product.category || 'general';

  // ── 3. User's personal 5★ fit history ──
  const confirmed5Star = await FitFeedback.find({
    userId,
    productType,
    fitRating: 5,
  }).sort({ createdAt: -1 }).limit(10).lean();

  console.log(`   User's 5★ feedback for ${productType}: ${confirmed5Star.length} entries`);

  let prediction = null;

  // ── Path A: have measurements → use KNN ──
  if (userMeasurements && Object.keys(userMeasurements).length > 2) {
    console.log('   Path A: KNN with measurements');
    prediction = knnPredictor.predict(userMeasurements, availableSizes, productType, category);

    // Boost confidence if recent 5★ size matches KNN prediction
    const sameProductFeedback = confirmed5Star.find(
      f => f.productId?.toString() === product._id.toString()
    );
    const categoryFeedback = confirmed5Star.find(f => f.category === category);
    const boostSource = sameProductFeedback || categoryFeedback;

    if (boostSource) {
      const boostSize = boostSource.size;
      if (boostSize === prediction.predictedSize) {
        prediction.confidence = Math.min(99, prediction.confidence + 20);
        prediction.reasoning  += ` ✓ Your 5★ feedback confirms this size works for you.`;
        console.log(`   🔥 Confidence boosted +20 (5★ feedback confirms ${boostSize})`);
      } else {
        // Disagreement — 5★ feedback wins for personalisation
        console.log(`   ⚠️  KNN says ${prediction.predictedSize} but 5★ feedback says ${boostSize}`);
        prediction.alternatives = [prediction.predictedSize, ...prediction.alternatives].slice(0, 3);
        prediction.predictedSize = boostSize;
        prediction.confidence    = Math.min(92, prediction.confidence + 5);
        prediction.reasoning     = `Your 5★ feedback for ${boostSource.category || 'a similar'} item ` +
                                   `suggests ${boostSize} works best for you (overrides KNN prediction of ${prediction.alternatives[0]}).`;
        prediction.source        = '5star_override';
      }
    }
  }
  // ── Path B: no measurements → check exact product in order history ──
  else {
    console.log('   Path B: No measurements — checking order history by exact productId');

    const userOrders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    console.log(`   Orders loaded: ${userOrders.length}`);

    // Priority 1: Exact product ID match in orders
    let exactOrderItem = null;
    for (const order of userOrders) {
      const found = (order.items || []).find(item => {
        const itemPid = (item.productId?._id ?? item.productId)?.toString();
        return itemPid === product._id.toString() && item.selectedSize?.size;
      });
      if (found) {
        exactOrderItem = found;
        console.log(`   ✅ Exact productId match in orders → size: ${found.selectedSize.size}`);
        break;
      }
    }

    if (exactOrderItem) {
      const orderedSize = exactOrderItem.selectedSize.size;
      const inStock     = availableSizes.some(s => s.size === orderedSize);
      prediction = {
        predictedSize: inStock ? orderedSize : availableSizes[0]?.size,
        confidence:    inStock ? 80 : 55,
        alternatives:  availableSizes.filter(s => s.size !== orderedSize).slice(0, 2).map(s => s.size),
        neighborsUsed: 0,
        reasoning:     `You ordered this exact item before in size ${orderedSize}.` +
                       (!inStock ? ` That size is now out of stock, so we suggest ${availableSizes[0]?.size}.` : ''),
        source:        'exact_order',
      };
    }
    // Priority 2: 5★ feedback for same product type + category
    else if (confirmed5Star.length > 0) {
      const categoryMatch = confirmed5Star.find(f => f.category === category) || confirmed5Star[0];
      const confirmedSize = categoryMatch.size;
      const inStock       = availableSizes.some(s => s.size === confirmedSize);
      console.log(`   Using 5★ feedback size: ${confirmedSize} (category: ${categoryMatch.category})`);
      prediction = {
        predictedSize: inStock ? confirmedSize : availableSizes[0]?.size,
        confidence:    inStock ? 75 : 50,
        alternatives:  availableSizes.filter(s => s.size !== confirmedSize).slice(0, 2).map(s => s.size),
        neighborsUsed: 0,
        reasoning:     `Based on your 5★ feedback for similar ${productType}s, ` +
                       `${confirmedSize} fits you well.`,
        source:        '5star_history',
      };
    }
    // Priority 3: General KNN fallback (no measurements)
    else {
      console.log('   No order/feedback data → KNN fallback (no measurements)');
      prediction = knnPredictor._fallback(availableSizes, 'No measurements or order history found');
    }
  }

  // ── Final stock check ──
  const finalStock = availableSizes.some(s => s.size === prediction.predictedSize);
  if (!finalStock && availableSizes.length > 0) {
    console.log(`   ⚠️  Final size ${prediction.predictedSize} not in stock — override with ${availableSizes[0].size}`);
    prediction.message      = `Recommended size ${prediction.predictedSize} is unavailable. Showing closest.`;
    prediction.predictedSize = availableSizes[0].size;
    prediction.confidence   = Math.max(35, prediction.confidence - 25);
  }

  console.log('📊 [sizeService] Final prediction:', {
    size:       prediction.predictedSize,
    confidence: prediction.confidence,
    source:     prediction.source,
    reasoning:  prediction.reasoning?.substring(0, 80),
  });
  console.groupEnd();
  return prediction;
}

// ════════════════════════════════════════════════════════════
//  FEEDBACK RECORDING
// ════════════════════════════════════════════════════════════
export async function recordPurchaseWithFeedback(userId, productId, productType, product, size, feedbackDetails) {
  console.group(`💾 [sizeService] recordPurchaseWithFeedback`);
  console.log('   User:', userId, '| Product:', productId, '| Size:', size);
  console.log('   Rating:', feedbackDetails.fitRating, '/5');
  console.log('   Issues:', feedbackDetails.fitIssues);
  console.log('   Comfort:', feedbackDetails.comfortLevel);

  const measurements = await UserMeasurement.findOne({ userId }).lean();
  if (!measurements) {
    console.log('   ⚠️  No measurements on file — feedback saved but KNN not enriched');
  }

  const feedback = new FitFeedback({
    userId,
    productId,
    productType,
    size,
    fitRating:    feedbackDetails.fitRating,
    fitIssues:    feedbackDetails.fitIssues || [],
    comfortLevel: feedbackDetails.comfortLevel,
    notes:        feedbackDetails.notes,
    wouldRecommend: feedbackDetails.wouldRecommend,
    measurements: measurements ? {
      height: measurements.height,
      weight: measurements.weight,
      chest:  measurements.chest,
      waist:  measurements.waist,
      hips:   measurements.hips,
    } : undefined,
    category: product.category,
  });

  await feedback.save();
  console.log(`   ✅ Feedback saved: ${feedback._id}`);

  // Only retrain KNN on 5★ feedback — this is intentional!
  // 3-4★ feedback is stored for display/suggestion purposes only.
  if (feedbackDetails.fitRating === 5 && measurements) {
    console.log('   🔄 5★ feedback + measurements → retraining KNN...');
    const count = await loadTrainingData();
    console.log(`   KNN retrained with ${count} 5★ samples`);
  } else if (feedbackDetails.fitRating < 5) {
    console.log(`   ℹ️  ${feedbackDetails.fitRating}★ feedback saved for suggestion display — NOT used for KNN training`);
  }

  console.groupEnd();
  return {
    feedbackId:   feedback._id,
    modelUpdated: feedbackDetails.fitRating === 5 && !!measurements,
    rating:       feedbackDetails.fitRating,
  };
}

// ════════════════════════════════════════════════════════════
//  MEASUREMENTS UPDATE
// ════════════════════════════════════════════════════════════
export async function updateMeasurements(userId, newMeasurements) {
  console.group(`📝 [sizeService] updateMeasurements | user=${userId}`);
  console.log('   Payload:', JSON.stringify(newMeasurements, null, 2));

  // Validate that each provided measurement has a value
  for (const [key, val] of Object.entries(newMeasurements)) {
    if (!val || typeof val !== 'object' || !val.value) {
      console.warn(`   ⚠️  Skipping invalid measurement: ${key}`, val);
      delete newMeasurements[key];
    }
  }

  if (Object.keys(newMeasurements).length === 0) {
    throw new Error('No valid measurements provided after validation');
  }

  const doc = await UserMeasurement.findOneAndUpdate(
    { userId },
    { $set: { ...newMeasurements, userId, updatedAt: new Date() } },
    { upsert: true, new: true }
  );

  console.log(`   ✅ Saved | doc._id=${doc._id}`);
  console.log('   Stored fields:', Object.keys(doc.toObject()).filter(k => !['_id','userId','__v'].includes(k)).join(', '));

  // If user has 5★ feedback history, retrain with updated measurements
  const positiveCount = await FitFeedback.countDocuments({ userId, fitRating: 5 });
  if (positiveCount > 0) {
    console.log(`   🔄 User has ${positiveCount} 5★ feedbacks — triggering KNN retrain...`);
    await loadTrainingData();
  } else {
    console.log('   ℹ️  No 5★ feedback — KNN retrain skipped');
  }

  console.groupEnd();
  return doc;
}

// ════════════════════════════════════════════════════════════
//  SIZE PROFILE
// ════════════════════════════════════════════════════════════
export async function getUserSizeProfile(userId) {
  console.log(`👤 [sizeService] getUserSizeProfile | user=${userId}`);
  const measurements = await UserMeasurement.findOne({ userId }).lean();
  const allFeedback  = await FitFeedback.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();

  const confirmed  = allFeedback.filter(f => f.fitRating === 5);
  const decent     = allFeedback.filter(f => f.fitRating >= 3 && f.fitRating < 5);
  const poor       = allFeedback.filter(f => f.fitRating < 3);

  console.log(`   Total feedback: ${allFeedback.length} | 5★: ${confirmed.length} | 3-4★: ${decent.length} | <3★: ${poor.length}`);

  // Build confirmed size profile by type+category
  const confirmedSizes = {};
  confirmed.forEach(f => {
    const key = `${f.productType}:${f.category || 'general'}`;
    if (!confirmedSizes[key]) {
      confirmedSizes[key] = { size: f.size, count: 1, lastSeen: f.createdAt };
    } else {
      confirmedSizes[key].count++;
    }
  });

  // Build size adjustments from decent feedback
  const sizeAdjustments = decent.map(f => ({
    productType: f.productType,
    category:    f.category,
    size:        f.size,
    rating:      f.fitRating,
    issues:      f.fitIssues,
  }));

  return {
    measurements,
    confirmedSizes,
    sizeAdjustments,
    recentFeedback: allFeedback.slice(0, 5),
    totalFeedback:  allFeedback.length,
    knnStats:       knnPredictor.stats,
  };
}

// ════════════════════════════════════════════════════════════
//  FEEDBACK HISTORY
// ════════════════════════════════════════════════════════════
export async function getFitFeedbackHistory(userId) {
  console.log(`📋 [sizeService] getFitFeedbackHistory | user=${userId}`);
  const history = await FitFeedback.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  console.log(`   Found ${history.length} feedback entries`);
  const byRating = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  history.forEach(f => { byRating[f.fitRating] = (byRating[f.fitRating] || 0) + 1; });
  console.log('   Rating distribution:', JSON.stringify(byRating));

  return history;
}

// Export for debug/testing
export { knnPredictor };