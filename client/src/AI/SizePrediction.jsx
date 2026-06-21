// src/AI/SizePrediction.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Smart Size Assistant – Complete Overhaul
// 1. Order-based  : Exact productId match only
// 2. Feedback-based: 5★ = locked-in | 3-4★ = show + suggest next size
// 3. Measurement  : Globally accepted size math, proper unit display
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// ════════════════════════════════════════════════════════════
//  GLOBAL SIZE CHARTS  (Internationally accepted standards)
// ════════════════════════════════════════════════════════════

/**
 * Standard apparel size chart (cm).
 * Based on: ISO 8559-1:2017 + Indian BIS standard IS 4280.
 * Chest is weighted highest (3x) as the primary fit determinant for dresses.
 */
const DRESS_SIZE_CHART = [
  { size: 'XS',   chest: [74, 80],  waist: [56, 62],  hips: [82, 88],  label: 'Extra Small',        intlUS: '0-2',   intlUK: '4-6'  },
  { size: 'S',    chest: [81, 86],  waist: [63, 67],  hips: [89, 93],  label: 'Small',              intlUS: '4-6',   intlUK: '8-10' },
  { size: 'M',    chest: [87, 92],  waist: [68, 72],  hips: [94, 98],  label: 'Medium',             intlUS: '8-10',  intlUK: '12-14'},
  { size: 'L',    chest: [93, 98],  waist: [73, 78],  hips: [99, 104], label: 'Large',              intlUS: '12-14', intlUK: '16-18'},
  { size: 'XL',   chest: [99, 104], waist: [79, 84],  hips: [105,110], label: 'Extra Large',        intlUS: '16-18', intlUK: '20-22'},
  { size: 'XXL',  chest: [105,112], waist: [85, 92],  hips: [111,118], label: 'Double Extra Large', intlUS: '20-22', intlUK: '24-26'},
  { size: 'XXXL', chest: [113,120], waist: [93, 100], hips: [119,126], label: 'Triple Extra Large', intlUS: '24+',   intlUK: '28+'  },
];

/**
 * Meter/fabric size for ethnic Indian dresses (saree/salwar/dupatta).
 * Based on standard cutting requirements by height.
 * Source: NIFT India fabric consumption guidelines.
 */
const METER_SIZE_CHART = [
  { size: '1m',    minHeight: 0,   maxHeight: 148, label: "Up to 4'10\"", heightRange: '< 148 cm' },
  { size: '1.5m',  minHeight: 149, maxHeight: 158, label: "4'11\" – 5'2\"", heightRange: '149–158 cm'},
  { size: '2m',    minHeight: 159, maxHeight: 168, label: "5'3\" – 5'6\"",  heightRange: '159–168 cm'},
  { size: '2.5m',  minHeight: 169, maxHeight: 178, label: "5'7\" – 5'10\"", heightRange: '169–178 cm'},
  { size: '3m',    minHeight: 179, maxHeight: 999, label: "5'11\" and above", heightRange: '> 178 cm'},
];

/**
 * Ring size chart: US size → circumference (mm) + diameter (mm).
 * Source: ISO 8653:2016 + Gemological Institute of America (GIA).
 * When user enters circumference (or diameter) we find the closest US size.
 */
const RING_SIZE_CHART = [
  { us: '3',   circumferenceMm: 44.2, diameterMm: 14.1 },
  { us: '3.5', circumferenceMm: 45.5, diameterMm: 14.5 },
  { us: '4',   circumferenceMm: 46.8, diameterMm: 14.9 },
  { us: '4.5', circumferenceMm: 48.0, diameterMm: 15.3 },
  { us: '5',   circumferenceMm: 49.3, diameterMm: 15.7 },
  { us: '5.5', circumferenceMm: 50.6, diameterMm: 16.1 },
  { us: '6',   circumferenceMm: 51.9, diameterMm: 16.5 },
  { us: '6.5', circumferenceMm: 53.1, diameterMm: 16.9 },
  { us: '7',   circumferenceMm: 54.4, diameterMm: 17.3 },
  { us: '7.5', circumferenceMm: 55.7, diameterMm: 17.7 },
  { us: '8',   circumferenceMm: 57.0, diameterMm: 18.1 },
  { us: '8.5', circumferenceMm: 58.3, diameterMm: 18.6 },
  { us: '9',   circumferenceMm: 59.5, diameterMm: 18.9 },
  { us: '9.5', circumferenceMm: 60.8, diameterMm: 19.4 },
  { us: '10',  circumferenceMm: 62.1, diameterMm: 19.8 },
  { us: '10.5',circumferenceMm: 63.4, diameterMm: 20.2 },
  { us: '11',  circumferenceMm: 64.6, diameterMm: 20.6 },
  { us: '12',  circumferenceMm: 67.2, diameterMm: 21.4 },
  { us: '13',  circumferenceMm: 69.7, diameterMm: 22.2 },
];

// ════════════════════════════════════════════════════════════
//  UNIT CONVERSION UTILITIES
// ════════════════════════════════════════════════════════════

const toCm = (value, unit) => {
  const v = parseFloat(value);
  if (!v || isNaN(v)) return null;
  switch ((unit || 'cm').toLowerCase()) {
    case 'inch': case 'in': case '"': return +(v * 2.54).toFixed(1);
    case 'ft': return +(v * 30.48).toFixed(1);
    case 'mm': return +(v / 10).toFixed(1);
    default: return +v.toFixed(1); // assume cm
  }
};

const toKg = (value, unit) => {
  const v = parseFloat(value);
  if (!v || isNaN(v)) return null;
  return (unit || 'kg').toLowerCase() === 'lbs' ? +(v * 0.453592).toFixed(1) : +v.toFixed(1);
};

const cmToInches = (cm) => cm ? +(cm / 2.54).toFixed(1) : null;
const cmToFeetStr = (cm) => {
  if (!cm) return null;
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const ins = Math.round(totalIn % 12);
  return `${ft}'${ins}"`;
};
const mmToInches = (mm) => mm ? +(mm / 25.4).toFixed(2) : null;
const mmToCm    = (mm) => mm ? +(mm / 10).toFixed(1) : null;

// ════════════════════════════════════════════════════════════
//  SIZE PREDICTION MATH
// ════════════════════════════════════════════════════════════

/**
 * Predict dress standard size (XS–XXXL) from body measurements.
 * Uses a weighted scoring system: chest(3x) + waist(2x) + hips(2x).
 * Returns full details for display.
 */
function predictDressSizeFromMeasurements(measurements) {
  console.group('📐 [SizePredict] Dress standard-size calculation');

  const chestCm = measurements.chest?.value ? toCm(measurements.chest.value, measurements.chest.unit) : null;
  const waistCm = measurements.waist?.value ? toCm(measurements.waist.value, measurements.waist.unit) : null;
  const hipsCm  = measurements.hips?.value  ? toCm(measurements.hips.value,  measurements.hips.unit)  : null;
  const weightKg = measurements.weight?.value ? toKg(measurements.weight.value, measurements.weight.unit) : null;
  const heightCm = measurements.height?.value ? toCm(measurements.height.value, measurements.height.unit) : null;

  console.log('Input (cm/kg):', { chestCm, waistCm, hipsCm, weightKg, heightCm });

  if (!chestCm && !waistCm && !hipsCm) {
    console.warn('⚠️  No chest/waist/hips → cannot predict standard size');
    console.groupEnd();
    return null;
  }

  // Score every size row
  const scored = DRESS_SIZE_CHART.map(row => {
    let score = 0;

    if (chestCm !== null) {
      const [lo, hi] = row.chest;
      if (chestCm >= lo && chestCm <= hi)   score += 3;          // perfect fit
      else if (chestCm < lo)                score += 3 - (lo - chestCm) * 0.15;
      else                                  score += 3 - (chestCm - hi) * 0.15;
    }
    if (waistCm !== null) {
      const [lo, hi] = row.waist;
      if (waistCm >= lo && waistCm <= hi)   score += 2;
      else if (waistCm < lo)                score += 2 - (lo - waistCm) * 0.12;
      else                                  score += 2 - (waistCm - hi) * 0.12;
    }
    if (hipsCm !== null) {
      const [lo, hi] = row.hips;
      if (hipsCm >= lo && hipsCm <= hi)     score += 2;
      else if (hipsCm < lo)                 score += 2 - (lo - hipsCm) * 0.12;
      else                                  score += 2 - (hipsCm - hi) * 0.12;
    }
    return { ...row, score };
  });

  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const best   = sorted[0];
  const second = sorted[1];

  // Confidence: how much better the winner is vs runner-up
  const maxScore  = (chestCm ? 3 : 0) + (waistCm ? 2 : 0) + (hipsCm ? 2 : 0);
  const rawConf   = maxScore > 0 ? Math.round((best.score / maxScore) * 100) : 50;
  const confidence = Math.min(98, Math.max(40, rawConf));

  // Figure out where each measurement sits relative to predicted size
  const fit = {};
  if (chestCm !== null) {
    const [lo, hi] = best.chest;
    const mid = (lo + hi) / 2;
    fit.chest = chestCm < lo ? 'below' : chestCm > hi ? 'above' : chestCm > mid + 2 ? 'upper' : 'mid';
  }
  if (waistCm !== null) {
    const [lo, hi] = best.waist;
    fit.waist = waistCm < lo ? 'below' : waistCm > hi ? 'above' : 'mid';
  }
  if (hipsCm !== null) {
    const [lo, hi] = best.hips;
    fit.hips = hipsCm < lo ? 'below' : hipsCm > hi ? 'above' : 'mid';
  }

  const result = {
    size:       best.size,
    label:      best.label,
    intlUS:     best.intlUS,
    intlUK:     best.intlUK,
    sizeRow:    best,
    secondSize: second?.size,
    confidence,
    fit,
    // Formatted measurements for display
    chestCm, chestIn: cmToInches(chestCm),
    waistCm, waistIn: cmToInches(waistCm),
    hipsCm,  hipsIn:  cmToInches(hipsCm),
    weightKg, heightCm,
    heightFt: cmToFeetStr(heightCm),
  };

  console.log('✅ Predicted standard size:', result.size, `(${confidence}% confidence)`);
  console.log('   2nd choice:', second?.size);
  console.log('   Fit breakdown:', fit);
  console.groupEnd();
  return result;
}

/**
 * Predict fabric meter size from height.
 * Used for ethnic dresses (salwar, saree, etc.)
 */
function predictMeterSize(measurements) {
  console.log('📏 [SizePredict] Calculating meter size...');
  if (!measurements.height?.value) {
    console.log('   ⚠️  No height measurement – cannot predict meter size');
    return null;
  }
  const heightCm = toCm(measurements.height.value, measurements.height.unit);
  if (!heightCm) return null;

  const match = METER_SIZE_CHART.find(r => heightCm >= r.minHeight && heightCm <= r.maxHeight);
  if (!match) {
    console.log('   ⚠️  Height', heightCm, 'cm out of chart range');
    return null;
  }

  const result = {
    size:      match.size,
    label:     match.label,
    heightCm:  Math.round(heightCm),
    heightIn:  Math.round(heightCm / 2.54),
    heightFt:  cmToFeetStr(heightCm),
    rangeLabel: match.heightRange,
  };
  console.log('   ✅ Meter size:', result.size, 'for height', result.heightCm, 'cm');
  return result;
}

/**
 * Predict ring/jewellery size from user's ring circumference (stored as ringSize in mm).
 * If user enters diameter instead, pass { isDiameter: true }.
 */
function predictRingSize(measurements) {
  console.group('💍 [SizePredict] Ring size calculation');
  const raw = measurements.ringSize;

  if (!raw?.value) {
    console.log('   ⚠️  No ringSize measurement');
    console.groupEnd();
    return null;
  }

  let circumferenceMm = null;
  let inputType = 'circumference';

  // Normalize input to mm circumference
  const unit = (raw.unit || 'mm').toLowerCase();
  if (unit === 'mm') {
    // Could be circumference or diameter – if value < 25 it's almost certainly diameter
    if (raw.value < 25) {
      inputType = 'diameter';
      circumferenceMm = raw.value * Math.PI; // C = π × d
      console.log(`   Treating ${raw.value}mm as diameter → circumference ${circumferenceMm.toFixed(1)}mm`);
    } else {
      circumferenceMm = raw.value;
      console.log(`   Ring circumference: ${circumferenceMm}mm`);
    }
  } else if (unit === 'cm') {
    // Typically diameter in cm
    const diamMm = raw.value * 10;
    if (diamMm < 25) {
      inputType = 'diameter';
      circumferenceMm = diamMm * Math.PI;
    } else {
      circumferenceMm = diamMm; // already circumference in mm after conversion
    }
    console.log(`   Input ${raw.value}cm → circumference ${circumferenceMm.toFixed(1)}mm`);
  } else if (unit === 'inch') {
    const diamMm = raw.value * 25.4;
    inputType = 'diameter';
    circumferenceMm = diamMm * Math.PI;
    console.log(`   Input ${raw.value}" → circumference ${circumferenceMm.toFixed(1)}mm`);
  }

  if (!circumferenceMm) {
    console.log('   ❌ Could not resolve circumference');
    console.groupEnd();
    return null;
  }

  // Find closest ring size
  let closest = RING_SIZE_CHART[0];
  let minDiff  = Infinity;
  for (const entry of RING_SIZE_CHART) {
    const diff = Math.abs(entry.circumferenceMm - circumferenceMm);
    if (diff < minDiff) { minDiff = diff; closest = entry; }
  }

  const result = {
    inputType,
    usSize:          closest.us,
    circumferenceMm: closest.circumferenceMm,
    circumferenceCm: mmToCm(closest.circumferenceMm),
    circumferenceIn: mmToInches(closest.circumferenceMm),
    diameterMm:      closest.diameterMm,
    diameterCm:      mmToCm(closest.diameterMm),
    diameterIn:      mmToInches(closest.diameterMm),
    // Prev/Next sizes for reference
    prevUS: RING_SIZE_CHART[RING_SIZE_CHART.findIndex(r => r.us === closest.us) - 1]?.us || null,
    nextUS: RING_SIZE_CHART[RING_SIZE_CHART.findIndex(r => r.us === closest.us) + 1]?.us || null,
    rawInputMm: +(circumferenceMm).toFixed(1),
  };

  console.log('✅ Ring size US:', result.usSize,
    `| ∅ ${result.diameterMm}mm / ${result.diameterIn}" / ${result.diameterCm}cm`,
    `| ○ ${result.circumferenceMm}mm / ${result.circumferenceCm}cm`);
  console.groupEnd();
  return result;
}

/**
 * For 3-4★ feedback: suggest what the next size would look like.
 * If fit was too tight → suggest size up; too loose → suggest size down.
 */
function getNextSizeSuggestion(currentSize, fitIssues = [], productType) {
  console.log(`🔄 [SizePredict] Next-size logic: current=${currentSize}, issues=[${fitIssues.join(',')}]`);

  if (productType === 'dress') {
    const sizeOrder = DRESS_SIZE_CHART.map(r => r.size);
    const idx = sizeOrder.indexOf(currentSize?.toUpperCase());
    if (idx === -1) return null;

    const isTight = fitIssues.some(i => i.toLowerCase().includes('tight') || i.toLowerCase().includes('small'));
    const isLoose = fitIssues.some(i => i.toLowerCase().includes('loose') || i.toLowerCase().includes('big'));

    let direction = 'up';
    if (isLoose && !isTight) direction = 'down';

    const nextIdx  = direction === 'up' ? idx + 1 : idx - 1;
    const nextSize = sizeOrder[nextIdx];

    if (!nextSize) return null;
    const nextRow  = DRESS_SIZE_CHART.find(r => r.size === nextSize);
    const currRow  = DRESS_SIZE_CHART.find(r => r.size === currentSize?.toUpperCase());

    return {
      suggestedSize: nextSize,
      direction,
      chestDiff: nextRow.chest[0] - currRow.chest[0],
      waistDiff: nextRow.waist[0] - currRow.waist[0],
      hipsDiff:  nextRow.hips[0]  - currRow.hips[0],
      nextRow,
      reason: direction === 'up'
        ? `Size ${nextSize} adds ${nextRow.chest[0] - currRow.chest[0]}cm across chest`
        : `Size ${nextSize} takes in ${currRow.chest[0] - nextRow.chest[0]}cm across chest`,
    };
  }

  if (productType === 'jewellery') {
    const idx = RING_SIZE_CHART.findIndex(r => r.us === currentSize);
    if (idx === -1) return null;

    const isTight = fitIssues.some(i => i.toLowerCase().includes('tight'));
    const isLoose = fitIssues.some(i => i.toLowerCase().includes('loose'));
    const direction = isLoose ? 'down' : 'up';

    const nextEntry = direction === 'up' ? RING_SIZE_CHART[idx + 1] : RING_SIZE_CHART[idx - 1];
    if (!nextEntry) return null;

    return {
      suggestedSize: nextEntry.us,
      direction,
      reason: direction === 'up'
        ? `US ${nextEntry.us} adds ${(nextEntry.circumferenceMm - RING_SIZE_CHART[idx].circumferenceMm).toFixed(1)}mm in circumference`
        : `US ${nextEntry.us} reduces circumference by ${(RING_SIZE_CHART[idx].circumferenceMm - nextEntry.circumferenceMm).toFixed(1)}mm`,
      nextEntry,
    };
  }
  return null;
}

// ════════════════════════════════════════════════════════════
//  COMPONENT
// ════════════════════════════════════════════════════════════
const SizePrediction = ({
  productId,
  productType,      // 'dress' | 'jewellery'
  productSizes,     // [{ size, stock }]
  meterSizes,       // dress only: [{ size, stock }]
  onSizeSelect,
  selectedSize,
  productCategory,
}) => {
  const { isAuthenticated, token } = useAuth();

  // ── Data state ──
  const [orders,       setOrders]       = useState([]);
  const [feedback,     setFeedback]     = useState([]);
  const [measurements, setMeasurements] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // ── UI state ──
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [showFeedbackForm,    setShowFeedbackForm]    = useState(false);

  // ── Feedback form state ──
  const [feedbackRating,     setFeedbackRating]     = useState(3);
  const [feedbackIssues,     setFeedbackIssues]     = useState([]);
  const [feedbackNotes,      setFeedbackNotes]      = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess,    setFeedbackSuccess]    = useState(false);

  // ── Measurement form state ──
  const [dressMeasurements, setDressMeasurements] = useState({
    height: { value: '', unit: 'cm' },
    weight: { value: '', unit: 'kg' },
    chest:  { value: '', unit: 'cm' },
    waist:  { value: '', unit: 'cm' },
    hips:   { value: '', unit: 'cm' },
  });
  const [ringInput, setRingInput] = useState({ value: '', unit: 'mm', type: 'circumference' });
  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const [measurementSaved, setMeasurementSaved] = useState(false);

  // ════════════════════════════════════════
  //  FETCH DATA
  // ════════════════════════════════════════
  useEffect(() => {
    if (!isAuthenticated || !token) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        setLoading(true);
        console.group('🚀 [SizePrediction] Initial data fetch');
        console.log('Product:', productId, '|', productType, '|', productCategory);

        // 1. Orders (we need ALL delivered orders to search by productId)
        const ordersRes = await axios.get('http://localhost:5000/api/orders/my-orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allOrders = ordersRes.data?.success ? ordersRes.data.orders : [];
        setOrders(allOrders);
        console.log(`📦 Loaded ${allOrders.length} orders`);

        // Log which orders contain our exact productId
        const matchingItems = allOrders.flatMap(o => o.items || [])
          .filter(item => item.productId?.toString() === productId?.toString() || item.productId?._id?.toString() === productId?.toString());
        console.log(`📦 Orders containing this exact productId (${productId}):`, matchingItems.length);
        matchingItems.forEach(item => {
          console.log('  → size:', item.selectedSize?.size, '| type:', item.productType, '| category:', item.category);
        });

        // 2. Fit feedback history
        const feedbackRes = await axios.get('http://localhost:5000/api/size/feedback/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (feedbackRes.data?.success) {
          const fb = feedbackRes.data.feedback;
          setFeedback(fb);
          console.log(`⭐ Loaded ${fb.length} feedback entries`);
          const perfect = fb.filter(f => f.fitRating === 5);
          const decent  = fb.filter(f => f.fitRating >= 3 && f.fitRating < 5);
          console.log(`   5★ entries: ${perfect.length} | 3-4★ entries: ${decent.length}`);
        }

        // 3. User measurements
        const measureRes = await axios.get('http://localhost:5000/api/size/measurements', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (measureRes.data?.success && measureRes.data.measurements) {
          const meas = measureRes.data.measurements.measurements ?? measureRes.data.measurements;
          setMeasurements(meas);
          console.log('📏 Measurements loaded:', JSON.stringify(meas, null, 2));
        } else {
          console.log('📏 No measurements on file');
          setMeasurements(null);
        }

        console.groupEnd();
      } catch (err) {
        console.error('❌ [SizePrediction] Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, token, productId, productType, productCategory]);

  // ════════════════════════════════════════
  //  1. ORDER-BASED SIZE
  //     RULE: Only show if this EXACT productId
  //           appears in user's orders.
  // ════════════════════════════════════════
  const orderBasedInfo = useMemo(() => {
    console.group('📦 [OrderBased] Computing...');

    if (!orders.length || !productId) {
      console.log('  No orders or no productId');
      console.groupEnd();
      return null;
    }

    // Search all order items for an exact productId match
    let matchedItem = null;
    let matchedOrder = null;

    for (const order of orders) {
      for (const item of (order.items || [])) {
        const itemProductId = (item.productId?._id ?? item.productId)?.toString();
        if (itemProductId === productId?.toString()) {
          // Found exact match — pick the most recent
          if (!matchedOrder || new Date(order.createdAt) > new Date(matchedOrder.createdAt)) {
            matchedItem  = item;
            matchedOrder = order;
          }
        }
      }
    }

    if (!matchedItem) {
      console.log(`  ❌ Product ${productId} not found in any of ${orders.length} orders`);
      console.log('  → Order-based recommendation NOT shown');
      console.groupEnd();
      return null;
    }

    if (!matchedItem.selectedSize?.size) {
      console.log('  ⚠️  Match found but no selectedSize stored on order item');
      console.groupEnd();
      return null;
    }

    const result = {
      size:      matchedItem.selectedSize.size,
      orderDate: matchedOrder.createdAt,
      productName: matchedItem.productName || matchedItem.name || 'this item',
      orderStatus: matchedOrder.status,
    };

    console.log('  ✅ Exact match found → size:', result.size);
    console.log('  Order date:', result.orderDate, '| Status:', result.orderStatus);
    console.groupEnd();
    return result;
  }, [orders, productId]);

  // ════════════════════════════════════════
  //  2A. FEEDBACK-BASED SIZE (5★ only)
  //      Priority: exact productId → same category
  // ════════════════════════════════════════
  const perfectFeedback = useMemo(() => {
    console.group('⭐ [PerfectFeedback] Computing 5★ feedback...');

    if (!feedback.length || !productType) {
      console.log('  No feedback or productType');
      console.groupEnd();
      return null;
    }

    const fiveStars = feedback.filter(f => f.fitRating === 5 && f.productType === productType);
    console.log(`  Total 5★ entries for ${productType}:`, fiveStars.length);

    // Priority 1: same productId
    const byProductId = fiveStars
      .filter(f => f.productId?.toString() === productId?.toString())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (byProductId.length > 0) {
      const best = byProductId[0];
      console.log('  ✅ 5★ match by exact productId → size:', best.size);
      console.groupEnd();
      return { size: best.size, matchType: 'exact', category: best.category, date: best.createdAt };
    }

    // Priority 2: same category
    if (productCategory) {
      const byCategory = fiveStars
        .filter(f => f.category === productCategory)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (byCategory.length > 0) {
        const best = byCategory[0];
        console.log('  ✅ 5★ match by category →', best.category, '→ size:', best.size);
        console.groupEnd();
        return { size: best.size, matchType: 'category', category: best.category, date: best.createdAt };
      }
    }

    console.log('  ❌ No 5★ feedback for this product or category');
    console.groupEnd();
    return null;
  }, [feedback, productType, productId, productCategory]);

  // ════════════════════════════════════════
  //  2B. IMPERFECT FEEDBACK (3-4★)
  //      Show size + suggest adjustment
  // ════════════════════════════════════════
  const imperfectFeedback = useMemo(() => {
    console.group('🔄 [ImperfectFeedback] Computing 3-4★ feedback...');

    if (!feedback.length || !productType) {
      console.groupEnd();
      return null;
    }

    const decent = feedback.filter(f =>
      f.fitRating >= 3 && f.fitRating < 5 && f.productType === productType
    );
    console.log(`  Total 3-4★ entries for ${productType}:`, decent.length);

    // Priority: exact productId first, then category
    const byProductId = decent
      .filter(f => f.productId?.toString() === productId?.toString())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const byCategory = productCategory
      ? decent.filter(f => f.category === productCategory && f.productId?.toString() !== productId?.toString())
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : [];

    const best = byProductId[0] || byCategory[0];

    if (!best) {
      console.log('  ❌ No 3-4★ feedback found');
      console.groupEnd();
      return null;
    }

    const suggestion = getNextSizeSuggestion(best.size, best.fitIssues || [], productType);

    const result = {
      rating:       best.fitRating,
      size:         best.size,
      fitIssues:    best.fitIssues || [],
      comfortLevel: best.comfortLevel,
      notes:        best.notes,
      matchType:    byProductId.length > 0 ? 'exact' : 'category',
      category:     best.category,
      date:         best.createdAt,
      suggestion,
    };

    console.log('  ✅ Imperfect feedback found → size:', result.size,
      `(${result.rating}★) | issues: [${result.fitIssues.join(', ')}]`);
    if (suggestion) {
      console.log('  💡 Suggestion: try', suggestion.suggestedSize, '(', suggestion.reason, ')');
    }
    console.groupEnd();
    return result;
  }, [feedback, productType, productId, productCategory]);

  // ════════════════════════════════════════
  //  3. MEASUREMENT-BASED SIZE
  // ════════════════════════════════════════
  const measurementPrediction = useMemo(() => {
    console.group('📐 [MeasurementBased] Computing...');

    if (!measurements || !productType) {
      console.log('  No measurements or productType');
      console.groupEnd();
      return null;
    }

    if (productType === 'dress') {
      const standard = predictDressSizeFromMeasurements(measurements);
      const meter    = predictMeterSize(measurements);

      if (!standard && !meter) {
        console.log('  ❌ Insufficient measurements for dress prediction');
        console.groupEnd();
        return null;
      }

      // Check if predicted sizes are actually in this product's size lists
      if (standard) {
        const inProductSizes = productSizes?.some(s => s.size?.toUpperCase() === standard.size);
        standard.availableInProduct = inProductSizes;
        if (!inProductSizes) {
          console.log(`  ⚠️  Standard size ${standard.size} not in this product's sizes list:`,
            productSizes?.map(s => s.size));
        }
      }
      if (meter) {
        const inMeterSizes = meterSizes?.some(s => s.size === meter.size);
        meter.availableInProduct = inMeterSizes;
        if (!inMeterSizes) {
          console.log(`  ⚠️  Meter size ${meter.size} not in this product's meter sizes:`,
            meterSizes?.map(s => s.size));
        }
      }

      console.log('  ✅ Dress prediction complete');
      console.groupEnd();
      return { standard, meter };
    }

    if (productType === 'jewellery') {
      const ring = predictRingSize(measurements);

      if (!ring) {
        console.log('  ❌ No ring measurement available');
        console.groupEnd();
        return null;
      }

      // Check availability in product
      const inProductSizes = productSizes?.some(s => s.size?.toString() === ring.usSize.toString());
      ring.availableInProduct = inProductSizes;
      if (!inProductSizes) {
        console.log(`  ⚠️  Ring size US ${ring.usSize} not in product sizes:`, productSizes?.map(s => s.size));
      }

      console.log('  ✅ Jewellery prediction complete');
      console.groupEnd();
      return { ring };
    }

    console.log('  ❌ Unknown productType:', productType);
    console.groupEnd();
    return null;
  }, [measurements, productType, productSizes, meterSizes, productId, productCategory]);

  // ════════════════════════════════════════
  //  ACTIONS
  // ════════════════════════════════════════
  const selectSize = (sizeLabel, isMeter = false) => {
    const sizeList = isMeter ? meterSizes : productSizes;
    const sizeObj  = sizeList?.find(s => s.size?.toString() === sizeLabel?.toString());
    if (sizeObj && sizeObj.stock > 0) {
      onSizeSelect(sizeObj, isMeter);
      console.log(`✅ [SizePrediction] Selected ${isMeter ? 'meter' : 'standard'} size: ${sizeLabel}`);
    } else if (!sizeObj) {
      console.warn(`⚠️  Size ${sizeLabel} not found in product size list`);
    } else {
      console.warn(`⚠️  Size ${sizeLabel} is out of stock (stock: ${sizeObj?.stock})`);
      alert(`Size ${sizeLabel} is currently out of stock.`);
    }
  };

  const saveMeasurements = async () => {
    setSavingMeasurements(true);
    let payload = {};

    if (productType === 'dress') {
      const dm = dressMeasurements;
      payload = {
        ...(dm.height.value && { height: { value: parseFloat(dm.height.value), unit: dm.height.unit } }),
        ...(dm.weight.value && { weight: { value: parseFloat(dm.weight.value), unit: dm.weight.unit } }),
        ...(dm.chest.value  && { chest:  { value: parseFloat(dm.chest.value),  unit: dm.chest.unit  } }),
        ...(dm.waist.value  && { waist:  { value: parseFloat(dm.waist.value),  unit: dm.waist.unit  } }),
        ...(dm.hips.value   && { hips:   { value: parseFloat(dm.hips.value),   unit: dm.hips.unit   } }),
      };
    } else {
      if (ringInput.value) {
        payload = { ringSize: { value: parseFloat(ringInput.value), unit: ringInput.unit } };
      }
    }

    if (Object.keys(payload).length === 0) {
      alert('Please enter at least one measurement.');
      setSavingMeasurements(false);
      return;
    }

    console.log('💾 [SizePrediction] Saving measurements:', JSON.stringify(payload, null, 2));

    try {
      await axios.put('http://localhost:5000/api/size/measurements', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ Measurements saved successfully');
      setMeasurementSaved(true);
      setShowMeasurementForm(false);

      // Optimistically update local state
      setMeasurements(prev => ({ ...prev, ...payload }));
      setTimeout(() => setMeasurementSaved(false), 4000);
    } catch (err) {
      console.error('❌ Save measurements error:', err);
      alert('Failed to save measurements: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingMeasurements(false);
    }
  };

  const submitFeedback = async () => {
    if (!selectedSize) { alert('Please select a size first.'); return; }
    setSubmittingFeedback(true);
    console.log('📝 [SizePrediction] Submitting feedback:', {
      productId, productType, size: selectedSize.size,
      fitRating: feedbackRating, fitIssues: feedbackIssues,
      category: productCategory,
    });
    try {
      await axios.post('http://localhost:5000/api/size/detailed-feedback', {
        productId,
        productType,
        size:         selectedSize.size,
        fitRating:    feedbackRating,
        fitIssues:    feedbackIssues,
        comfortLevel: feedbackRating >= 4 ? 'comfortable' : 'uncomfortable',
        notes:        feedbackNotes,
        wouldRecommend: feedbackRating >= 4,
        category:     productCategory,
      }, { headers: { Authorization: `Bearer ${token}` } });

      console.log('✅ Feedback submitted successfully');
      setFeedbackSuccess(true);
      setShowFeedbackForm(false);
      // Optimistically add to local feedback list
      setFeedback(prev => [{
        productId, productType, size: selectedSize.size,
        fitRating: feedbackRating, fitIssues: feedbackIssues,
        category: productCategory, createdAt: new Date().toISOString(),
      }, ...prev]);
      setTimeout(() => setFeedbackSuccess(false), 4000);
    } catch (err) {
      console.error('❌ Feedback error:', err);
      alert('Failed to submit feedback: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingFeedback(false);
      setFeedbackRating(3);
      setFeedbackIssues([]);
      setFeedbackNotes('');
    }
  };

  // ════════════════════════════════════════
  //  RENDER HELPERS
  // ════════════════════════════════════════

  /** Small badge showing if a size is in stock for this product */
  const StockBadge = ({ sizeLabel, isMeter = false }) => {
    const list  = isMeter ? meterSizes : productSizes;
    const entry = list?.find(s => s.size?.toString() === sizeLabel?.toString());
    if (!entry)           return <span className="badge bg-secondary ms-2">Not in product</span>;
    if (entry.stock <= 0) return <span className="badge bg-danger ms-2">Out of stock</span>;
    return (
      <span className="badge ms-2" style={{ background: '#22c55e', color: '#fff' }}>
        {entry.stock} in stock
      </span>
    );
  };

  /** Select button for a size */
  const SelectBtn = ({ sizeLabel, isMeter = false, variant = 'primary' }) => {
    const list  = isMeter ? meterSizes : productSizes;
    const entry = list?.find(s => s.size?.toString() === sizeLabel?.toString());
    const avail = entry && entry.stock > 0;
    if (!avail) return null;
    return (
      <button
        className={`btn btn-sm mt-2 ${variant === 'primary' ? 'btn-danger' : 'btn-outline-danger'}`}
        onClick={() => selectSize(sizeLabel, isMeter)}
        style={{ borderRadius: 20, fontSize: 12, fontWeight: 600 }}
      >
        Select {isMeter ? `${sizeLabel} meter` : sizeLabel}
      </button>
    );
  };

  // ── 1. Order card ──
  const renderOrderCard = () => {
    if (!orderBasedInfo) {
      return (
        <div className="sp-card sp-card--muted mb-3">
          <div className="sp-card__icon"><i className="bi bi-box-fill"></i></div>
          <div className="sp-card__body">
            <div className="sp-card__title">From Your Orders</div>
            <div className="sp-card__sub text-muted" style={{ fontSize: 12 }}>
              You haven't ordered this item before — no order-based recommendation available.
            </div>
          </div>
        </div>
      );
    }

    const { size, orderDate, productName, orderStatus } = orderBasedInfo;
    const dateStr = orderDate ? new Date(orderDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';

    return (
      <div className="sp-card sp-card--white border-dark mb-3">
        <div className="sp-card__icon"><i className="bi bi-box-fill"></i></div>
        <div className="sp-card__body">
          <div className="sp-card__title">
            From Your Orders
            <span className="sp-card__badge sp-card__badge--blue ms-2">This exact product</span>
          </div>
          <div className="sp-card__sub">
            You ordered this item{dateStr && ` in ${dateStr}`} in size&nbsp;
            <strong>{size?.toUpperCase()}</strong>
            <StockBadge sizeLabel={size} />
          </div>
          <SelectBtn sizeLabel={size} />
        </div>
        <div className="sp-card__size-display">{size?.toUpperCase()}</div>
      </div>
    );
  };

  // ── 2A. 5★ feedback card ──
  const renderPerfectFeedbackCard = () => {
    if (!perfectFeedback) {
      return (
        <div className="sp-card sp-card--muted mb-3">
          <div className="sp-card__icon"><i className="bi bi-star-fill"></i></div>
          <div className="sp-card__body">
            <div className="sp-card__title">5★ Confirmed Fit</div>
            <div className="sp-card__sub text-muted" style={{ fontSize: 12 }}>
              No perfect-fit feedback yet for this product or category.
            </div>
          </div>
        </div>
      );
    }

    const { size, matchType, category } = perfectFeedback;
    const matchLabel = matchType === 'exact' ? 'This product' : `${category} category`;

    return (
      <div className="sp-card sp-card--white border-dark mb-3">
        <div className="sp-card__icon"><i className="bi bi-star-fill"></i></div>
        <div className="sp-card__body">
          <div className="sp-card__title">
            5★ Confirmed Fit
            <span className="sp-card__badge sp-card__badge--gold ms-2">{matchLabel}</span>
          </div>
          <div className="sp-card__sub">
            You loved size <strong>{size?.toUpperCase()}</strong> before — it's your perfect fit!
            <StockBadge sizeLabel={size} />
          </div>
          <SelectBtn sizeLabel={size} variant="primary" />
        </div>
        <div className="sp-card__size-display" style={{ color: '#d97706' }}>{size?.toUpperCase()}</div>
      </div>
    );
  };

  // ── 2B. 3-4★ feedback card ──
  const renderImperfectFeedbackCard = () => {
    if (!imperfectFeedback) return null;

    const { rating, size, fitIssues, suggestion, matchType, category } = imperfectFeedback;
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const matchLabel = matchType === 'exact' ? 'This product' : `${category || 'same category'}`;

    return (
      <div className="sp-card sp-card--orange mb-3">
        <div className="sp-card__icon"><i className="bi bi-arrow-repeat"></i></div>
        <div className="sp-card__body">
          <div className="sp-card__title">
            Decent Fit — Needs Adjustment
            <span className="sp-card__badge sp-card__badge--orange ms-2">{matchLabel}</span>
          </div>
          <div className="sp-card__sub">
            You rated size <strong>{size?.toUpperCase()}</strong>&nbsp;
            <span style={{ color: '#d97706', fontWeight: 700 }}>{stars}</span>
            {fitIssues.length > 0 && (
              <> with issues: {fitIssues.map(i => (
                <span key={i} className="badge bg-light text-dark me-1 border" style={{ fontSize: 10 }}>
                  {i.replace(/_/g, ' ')}
                </span>
              ))}</>
            )}
          </div>
          {suggestion && (
            <div className="sp-card__suggestion mt-2">
              <i className="bi bi-arrow-right-circle me-1"></i>
              <strong>Try {suggestion.suggestedSize?.toUpperCase()}</strong>&nbsp;·&nbsp;
              <span style={{ fontSize: 12 }}>{suggestion.reason}</span>
              {productType === 'dress' && suggestion.nextRow && (
                <div className="sp-card__next-size-details mt-1">
                  <small className="text-muted">
                    {suggestion.suggestedSize} range →&nbsp;
                    Chest: {suggestion.nextRow.chest[0]}–{suggestion.nextRow.chest[1]}cm&nbsp;
                    ({cmToInches(suggestion.nextRow.chest[0])}–{cmToInches(suggestion.nextRow.chest[1])}")&nbsp;·&nbsp;
                    Waist: {suggestion.nextRow.waist[0]}–{suggestion.nextRow.waist[1]}cm
                  </small>
                </div>
              )}
              {productType === 'jewellery' && suggestion.nextEntry && (
                <div className="sp-card__next-size-details mt-1">
                  <small className="text-muted">
                    US {suggestion.nextEntry.us} →&nbsp;
                    ∅ {suggestion.nextEntry.diameterMm}mm / {mmToInches(suggestion.nextEntry.diameterMm)}" /&nbsp;
                    {mmToCm(suggestion.nextEntry.diameterMm)}cm
                  </small>
                </div>
              )}
              <div className="mt-1">
                <StockBadge sizeLabel={suggestion.suggestedSize} />
                <SelectBtn sizeLabel={suggestion.suggestedSize} variant="secondary" />
              </div>
            </div>
          )}
        </div>
        <div className="sp-card__size-display" style={{ color: '#d97706', opacity: 0.6, textDecoration: 'line-through' }}>
          {size?.toUpperCase()}
        </div>
      </div>
    );
  };

  // ── 3. Measurement card ──
  const renderMeasurementCard = () => {
    if (!measurementPrediction) {
      return (
        <div className="sp-card sp-card--muted mb-3">
          <div className="sp-card__icon"><i className="bi bi-rulers"></i></div>
          <div className="sp-card__body">
            <div className="sp-card__title">From Your Measurements</div>
            <div className="sp-card__sub text-muted" style={{ fontSize: 12 }}>
              {measurements
                ? 'Measurements on file but insufficient for prediction. Add chest/waist/hips (dress) or ring size (jewellery).'
                : 'No measurements on file. Add yours below for a precise size recommendation.'}
            </div>
            <button
              className="btn btn-sm btn-outline-danger mt-2"
              style={{ borderRadius: 20, fontSize: 12 }}
              onClick={() => setShowMeasurementForm(true)}
            >
              <i className="bi bi-rulers me-1"></i>
              Add My Measurements
            </button>
          </div>
        </div>
      );
    }

    if (productType === 'dress') {
      const { standard, meter } = measurementPrediction;

      return (
        <div className="sp-card sp-card--purple mb-3">
          <div className="sp-card__icon"><i className="bi bi-rulers"></i></div>
          <div className="sp-card__body">
            <div className="sp-card__title">
              From Your Measurements
              <span className="sp-card__badge sp-card__badge--purple ms-2">
                Globally accepted size math
              </span>
            </div>

            {/* Standard size section */}
            {standard && (
              <div className="sp-meas-block mt-2">
                <div className="sp-meas-block__label">STANDARD SIZE</div>
                <div className="d-flex align-items-center flex-wrap gap-2 mt-1">
                  <span className="sp-size-pill">{standard.size}</span>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    {standard.label} · US {standard.intlUS} · UK {standard.intlUK}
                  </span>
                  <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
                    {standard.confidence}% match
                  </span>
                </div>

                {/* Measurement breakdown */}
                <div className="sp-meas-breakdown mt-2">
                  {standard.chestCm && (
                    <div className="sp-meas-row">
                      <span className="sp-meas-label">Chest</span>
                      <span className="sp-meas-values">
                        <strong>{standard.chestCm} cm</strong>
                        <span className="text-muted ms-1">/ {standard.chestIn}"</span>
                      </span>
                      <span className="sp-meas-range">
                        {standard.sizeRow.chest[0]}–{standard.sizeRow.chest[1]} cm for {standard.size}
                      </span>
                      {standard.fit.chest === 'above' &&
                        <span className="sp-meas-warn">↑ Consider {standard.secondSize}</span>}
                    </div>
                  )}
                  {standard.waistCm && (
                    <div className="sp-meas-row">
                      <span className="sp-meas-label">Waist</span>
                      <span className="sp-meas-values">
                        <strong>{standard.waistCm} cm</strong>
                        <span className="text-muted ms-1">/ {standard.waistIn}"</span>
                      </span>
                      <span className="sp-meas-range">
                        {standard.sizeRow.waist[0]}–{standard.sizeRow.waist[1]} cm for {standard.size}
                      </span>
                    </div>
                  )}
                  {standard.hipsCm && (
                    <div className="sp-meas-row">
                      <span className="sp-meas-label">Hips</span>
                      <span className="sp-meas-values">
                        <strong>{standard.hipsCm} cm</strong>
                        <span className="text-muted ms-1">/ {standard.hipsIn}"</span>
                      </span>
                      <span className="sp-meas-range">
                        {standard.sizeRow.hips[0]}–{standard.sizeRow.hips[1]} cm for {standard.size}
                      </span>
                    </div>
                  )}
                </div>

                {!standard.availableInProduct && (
                  <div className="alert alert-warning py-1 px-2 mt-2 mb-0" style={{ fontSize: 11 }}>
                    ⚠️ Size <strong>{standard.size}</strong> is not listed for this product.
                  </div>
                )}

                <SelectBtn sizeLabel={standard.size} />
              </div>
            )}

            {/* Meter size section */}
            {meter && (
              <div className="sp-meas-block mt-3 pt-2" style={{ borderTop: '1px dashed #e9d5ff' }}>
                <div className="sp-meas-block__label">METER / FABRIC SIZE</div>
                <div className="d-flex align-items-center flex-wrap gap-2 mt-1">
                  <span className="sp-size-pill sp-size-pill--meter">{meter.size}</span>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    {meter.label}
                  </span>
                </div>
                <div className="sp-meas-breakdown mt-2">
                  <div className="sp-meas-row">
                    <span className="sp-meas-label">Height</span>
                    <span className="sp-meas-values">
                      <strong>{meter.heightCm} cm</strong>
                      <span className="text-muted ms-1">/ {meter.heightFt}</span>
                      <span className="text-muted ms-1">/ {meter.heightIn}"</span>
                    </span>
                    <span className="sp-meas-range">Range: {meter.rangeLabel}</span>
                  </div>
                </div>

                {!meter.availableInProduct && meterSizes && meterSizes.length > 0 && (
                  <div className="alert alert-warning py-1 px-2 mt-2 mb-0" style={{ fontSize: 11 }}>
                    ⚠️ Meter size <strong>{meter.size}</strong> is not listed for this product.
                  </div>
                )}

                {meterSizes && meterSizes.length > 0 && (
                  <SelectBtn sizeLabel={meter.size} isMeter />
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (productType === 'jewellery') {
      const { ring } = measurementPrediction;

      return (
        <div className="sp-card sp-card--white border-dark mb-3">
          <div className="sp-card__icon"><i className="bi bi-ring"></i></div>
          <div className="sp-card__body">
            <div className="sp-card__title">
              From Your Measurements
              <span className="sp-card__badge sp-card__badge--purple ms-2">
                ISO 8653:2016 standard
              </span>
            </div>

            <div className="sp-meas-block mt-2">
              <div className="sp-meas-block__label">RING SIZE</div>
              <div className="d-flex align-items-center flex-wrap gap-2 mt-1">
                <span className="sp-size-pill">US {ring.usSize}</span>
              </div>

              {/* Comprehensive ring measurements */}
              <div className="sp-ring-grid mt-2">
                <div className="sp-ring-cell">
                  <div className="sp-ring-cell__label">Circumference</div>
                  <div className="sp-ring-cell__primary">{ring.circumferenceMm} mm</div>
                  <div className="sp-ring-cell__secondary">
                    {ring.circumferenceCm} cm &nbsp;·&nbsp; {ring.circumferenceIn}"
                  </div>
                </div>
                <div className="sp-ring-cell">
                  <div className="sp-ring-cell__label">Diameter (∅)</div>
                  <div className="sp-ring-cell__primary">{ring.diameterMm} mm</div>
                  <div className="sp-ring-cell__secondary">
                    {ring.diameterCm} cm &nbsp;·&nbsp; {ring.diameterIn}"
                  </div>
                </div>
              </div>

              {(ring.prevUS || ring.nextUS) && (
                <div className="sp-ring-neighbors mt-2">
                  <small className="text-muted">Adjacent sizes: </small>
                  {ring.prevUS && <span className="badge border text-muted me-1">US {ring.prevUS} (smaller)</span>}
                  {ring.nextUS && <span className="badge border text-muted">US {ring.nextUS} (larger)</span>}
                </div>
              )}

              {!ring.availableInProduct && (
                <div className="alert alert-warning py-1 px-2 mt-2 mb-0" style={{ fontSize: 11 }}>
                  ⚠️ Ring size US <strong>{ring.usSize}</strong> is not listed for this product.
                </div>
              )}

              <SelectBtn sizeLabel={ring.usSize} />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // ── Dress measurement form ──
  const renderDressMeasurementForm = () => {
    const dm = dressMeasurements;
    const setDm = (field, key, val) =>
      setDressMeasurements(prev => ({ ...prev, [field]: { ...prev[field], [key]: val } }));

    // Live preview as user types
    const liveStandard = predictDressSizeFromMeasurements(
      Object.fromEntries(Object.entries(dm).map(([k, v]) => [k, v.value ? v : undefined]).filter(([, v]) => v))
    );
    const liveMeter = predictMeterSize(
      dm.height.value ? { height: dm.height } : {}
    );

    return (
      <div className="sp-form mt-3">
        <div className="sp-form__header">
          <i className="bi bi-rulers me-2"></i>
          Your Body Measurements
        </div>
        <div className="sp-form__note">
          Enter measurements in any unit — we'll handle the conversion. All fields optional but more = better accuracy.
        </div>

        <div className="row g-2 mt-1">
          {[
            { field: 'height', label: 'Height', units: ['cm', 'inch', 'ft'], placeholder: '165' },
            { field: 'weight', label: 'Weight', units: ['kg', 'lbs'],        placeholder: '60'  },
          ].map(({ field, label, units, placeholder }) => (
            <div className="col-6" key={field}>
              <label className="sp-form__label">{label}</label>
              <div className="input-group input-group-sm">
                <input
                  type="number"
                  className="form-control"
                  placeholder={placeholder}
                  value={dm[field].value}
                  onChange={e => setDm(field, 'value', e.target.value)}
                />
                <select
                  className="form-select"
                  style={{ maxWidth: 65 }}
                  value={dm[field].unit}
                  onChange={e => setDm(field, 'unit', e.target.value)}
                >
                  {units.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          ))}
          {[
            { field: 'chest', label: 'Bust / Chest', placeholder: '88' },
            { field: 'waist', label: 'Waist',        placeholder: '72' },
            { field: 'hips',  label: 'Hips',         placeholder: '96' },
          ].map(({ field, label, placeholder }) => (
            <div className="col-4" key={field}>
              <label className="sp-form__label">{label}</label>
              <div className="input-group input-group-sm">
                <input
                  type="number"
                  className="form-control"
                  placeholder={placeholder}
                  value={dm[field].value}
                  onChange={e => setDm(field, 'value', e.target.value)}
                />
                <span className="input-group-text" style={{ fontSize: 11 }}>cm</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live preview */}
        {(liveStandard || liveMeter) && (
          <div className="sp-form__preview mt-3">
            <div className="sp-form__preview-label">Live preview</div>
            <div className="d-flex gap-3 flex-wrap mt-1">
              {liveStandard && (
                <div>
                  <span className="sp-size-pill" style={{ fontSize: 16 }}>{liveStandard.size}</span>
                  <small className="text-muted ms-1">standard</small>
                </div>
              )}
              {liveMeter && (
                <div>
                  <span className="sp-size-pill sp-size-pill--meter" style={{ fontSize: 16 }}>{liveMeter.size}</span>
                  <small className="text-muted ms-1">meter</small>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          className="btn btn-danger w-100 mt-3"
          style={{ borderRadius: 10, fontWeight: 600 }}
          onClick={saveMeasurements}
          disabled={savingMeasurements}
        >
          {savingMeasurements
            ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
            : <><i className="bi bi-check2-circle me-2" />Save My Measurements</>}
        </button>
      </div>
    );
  };

  // ── Jewellery measurement form ──
  const renderJewelleryMeasurementForm = () => {
    // Live ring preview
    const liveRing = ringInput.value
      ? predictRingSize({ ringSize: { value: parseFloat(ringInput.value), unit: ringInput.unit } })
      : null;

    return (
      <div className="sp-form mt-3">
        <div className="sp-form__header">
          <i className="bi bi-gem me-2"></i>
          Your Ring Size
        </div>
        <div className="sp-form__note">
          Wrap a string around your finger, mark where it meets, and measure that length — that's your circumference.
          Or measure the diameter (width) across the ring hole. We'll calculate your US size.
        </div>

        <div className="row g-2 mt-1">
          <div className="col-12">
            <label className="sp-form__label">Ring Measurement</label>
            <div className="input-group input-group-sm">
              <input
                type="number"
                step="0.1"
                className="form-control"
                placeholder="e.g. 54.4 (circumference) or 17.3 (diameter)"
                value={ringInput.value}
                onChange={e => setRingInput(prev => ({ ...prev, value: e.target.value }))}
              />
              <select
                className="form-select"
                style={{ maxWidth: 70 }}
                value={ringInput.unit}
                onChange={e => setRingInput(prev => ({ ...prev, unit: e.target.value }))}
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="inch">inch</option>
              </select>
            </div>
            <div className="sp-form__hint">
              Values &lt; 25mm are treated as diameter; values ≥ 25mm as circumference.
            </div>
          </div>
        </div>

        {/* Live ring preview */}
        {liveRing && (
          <div className="sp-form__preview mt-3">
            <div className="sp-form__preview-label">Live preview</div>
            <div className="sp-ring-grid mt-2">
              <div className="sp-ring-cell">
                <div className="sp-ring-cell__label">US Size</div>
                <div className="sp-ring-cell__primary" style={{ fontSize: 22, color: '#7c3aed' }}>
                  {liveRing.usSize}
                </div>
              </div>
              <div className="sp-ring-cell">
                <div className="sp-ring-cell__label">Diameter</div>
                <div className="sp-ring-cell__primary">{liveRing.diameterMm} mm</div>
                <div className="sp-ring-cell__secondary">{liveRing.diameterIn}" / {liveRing.diameterCm} cm</div>
              </div>
              <div className="sp-ring-cell">
                <div className="sp-ring-cell__label">Circumference</div>
                <div className="sp-ring-cell__primary">{liveRing.circumferenceMm} mm</div>
                <div className="sp-ring-cell__secondary">{liveRing.circumferenceIn}" / {liveRing.circumferenceCm} cm</div>
              </div>
            </div>
          </div>
        )}

        <button
          className="btn btn-danger w-100 mt-3"
          style={{ borderRadius: 10, fontWeight: 600 }}
          onClick={saveMeasurements}
          disabled={savingMeasurements}
        >
          {savingMeasurements
            ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
            : <><i className="bi bi-check2-circle me-2" />Save Ring Size</>}
        </button>
      </div>
    );
  };

  // ── Feedback form ──
  const renderFeedbackForm = () => {
    const issueOptions = productType === 'dress'
      ? [
          { id: 'too_tight_chest',   label: '😤 Tight chest'   },
          { id: 'too_loose_chest',   label: '👕 Loose chest'   },
          { id: 'too_tight_waist',   label: '😤 Tight waist'   },
          { id: 'too_loose_waist',   label: '👕 Loose waist'   },
          { id: 'too_long',          label: '📏 Too long'       },
          { id: 'too_short',         label: '📏 Too short'      },
        ]
      : [
          { id: 'too_tight', label: '😤 Too tight' },
          { id: 'too_loose', label: '👕 Too loose' },
          { id: 'uncomfortable', label: '😣 Uncomfortable' },
        ];

    const emojis = { 1: '😫', 2: '😕', 3: '😐', 4: '🙂', 5: '😍' };
    const labels = { 1: 'Terrible', 2: 'Poor', 3: 'Okay', 4: 'Good', 5: 'Perfect!' };

    return (
      <div className="sp-form sp-form--feedback mt-3">
        <div className="sp-form__header">
          <i className="bi bi-chat-heart me-2"></i>
          How does it fit?
        </div>
        <div className="sp-form__note">
          Your feedback teaches our AI. 5★ locks in this size for future recommendations.
        </div>

        <div className="mt-3">
          <label className="sp-form__label">Rating</label>
          <div className="d-flex gap-2">
            {[1, 2, 3, 4, 5].map(r => (
              <button
                key={r}
                className={`sp-rating-btn ${feedbackRating === r ? 'sp-rating-btn--active' : ''}`}
                onClick={() => setFeedbackRating(r)}
                title={labels[r]}
              >
                <span style={{ fontSize: 18 }}>{emojis[r]}</span>
                <span style={{ fontSize: 10, display: 'block' }}>{labels[r]}</span>
              </button>
            ))}
          </div>

          {feedbackRating === 5 && (
            <div className="alert alert-success py-2 px-3 mt-2 mb-0" style={{ fontSize: 12 }}>
              ⭐ Perfect fit! We'll remember size <strong>{selectedSize?.size}</strong> for this product.
            </div>
          )}
          {feedbackRating >= 3 && feedbackRating < 5 && (
            <div className="alert alert-warning py-2 px-3 mt-2 mb-0" style={{ fontSize: 12 }}>
              💡 We'll show you a size adjustment suggestion based on your issues.
            </div>
          )}
        </div>

        {feedbackRating < 5 && (
          <div className="mt-3">
            <label className="sp-form__label">What was wrong?</label>
            <div className="d-flex flex-wrap gap-2">
              {issueOptions.map(({ id, label }) => (
                <button
                  key={id}
                  className={`sp-issue-btn ${feedbackIssues.includes(id) ? 'sp-issue-btn--active' : ''}`}
                  onClick={() => setFeedbackIssues(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3">
          <label className="sp-form__label">Notes (optional)</label>
          <textarea
            className="form-control"
            rows={2}
            placeholder="Any additional comments..."
            value={feedbackNotes}
            onChange={e => setFeedbackNotes(e.target.value)}
            style={{ fontSize: 13 }}
          />
        </div>

        <div className="d-flex gap-2 mt-3">
          <button
            className="btn btn-danger flex-fill"
            style={{ borderRadius: 10, fontWeight: 600 }}
            onClick={submitFeedback}
            disabled={submittingFeedback}
          >
            {submittingFeedback
              ? <><span className="spinner-border spinner-border-sm me-2" />Submitting...</>
              : 'Submit Feedback'}
          </button>
          <button
            className="btn btn-outline-secondary"
            style={{ borderRadius: 10 }}
            onClick={() => setShowFeedbackForm(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════
  //  EARLY RETURNS
  // ════════════════════════════════════════
  if (!isAuthenticated) return null;
  if (loading) {
    return (
      <div className="sp-loading text-center py-3">
        <div className="spinner-border text-danger" style={{ width: 28, height: 28 }} />
        <div className="text-muted mt-2" style={{ fontSize: 12 }}>Loading smart size data...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="alert alert-warning d-flex gap-2 align-items-center" style={{ fontSize: 13 }}>
        <i className="bi bi-exclamation-triangle"></i>
        <span>Size assistant unavailable: {error}</span>
      </div>
    );
  }

  // ════════════════════════════════════════
  //  MAIN RENDER
  // ════════════════════════════════════════
  return (
    <div className="sp-root mt-4 container-fluid ">
      {/* Header */}
      <div className="sp-header mb-3">
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: 20 }}></span>
          <div>
            <h2 className="sp-header__title text-uppercase">DAG AI Smart Size Assistant</h2>
            <div className="sp-header__sub">Powered by your order history, feedback & measurements</div>
          </div>
        </div>
      </div>

      {/* Success toasts */}
      {measurementSaved && (
        <div className="alert alert-success py-2 mb-3 d-flex gap-2 align-items-center" style={{ fontSize: 13 }}>
          <i className="bi bi-check-circle-fill"></i>
          Measurements saved! Recommendations updated.
        </div>
      )}
      {feedbackSuccess && (
        <div className="alert alert-success py-2 mb-3 d-flex gap-2 align-items-center" style={{ fontSize: 13 }}>
          <i className="bi bi-heart-fill"></i>
          Feedback submitted! Thank you — your AI profile is updated.
        </div>
      )}

      {/* Cards */}
      {renderOrderCard()}
      {renderPerfectFeedbackCard()}
      {renderImperfectFeedbackCard()}
      {renderMeasurementCard()}

      {/* Action buttons */}
      <div className="d-flex flex-wrap gap-2 mt-2">
        <button
          className="btn btn-sm btn-outline-danger"
          style={{ borderRadius: 20, fontSize: 12 }}
          onClick={() => { setShowMeasurementForm(v => !v); setShowFeedbackForm(false); }}
        >
          <i className="bi bi-rulers me-1"></i>
          {showMeasurementForm ? 'Hide Form' : measurements ? 'Update Measurements' : 'Add Measurements'}
        </button>
        {selectedSize && !showFeedbackForm && (
          <button
            className="btn btn-sm btn-outline-secondary"
            style={{ borderRadius: 20, fontSize: 12 }}
            onClick={() => { setShowFeedbackForm(true); setShowMeasurementForm(false); }}
          >
            <i className="bi bi-chat-heart me-1"></i>
            Rate Fit of {selectedSize.size?.toUpperCase()}
          </button>
        )}
      </div>

      {/* Forms */}
      {showMeasurementForm && (
        productType === 'dress'
          ? renderDressMeasurementForm()
          : renderJewelleryMeasurementForm()
      )}
      {showFeedbackForm && renderFeedbackForm()}

      {/* Inline scoped styles */}
      <style>{`
        .sp-root { font-family: inherit; }
        .sp-header { padding: 12px 16px; background: linear-gradient(135deg, #fefefe, #ffffff);  border: 1px solid #fecaca; }
        .sp-header__title { font-weight: 700; font-size: 15px; color: #1f2937; }
        .sp-header__sub   { font-size: 11px; color: #6b7280; margin-top: 1px; }

        /* ── CARDS ── */
        .sp-card { display: flex; gap: 12px; padding: 14px 16px; border-radius: 12px; border: 1.5px solid transparent; transition: box-shadow .2s; }
        .sp-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
        .sp-card__icon { font-size: 22px; flex-shrink: 0; line-height: 1; margin-top: 2px; }
        .sp-card__body { flex: 1; min-width: 0; }
        .sp-card__title { font-weight: 700; font-size: 13px; color: #1f2937; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
        .sp-card__sub   { font-size: 13px; color: #374151; margin-top: 4px; }
        .sp-card__size-display { font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #dc2626; flex-shrink: 0; align-self: center; }

        .sp-card--blue   { background: #eff6ff; border-color: #bfdbfe; }
        .sp-card--gold   { background: #fffbeb; border-color: #fde68a; }
        .sp-card--orange { background: #fff7ed; border-color: #fed7aa; }
        .sp-card--purple { background: #f5f3ff; border-color: #ddd6fe; }
        .sp-card--muted  { background: #f9fafb; border-color: #e5e7eb; opacity: .85; }

        .sp-card__badge { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 20px; white-space: nowrap; }
        .sp-card__badge--blue   { background: #dbeafe; color: #1d4ed8; }
        .sp-card__badge--gold   { background: #fef3c7; color: #b45309; }
        .sp-card__badge--orange { background: #ffedd5; color: #c2410c; }
        .sp-card__badge--purple { background: #ede9fe; color: #7c3aed; }

        .sp-card__suggestion { padding: 8px 10px; background: rgba(255,255,255,.7); border-radius: 8px; border: 1px solid #fed7aa; }
        .sp-card__next-size-details { padding: 4px 8px; background: #f9fafb; border-radius: 6px; }

        /* ── MEASUREMENT BREAKDOWN ── */
        .sp-meas-block {}
        .sp-meas-block__label { font-size: 10px; font-weight: 700; letter-spacing: .08em; color: #9ca3af; text-transform: uppercase; }
        .sp-meas-breakdown { display: flex; flex-direction: column; gap: 4px; }
        .sp-meas-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; font-size: 12px; }
        .sp-meas-label  { font-weight: 600; color: #6b7280; width: 52px; flex-shrink: 0; }
        .sp-meas-values { color: #111827; }
        .sp-meas-range  { color: #9ca3af; font-size: 11px; }
        .sp-meas-warn   { color: #f59e0b; font-size: 11px; font-weight: 600; }

        /* ── SIZE PILLS ── */
        .sp-size-pill       { display: inline-block; background: #dc2626; color: #fff; font-weight: 800; font-size: 18px; padding: 2px 12px; border-radius: 8px; letter-spacing: -.5px; }
        .sp-size-pill--meter{ background: #7c3aed; }

        /* ── RING GRID ── */
        .sp-ring-grid   { display: flex; gap: 12px; flex-wrap: wrap; }
        .sp-ring-cell   { flex: 1; min-width: 110px; background: rgba(255,255,255,.8); border-radius: 8px; padding: 8px 12px; border: 1px solid #e9d5ff; }
        .sp-ring-cell__label     { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #9ca3af; font-weight: 600; }
        .sp-ring-cell__primary   { font-size: 18px; font-weight: 800; color: #1f2937; }
        .sp-ring-cell__secondary { font-size: 11px; color: #6b7280; margin-top: 2px; }
        .sp-ring-neighbors { }

        /* ── FORMS ── */
        .sp-form         { padding: 16px; background: #f8fafc; border-radius: 12px; border: 1.5px solid #e5e7eb; }
        .sp-form--feedback { border-color: #fecaca; background: #fff5f5; }
        .sp-form__header { font-weight: 700; font-size: 14px; color: #1f2937; }
        .sp-form__note   { font-size: 11px; color: #6b7280; margin-top: 4px; line-height: 1.5; }
        .sp-form__label  { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; display: block; }
        .sp-form__hint   { font-size: 10px; color: #9ca3af; margin-top: 3px; }
        .sp-form__preview { background: rgba(124,58,237,.05); border-radius: 8px; padding: 10px 12px; border: 1px solid #ddd6fe; }
        .sp-form__preview-label { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #9ca3af; font-weight: 600; }

        /* ── RATING BUTTONS ── */
        .sp-rating-btn { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px 4px; background: #f3f4f6; border: 2px solid transparent; border-radius: 10px; cursor: pointer; transition: all .15s; font-size: 12px; color: #6b7280; }
        .sp-rating-btn:hover { background: #fee2e2; border-color: #fca5a5; }
        .sp-rating-btn--active { background: #fef2f2; border-color: #dc2626; color: #dc2626; font-weight: 700; }

        /* ── ISSUE BUTTONS ── */
        .sp-issue-btn { padding: 5px 10px; background: #f3f4f6; border: 1.5px solid #d1d5db; border-radius: 20px; font-size: 12px; cursor: pointer; transition: all .15s; }
        .sp-issue-btn:hover { background: #fee2e2; border-color: #fca5a5; }
        .sp-issue-btn--active { background: #fef2f2; border-color: #dc2626; color: #dc2626; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default SizePrediction;