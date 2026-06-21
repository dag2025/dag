// models/FitFeedback.js
import mongoose from 'mongoose';

const fitFeedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  productType: { type: String, enum: ['dress', 'jewellery'], required: true },
  size: { type: String, required: true },
  fitRating: { type: Number, min: 1, max: 5, required: true },
  fitIssues: [{ type: String }], // e.g., ['too_tight_waist', 'loose_shoulders']
  comfortLevel: { type: String, enum: ['comfortable', 'uncomfortable', 'very_comfortable'] },
  notes: String,
  wouldRecommend: Boolean,
  measurements: {
    height: { value: Number, unit: String },
    weight: { value: Number, unit: String },
    chest: { value: Number, unit: String },
    waist: { value: Number, unit: String },
    hips: { value: Number, unit: String }
  },
  category: String,
  createdAt: { type: Date, default: Date.now }
});

fitFeedbackSchema.index({ userId: 1, productType: 1 });
fitFeedbackSchema.index({ fitRating: 1 });

export default mongoose.model('FitFeedback', fitFeedbackSchema);